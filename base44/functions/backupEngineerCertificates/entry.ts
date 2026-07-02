import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const FOLDER_NAME = 'bytly - شهادات المهندسين';
const FOLDER_STATE_KEY = 'googledrive_certificates_folder';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get Google Drive access token (shared connector — builder's account)
    const { accessToken } = await base44.asServiceRole.connectors.getConnection("googledrive");
    const authHeader = { Authorization: `Bearer ${accessToken}` };

    // Parse payload — works for both direct invocation and entity automation
    const body = await req.json();
    const engineer = body.data || body;

    if (!engineer || !engineer.id) {
      return Response.json({ error: 'Engineer data is required' }, { status: 400 });
    }

    // Collect certificates to back up
    const certificates = [];
    if (engineer.graduation_certificate_url) {
      certificates.push({
        type: 'graduation',
        url: engineer.graduation_certificate_url,
        fileName: `${engineer.full_name || engineer.email || engineer.id}_شهادة_التخرج`
      });
    }
    if (engineer.saudi_engineers_council_certificate_url) {
      certificates.push({
        type: 'saudi_engineers_council',
        url: engineer.saudi_engineers_council_certificate_url,
        fileName: `${engineer.full_name || engineer.email || engineer.id}_شهادة_الهيئة_السعودية_للمهندسين`
      });
    }

    if (certificates.length === 0) {
      return Response.json({ message: 'No certificates to back up', skipped: true });
    }

    // ── Find or create the backup folder ──────────────────────────
    let folderId = null;

    const syncStates = await base44.asServiceRole.entities.SyncState.filter({ service: FOLDER_STATE_KEY });
    if (syncStates.length > 0 && syncStates[0].sync_token) {
      folderId = syncStates[0].sync_token;
      // Verify the folder still exists
      const checkRes = await fetch(
        `https://www.googleapis.com/drive/v3/files/${folderId}?fields=id,name`,
        { headers: authHeader }
      );
      if (!checkRes.ok) folderId = null;
    }

    if (!folderId) {
      const folderRes = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: FOLDER_NAME,
          mimeType: 'application/vnd.google-apps.folder'
        })
      });
      if (!folderRes.ok) {
        const err = await folderRes.text();
        return Response.json({ error: 'Failed to create folder: ' + err }, { status: 500 });
      }
      const folder = await folderRes.json();
      folderId = folder.id;

      if (syncStates.length > 0) {
        await base44.asServiceRole.entities.SyncState.update(syncStates[0].id, {
          sync_token: folderId,
          last_sync: new Date().toISOString()
        });
      } else {
        await base44.asServiceRole.entities.SyncState.create({
          service: FOLDER_STATE_KEY,
          sync_token: folderId,
          last_sync: new Date().toISOString(),
          description: 'Folder ID for engineer certificates backup in Google Drive'
        });
      }
    }

    // ── Upload each certificate ─────────────────────────────────────
    const results = [];

    for (const cert of certificates) {
      try {
        // Skip if already backed up (check by file name among app-created files)
        const searchRes = await fetch(
          `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(`name='${cert.fileName}' and trashed=false`)}&fields=files(id,name)&pageSize=1`,
          { headers: authHeader }
        );
        const searchResult = await searchRes.json();
        if (searchResult.files && searchResult.files.length > 0) {
          results.push({ type: cert.type, status: 'already_exists', file_id: searchResult.files[0].id });
          continue;
        }

        // Download the file from the uploaded URL
        const fileRes = await fetch(cert.url);
        if (!fileRes.ok) {
          results.push({ type: cert.type, status: 'download_failed', error: `HTTP ${fileRes.status}` });
          continue;
        }

        const fileBuffer = await fileRes.arrayBuffer();
        const contentType = fileRes.headers.get('content-type') || 'application/octet-stream';

        // Detect file extension from URL or content-type
        let extension = '';
        const urlPath = cert.url.split('?')[0].toLowerCase();
        const extMatch = urlPath.match(/\.(jpg|jpeg|png|gif|webp|pdf|doc|docx)$/);
        if (extMatch) {
          extension = '.' + extMatch[1];
        } else if (contentType.includes('pdf')) {
          extension = '.pdf';
        } else if (contentType.includes('png')) {
          extension = '.png';
        } else if (contentType.includes('jpeg') || contentType.includes('jpg')) {
          extension = '.jpg';
        }

        // Build multipart/related body for Google Drive upload
        const boundary = 'bytly_boundary_' + crypto.randomUUID().replace(/-/g, '');
        const metadata = {
          name: cert.fileName + extension,
          parents: [folderId]
        };

        const encoder = new TextEncoder();
        const head = encoder.encode(
          `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: ${contentType}\r\n\r\n`
        );
        const tail = encoder.encode(`\r\n--${boundary}--`);

        const uploadBody = new Blob([head, new Uint8Array(fileBuffer), tail]);

        const uploadRes = await fetch(
          'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name',
          {
            method: 'POST',
            headers: {
              ...authHeader,
              'Content-Type': `multipart/related; boundary=${boundary}`
            },
            body: uploadBody
          }
        );

        if (uploadRes.ok) {
          const uploadedFile = await uploadRes.json();
          results.push({ type: cert.type, status: 'uploaded', file_id: uploadedFile.id, file_name: uploadedFile.name });
        } else {
          const errText = await uploadRes.text();
          results.push({ type: cert.type, status: 'upload_failed', error: errText });
        }
      } catch (certError) {
        results.push({ type: cert.type, status: 'error', error: certError.message });
      }
    }

    return Response.json({
      success: true,
      engineer_id: engineer.id,
      engineer_name: engineer.full_name,
      folder_id: folderId,
      results
    });

  } catch (error) {
    console.error('Error in backupEngineerCertificates:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});