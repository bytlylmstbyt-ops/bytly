import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const ROOT_FOLDER_NAME = 'bytly - شهادات المهندسين';
const ROOT_FOLDER_STATE_KEY = 'googledrive_certificates_folder';

// Reject internal/private/loopback hosts to prevent SSRF
function isInternalHost(hostname) {
  const h = hostname.toLowerCase();
  if (h === 'localhost' || h === '::1' || h === '[::1]') return true;
  if (/^127\./.test(h)) return true;
  if (/^10\./.test(h)) return true;
  if (/^192\.168\./.test(h)) return true;
  if (/^169\.254\./.test(h)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(h)) return true;
  if (/^fc00:/.test(h) || /^fd/.test(h)) return true;
  if (/^0\./.test(h) || h === '0.0.0.0') return true;
  return false;
}

function isSafeFileUrl(urlStr) {
  try {
    const u = new URL(urlStr);
    if (u.protocol !== 'https:') return false;
    if (u.port && u.port !== '443') return false; // reject non-standard ports
    if (isInternalHost(u.hostname)) return false;
    // Reject raw IP addresses — only allow domain hostnames from trusted storage
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(u.hostname)) return false;
    if (u.hostname.includes('metadata') || u.hostname.includes('internal')) return false;
    return true;
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const isAuthenticated = await base44.auth.isAuthenticated();
    if (!isAuthenticated) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Get Google Drive access token (shared connector — builder's account)
    const { accessToken } = await base44.asServiceRole.connectors.getConnection("googledrive");
    const authHeader = { Authorization: `Bearer ${accessToken}` };

    // Parse payload — works for both direct invocation and entity automation
    const body = await req.json();
    const engineerPayload = body.data || body;

    if (!engineerPayload || !engineerPayload.id) {
      return Response.json({ error: 'Engineer data is required' }, { status: 400 });
    }

    // Fetch the engineer from the DB — never trust certificate URLs from the request body (SSRF prevention)
    const engineersFromDb = await base44.asServiceRole.entities.Engineer.filter({ id: engineerPayload.id });
    const engineer = engineersFromDb[0];
    if (!engineer) return Response.json({ error: 'Engineer not found' }, { status: 404 });

    // Collect certificates to back up
    const certificates = [];
    if (engineer.graduation_certificate_url) {
      certificates.push({
        type: 'graduation',
        url: engineer.graduation_certificate_url,
        fileName: 'شهادة_التخرج'
      });
    }
    if (engineer.saudi_engineers_council_certificate_url) {
      certificates.push({
        type: 'saudi_engineers_council',
        url: engineer.saudi_engineers_council_certificate_url,
        fileName: 'شهادة_الهيئة_السعودية_للمهندسين'
      });
    }

    if (certificates.length === 0) {
      return Response.json({ message: 'No certificates to back up', skipped: true });
    }

    // ── 1. Find or create the ROOT folder ──────────────────────────
    let rootFolderId = null;

    const syncStates = await base44.asServiceRole.entities.SyncState.filter({ service: ROOT_FOLDER_STATE_KEY });
    if (syncStates.length > 0 && syncStates[0].sync_token) {
      rootFolderId = syncStates[0].sync_token;
      // Verify the folder still exists
      const checkRes = await fetch(
        `https://www.googleapis.com/drive/v3/files/${rootFolderId}?fields=id,name`,
        { headers: authHeader }
      );
      if (!checkRes.ok) rootFolderId = null;
    }

    if (!rootFolderId) {
      const folderRes = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: ROOT_FOLDER_NAME,
          mimeType: 'application/vnd.google-apps.folder'
        })
      });
      if (!folderRes.ok) {
        const err = await folderRes.text();
        return Response.json({ error: 'Failed to create root folder: ' + err }, { status: 500 });
      }
      const folder = await folderRes.json();
      rootFolderId = folder.id;

      if (syncStates.length > 0) {
        await base44.asServiceRole.entities.SyncState.update(syncStates[0].id, {
          sync_token: rootFolderId,
          last_sync: new Date().toISOString()
        });
      } else {
        await base44.asServiceRole.entities.SyncState.create({
          service: ROOT_FOLDER_STATE_KEY,
          sync_token: rootFolderId,
          last_sync: new Date().toISOString(),
          description: 'Root folder ID for engineer certificates backup in Google Drive'
        });
      }
    }

    // ── 2. Find or create engineer subfolder ────────────────────────
    // Sanitize folder name — remove characters not allowed in Drive folder names
    const engineerName = (engineer.full_name || engineer.email || engineer.id)
      .replace(/[\/\\:*?"<>|]/g, ' ').trim() || engineer.id;

    let engineerFolderId = null;

    // Search for existing subfolder inside the root folder
    const searchFolderRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(`name='${engineerName.replace(/'/g, "\\'")}' and '${rootFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`)}&fields=files(id,name)`,
      { headers: authHeader }
    );
    const searchFolderData = await searchFolderRes.json();
    if (searchFolderData.files && searchFolderData.files.length > 0) {
      engineerFolderId = searchFolderData.files[0].id;
    }

    if (!engineerFolderId) {
      const createFolderRes = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: engineerName,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [rootFolderId]
        })
      });
      if (!createFolderRes.ok) {
        const err = await createFolderRes.text();
        return Response.json({ error: 'Failed to create engineer folder: ' + err }, { status: 500 });
      }
      const engFolder = await createFolderRes.json();
      engineerFolderId = engFolder.id;
    }

    // ── 3. Upload each certificate ──────────────────────────────────
    const results = [];

    for (const cert of certificates) {
      try {
        // Skip if already backed up in the engineer's subfolder
        const searchRes = await fetch(
          `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(`name='${cert.fileName}' and '${engineerFolderId}' in parents and trashed=false`)}&fields=files(id,name)&pageSize=1`,
          { headers: authHeader }
        );
        const searchResult = await searchRes.json();
        if (searchResult.files && searchResult.files.length > 0) {
          results.push({ type: cert.type, status: 'already_exists', file_id: searchResult.files[0].id });
          continue;
        }

        // Download the file from the uploaded URL — validate to prevent SSRF
        if (!isSafeFileUrl(cert.url)) {
          results.push({ type: cert.type, status: 'blocked', error: 'URL failed safety validation' });
          continue;
        }

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
          parents: [engineerFolderId]
        };

        const encoder = new TextEncoder();
        const head = encoder.encode(
          `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: ${contentType}\r\n\r\n`
        );
        const tail = encoder.encode(`\r\n--${boundary}--`);

        const uploadBody = new Blob([head, new Uint8Array(fileBuffer), tail]);

        const uploadRes = await fetch(
          'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
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
          results.push({ type: cert.type, status: 'uploaded', file_id: uploadedFile.id, file_name: uploadedFile.name, drive_link: uploadedFile.webViewLink });
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
      root_folder_id: rootFolderId,
      engineer_folder_id: engineerFolderId,
      engineer_folder_name: engineerName,
      results
    });

  } catch (error) {
    console.error('Error in backupEngineerCertificates:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});