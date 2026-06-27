import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });

    const { row_number, status, email, spreadsheet_id } = await req.json();

    if (!row_number || !status || !spreadsheet_id) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection("googlesheets");

    // Update cell H{row_number} in the "المهندسون" sheet
    const range = `${encodeURIComponent("المهندسون")}!H${row_number}`;
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheet_id}/values/${range}?valueInputOption=USER_ENTERED`,
      {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          values: [[status]],
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("Sheets API update error:", errText);
      return Response.json({ error: "فشل في تحديث الجدول" }, { status: 500 });
    }

    // Also update the Engineer entity in the database if email is provided
    if (email) {
      try {
        const engineers = await base44.asServiceRole.entities.Engineer.filter({ email });
        if (engineers.length > 0) {
          const eng = engineers[0];
          const updateData = {
            status: status === "approved" ? "approved" : "rejected",
          };
          if (status === "approved") {
            updateData.is_verified = true;
            updateData.certified_at = new Date().toISOString();
            updateData.certified_by = user.email;
          }
          await base44.asServiceRole.entities.Engineer.update(eng.id, updateData);
        }
      } catch (e) {
        console.log("Could not update entity:", e.message);
      }
    }

    return Response.json({ success: true, row_number, status });
  } catch (error) {
    console.error("Error updating sheet registration status:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});