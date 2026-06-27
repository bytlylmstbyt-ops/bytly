import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const SPREADSHEET_TITLE = "Bytly - تسجيلات المستخدمين";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });

    const { accessToken } = await base44.asServiceRole.connectors.getConnection("googlesheets");

    // Get spreadsheet ID from NotificationSettings
    let spreadsheetId = null;
    try {
      const settings = await base44.asServiceRole.entities.NotificationSettings.filter({ user_email: "system@bytly.com" });
      if (settings.length > 0 && settings[0].reminder_timing?.spreadsheet_id) {
        spreadsheetId = settings[0].reminder_timing.spreadsheet_id;
      }
    } catch (e) {
      console.log("Could not get spreadsheet ID from settings:", e.message);
    }

    // Fallback: search Google Drive for the spreadsheet by title
    if (!spreadsheetId) {
      try {
        const { accessToken: driveToken } = await base44.asServiceRole.connectors.getConnection("googledrive");
        const driveRes = await fetch(
          `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(`name='${SPREADSHEET_TITLE}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`)}&fields=files(id,name)`,
          { headers: { "Authorization": `Bearer ${driveToken}` } }
        );
        if (driveRes.ok) {
          const driveData = await driveRes.json();
          if (driveData.files && driveData.files.length > 0) {
            spreadsheetId = driveData.files[0].id;
          }
        }
      } catch (e) {
        console.log("Drive search failed:", e.message);
      }
    }

    if (!spreadsheetId) {
      return Response.json({ pending: [], message: "لم يتم العثور على جدول التسجيلات" });
    }

    // Read the "المهندسون" sheet
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent("المهندسون")}!A:H`,
      { headers: { "Authorization": `Bearer ${accessToken}` } }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("Sheets API error:", errText);
      return Response.json({ error: "فشل في قراءة الجدول" }, { status: 500 });
    }

    const data = await response.json();
    const rows = data.values || [];
    if (rows.length < 2) {
      return Response.json({ pending: [] });
    }

    // Map rows (skip header), filter pending
    const pending = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const status = (row[7] || "").trim().toLowerCase();
      if (status === "pending" || status === "قيد المراجعة") {
        pending.push({
          row_number: i + 1,
          date: row[0] || "",
          full_name: row[1] || "",
          email: row[2] || "",
          phone: row[3] || "",
          user_type: row[4] || "",
          specialization: row[5] || "",
          city: row[6] || "",
          status: row[7] || "pending",
        });
      }
    }

    return Response.json({ pending, spreadsheet_id: spreadsheetId });
  } catch (error) {
    console.error("Error fetching pending registrations:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});