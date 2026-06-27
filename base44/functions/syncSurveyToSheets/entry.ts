import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const SPREADSHEET_TITLE = "Bytly - تسجيلات المستخدمين";
const SHEET_NAME = "استطلاعات الرأي";

const HEADERS = [
  "التاريخ",
  "نوع المستخدم",
  "الخدمة الأكثر احتياجاً",
  "أكبر تحدٍ",
  "مدى الاهتمام",
  "تقييم الفكرة (1-5)",
  "الاستعداد للدفع",
  "البريد الإلكتروني",
  "الاسم",
  "ملاحظات إضافية",
  "الصفحة المصدر",
];

async function getSpreadsheetId(base44) {
  // 1) Try NotificationSettings
  try {
    const settings = await base44.asServiceRole.entities.NotificationSettings.filter({ user_email: "system@bytly.com" });
    if (settings.length > 0 && settings[0].reminder_timing?.spreadsheet_id) {
      return settings[0].reminder_timing.spreadsheet_id;
    }
  } catch (e) {
    console.log("No stored spreadsheet ID in settings");
  }

  // 2) Search Google Drive by title
  try {
    const { accessToken: driveToken } = await base44.asServiceRole.connectors.getConnection("googledrive");
    const driveRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(`name='${SPREADSHEET_TITLE}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`)}&fields=files(id,name)`,
      { headers: { "Authorization": `Bearer ${driveToken}` } }
    );
    if (driveRes.ok) {
      const driveData = await driveRes.json();
      if (driveData.files?.length > 0) return driveData.files[0].id;
    }
  } catch (e) {
    console.log("Drive search failed:", e.message);
  }

  return null;
}

async function ensureSheetTab(accessToken, spreadsheetId) {
  // Check if the sheet tab exists
  const metaRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties`,
    { headers: { "Authorization": `Bearer ${accessToken}` } }
  );
  if (!metaRes.ok) throw new Error("Failed to fetch spreadsheet metadata");

  const meta = await metaRes.json();
  const exists = (meta.sheets || []).some(s => s.properties?.title === SHEET_NAME);

  if (!exists) {
    // Create the tab
    const addRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
      {
        method: "POST",
        headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          requests: [{
            addSheet: {
              properties: { title: SHEET_NAME },
            },
          }],
        }),
      }
    );
    if (!addRes.ok) {
      const err = await addRes.text();
      throw new Error(`Failed to create sheet tab: ${err}`);
    }
  }

  // Write headers (idempotent — only writes if row 1 is empty)
  const headerRange = `${SHEET_NAME}!A1:K1`;
  const headerReadRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(headerRange)}`,
    { headers: { "Authorization": `Bearer ${accessToken}` } }
  );
  if (headerReadRes.ok) {
    const headerData = await headerReadRes.json();
    if (!headerData.values || headerData.values.length === 0) {
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(headerRange)}?valueInputOption=USER_ENTERED`,
        {
          method: "PUT",
          headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
          body: JSON.stringify({ values: [HEADERS] }),
        }
      );
    }
  }
}

async function appendRow(accessToken, spreadsheetId, values) {
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(SHEET_NAME)}!A:K:append?valueInputOption=USER_ENTERED`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ values: [values] }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to append survey row: ${error}`);
  }

  return await response.json();
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    // Entity automation payload: { event, data, old_data }
    const survey = body?.data || body;
    const eventType = body?.event?.type;

    // Only handle create events (or direct calls without event)
    if (eventType && eventType !== "create") {
      return Response.json({ success: true, message: "Not a create event, skipping" });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection("googlesheets");
    const spreadsheetId = await getSpreadsheetId(base44);

    if (!spreadsheetId) {
      console.log("Spreadsheet not found — survey not synced");
      return Response.json({ success: false, message: "Spreadsheet not found" });
    }

    await ensureSheetTab(accessToken, spreadsheetId);

    const now = new Date().toLocaleString("ar-SA", { timeZone: "Asia/Riyadh" });

    await appendRow(accessToken, spreadsheetId, [
      now,
      survey.user_role || "",
      survey.primary_need || "",
      survey.biggest_challenge || "",
      survey.platform_interest || "",
      survey.concept_rating != null ? String(survey.concept_rating) : "",
      survey.willing_to_pay || "",
      survey.respondent_email || "",
      survey.respondent_name || "",
      survey.additional_comments || "",
      survey.source_page || "",
    ]);

    console.log(`Survey response synced to Google Sheets (role: ${survey.user_role})`);

    return Response.json({
      success: true,
      message: "Survey response synced to Google Sheets",
      spreadsheet_url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
    });
  } catch (error) {
    console.error("Error syncing survey to Google Sheets:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});