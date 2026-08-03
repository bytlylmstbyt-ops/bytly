import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * BIM Automation Function
 * Triggered when a new BIMModel is created.
 * 1. Creates a folder in Google Drive named after the project/model
 * 2. Sends email notification to the responsible engineer
 * 3. Appends model info to a Google Sheet (budget/quantities log)
 */

async function getDriveToken(base44) {
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googledrive');
    return accessToken;
}

async function getGmailToken(base44) {
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');
    return accessToken;
}

async function getSheetsToken(base44) {
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlesheets');
    return accessToken;
}

// Create a folder in Google Drive and return its ID
async function createDriveFolder(token, folderName, parentFolderId) {
    const metadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        ...(parentFolderId ? { parents: [parentFolderId] } : {})
    };
    const res = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(metadata)
    });
    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Drive folder creation failed: ${err}`);
    }
    return res.json();
}

// Upload a text file (placeholder/manifest) to Drive inside a folder
async function uploadDriveManifest(token, folderId, model) {
    const content = JSON.stringify({
        model_name: model.name,
        model_urn: model.model_urn,
        project_id: model.project_id,
        hub_id: model.hub_id,
        imported_at: new Date().toISOString(),
        source: model.source
    }, null, 2);

    const metadata = {
        name: `${model.name}_manifest.json`,
        parents: [folderId]
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', new Blob([content], { type: 'application/json' }));

    const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form
    });
    if (!res.ok) {
        const err = await res.text();
        console.error('Drive upload failed:', err);
        return null;
    }
    return res.json();
}

// Get Drive folder link
function driveFolderLink(folderId) {
    return `https://drive.google.com/drive/folders/${folderId}`;
}

// Send Gmail notification
async function sendGmailNotification(token, to, model, driveLink) {
    const subject = `[لمسة بيت] نموذج BIM جديد يحتاج مراجعة: ${model.name}`;
    const body = `
مرحباً،

تم رفع نموذج BIM جديد على منصة لمسة بيت ويحتاج إلى مراجعتك.

تفاصيل النموذج:
• الاسم: ${model.name}
• المشروع: ${model.project_id || 'غير محدد'}
• المصدر: ${model.source === 'bim360' ? 'Autodesk Construction Cloud' : 'يدوي'}
• تاريخ الاستيراد: ${new Date().toLocaleDateString('ar-SA')}

رابط المجلد في Google Drive:
${driveLink}

يرجى مراجعة الملف والتحقق من مطابقته للمواصفات.

شكراً،
منصة لمسة بيت
    `.trim();

    const email = [
        `To: ${to}`,
        `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: base64',
        '',
        btoa(unescape(encodeURIComponent(body)))
    ].join('\r\n');

    const encodedEmail = btoa(email).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ raw: encodedEmail })
    });

    if (!res.ok) {
        const err = await res.text();
        console.error('Gmail send failed:', err);
    }
    return res.ok;
}

// Append row to Google Sheet
async function appendToSheet(token, spreadsheetId, model, driveLink) {
    const now = new Date().toLocaleDateString('ar-SA');
    const values = [[
        now,
        model.name,
        model.project_id || '',
        model.hub_id || '',
        model.source || '',
        model.floor_level || '',
        model.building_type || '',
        driveLink,
        model.model_urn || '',
    ]];

    const res = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A:I:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ values })
        }
    );
    if (!res.ok) {
        const err = await res.text();
        console.error('Sheets append failed:', err);
    }
    return res.ok;
}

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const isAuthenticated = await base44.auth.isAuthenticated();
        if (!isAuthenticated) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const body = await req.json();

        // Can be called directly with action, or from entity automation
        const model = body.data || body.model;
        const action = body.action || 'full_automation';

        if (!model) {
            return Response.json({ error: 'No model data provided' }, { status: 400 });
        }

        // Authorization: verify caller owns / is assigned to this model via RLS-scoped fetch.
        // The client-supplied `model` is untrusted — use the DB record for the update.
        const [dbModel] = await base44.entities.BIMModel.filter({ id: model.id });
        if (!dbModel) {
            return Response.json({ error: 'Forbidden or model not found' }, { status: 403 });
        }

        console.log(`BIM Automation triggered for model: ${model.name}, action: ${action}`);

        const results = {
            drive: null,
            email: null,
            sheets: null
        };

        // ── 1. Google Drive: Create folder & upload manifest ──────
        if (action === 'full_automation' || action === 'drive_archive') {
            try {
                const driveToken = await getDriveToken(base44);
                const folderName = `BIM - ${model.name} (${new Date().getFullYear()})`;
                const folder = await createDriveFolder(driveToken, folderName);
                const driveLink = driveFolderLink(folder.id);
                await uploadDriveManifest(driveToken, folder.id, model);

                results.drive = { folderId: folder.id, folderName, driveLink };
                console.log(`Drive folder created: ${driveLink}`);

                // Store drive link on the model entity (use authorized DB record, not client payload)
                await base44.asServiceRole.entities.BIMModel.update(dbModel.id, {
                    description: (dbModel.description || '') + `\n[Drive: ${driveLink}]`
                });
            } catch (e) {
                console.error('Drive automation failed:', e.message);
                results.drive = { error: e.message };
            }
        }

        const driveLink = results.drive?.driveLink || 'N/A';

        // ── 2. Gmail: Notify responsible engineer ─────────────────
        if (action === 'full_automation' || action === 'notify_engineer') {
            try {
                // Find the owner engineer email — use the verified DB record (dbModel),
                // NOT the untrusted client payload, to prevent open email relay.
                let engineerEmail = null;
                if (dbModel.owner_engineer_id) {
                    const engineers = await base44.asServiceRole.entities.Engineer.filter({ id: dbModel.owner_engineer_id });
                    engineerEmail = engineers[0]?.email;
                }
                // Fallback: notify the creator (from DB record)
                if (!engineerEmail) {
                    engineerEmail = dbModel.created_by;
                }

                if (engineerEmail) {
                    const gmailToken = await getGmailToken(base44);
                    const sent = await sendGmailNotification(gmailToken, engineerEmail, dbModel, driveLink);
                    results.email = { sent, to: engineerEmail };
                    console.log(`Email notification sent to: ${engineerEmail}`);
                } else {
                    results.email = { sent: false, reason: 'No engineer email found' };
                }
            } catch (e) {
                console.error('Gmail automation failed:', e.message);
                results.email = { error: e.message };
            }
        }

        // ── 3. Google Sheets: Log BIM model info ──────────────────
        if (action === 'full_automation' || action === 'update_sheet') {
            try {
                // Get spreadsheet ID from env or app settings
                const spreadsheetId = Deno.env.get('BIM_SHEETS_ID');
                if (!spreadsheetId) {
                    results.sheets = { skipped: true, reason: 'BIM_SHEETS_ID secret not configured' };
                } else {
                    const sheetsToken = await getSheetsToken(base44);
                    const appended = await appendToSheet(sheetsToken, spreadsheetId, model, driveLink);
                    results.sheets = { appended };
                    console.log(`Sheet updated: ${appended}`);
                }
            } catch (e) {
                console.error('Sheets automation failed:', e.message);
                results.sheets = { error: e.message };
            }
        }

        return Response.json({ success: true, model_id: model.id, results });

    } catch (error) {
        console.error('BIM Automation error:', error.message);
        return Response.json({ error: error.message }, { status: 500 });
    }
});