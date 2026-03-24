import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const SPREADSHEET_TITLE = "Bytly - تسجيلات المستخدمين";

async function getAccessToken(base44) {
  return await base44.asServiceRole.connectors.getAccessToken("googlesheets");
}

async function createSpreadsheet(accessToken) {
  const response = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      properties: { title: SPREADSHEET_TITLE },
      sheets: [
        {
          properties: { title: "المهندسون", sheetId: 0 },
          data: [{
            startRow: 0,
            startColumn: 0,
            rowData: [{
              values: [
                { userEnteredValue: { stringValue: "التاريخ" } },
                { userEnteredValue: { stringValue: "الاسم الكامل" } },
                { userEnteredValue: { stringValue: "البريد الإلكتروني" } },
                { userEnteredValue: { stringValue: "رقم الهاتف" } },
                { userEnteredValue: { stringValue: "نوع المستخدم" } },
                { userEnteredValue: { stringValue: "التخصص" } },
                { userEnteredValue: { stringValue: "المدينة" } },
                { userEnteredValue: { stringValue: "الحالة" } }
              ]
            }]
          }]
        },
        {
          properties: { title: "العملاء", sheetId: 1 },
          data: [{
            startRow: 0,
            startColumn: 0,
            rowData: [{
              values: [
                { userEnteredValue: { stringValue: "التاريخ" } },
                { userEnteredValue: { stringValue: "الاسم الكامل" } },
                { userEnteredValue: { stringValue: "البريد الإلكتروني" } },
                { userEnteredValue: { stringValue: "رقم الهاتف" } },
                { userEnteredValue: { stringValue: "نوع العميل" } },
                { userEnteredValue: { stringValue: "المدينة" } },
                { userEnteredValue: { stringValue: "نوع الاشتراك" } }
              ]
            }]
          }]
        }
      ]
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create spreadsheet: ${error}`);
  }

  return await response.json();
}

async function appendRow(accessToken, spreadsheetId, sheetName, values) {
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A:Z:append?valueInputOption=USER_ENTERED`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        values: [values]
      })
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to append row: ${error}`);
  }

  return await response.json();
}

// Store spreadsheet ID in a simple way - we'll use a known sheet or create one
async function getOrCreateSpreadsheet(base44, accessToken) {
  // Try to get stored spreadsheet ID from settings
  try {
    const settings = await base44.asServiceRole.entities.NotificationSettings.filter({ user_email: "system@bytly.com" });
    if (settings.length > 0 && settings[0].reminder_timing?.spreadsheet_id) {
      return settings[0].reminder_timing.spreadsheet_id;
    }
  } catch (e) {
    console.log("No stored spreadsheet ID, creating new one...");
  }

  // Create new spreadsheet
  const sheet = await createSpreadsheet(accessToken);
  const spreadsheetId = sheet.spreadsheetId;

  // Store the ID
  try {
    const existing = await base44.asServiceRole.entities.NotificationSettings.filter({ user_email: "system@bytly.com" });
    if (existing.length > 0) {
      await base44.asServiceRole.entities.NotificationSettings.update(existing[0].id, {
        reminder_timing: { ...existing[0].reminder_timing, spreadsheet_id: spreadsheetId }
      });
    } else {
      await base44.asServiceRole.entities.NotificationSettings.create({
        user_email: "system@bytly.com",
        reminder_timing: { spreadsheet_id: spreadsheetId }
      });
    }
  } catch (e) {
    console.log("Could not store spreadsheet ID:", e.message);
  }

  console.log(`Created new spreadsheet: https://docs.google.com/spreadsheets/d/${spreadsheetId}`);
  return spreadsheetId;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const { entity_name, entity_id, event_type, data } = body;

    // Only handle Engineer and Client entities
    if (!["Engineer", "Client"].includes(entity_name) || event_type !== "create") {
      return Response.json({ success: true, message: "Not applicable" });
    }

    const accessToken = await getAccessToken(base44);
    const spreadsheetId = await getOrCreateSpreadsheet(base44, accessToken);

    const now = new Date().toLocaleString("ar-SA", { timeZone: "Asia/Riyadh" });

    if (entity_name === "Engineer") {
      const engineer = data || await base44.asServiceRole.entities.Engineer.filter({ id: entity_id });
      const eng = Array.isArray(engineer) ? engineer[0] : engineer;

      await appendRow(accessToken, spreadsheetId, "المهندسون", [
        now,
        eng?.full_name || "",
        eng?.email || "",
        eng?.phone || "",
        eng?.user_type || "",
        eng?.specialization || "",
        eng?.city || "",
        eng?.status || "pending"
      ]);

      console.log(`Engineer ${eng?.full_name} added to Google Sheets`);
    }

    if (entity_name === "Client") {
      const clientData = data || await base44.asServiceRole.entities.Client.filter({ id: entity_id });
      const client = Array.isArray(clientData) ? clientData[0] : clientData;

      await appendRow(accessToken, spreadsheetId, "العملاء", [
        now,
        client?.full_name || "",
        client?.email || "",
        client?.phone || "",
        client?.client_type || "",
        client?.city || "",
        client?.subscription_type || "free_trial"
      ]);

      console.log(`Client ${client?.full_name} added to Google Sheets`);
    }

    return Response.json({
      success: true,
      message: `${entity_name} data synced to Google Sheets`,
      spreadsheet_url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`
    });

  } catch (error) {
    console.error("Error syncing to Google Sheets:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});