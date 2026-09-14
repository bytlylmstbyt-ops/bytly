// Helpers for organizing project files into Google Drive folders.
// Used by backend functions that archive engineer<->client file exchanges.
// Shared connector (googledrive) — uses the builder's Drive account.

const ROOT_FOLDER_NAME = "Bytly - ملفات المشاريع الهندسية";

export async function getDriveAccessToken(base44) {
  const { accessToken } = await base44.asServiceRole.connectors.getConnection("googledrive");
  return accessToken;
}

export async function createDriveFolder(accessToken, name, parentId = null) {
  const metadata = { name, mimeType: "application/vnd.google-apps.folder" };
  if (parentId) metadata.parents = [parentId];
  const res = await fetch("https://www.googleapis.com/drive/v3/files", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(metadata)
  });
  if (!res.ok) throw new Error(`Failed to create Drive folder: ${await res.text()}`);
  return await res.json();
}

async function listChildFolders(accessToken, parentId, name) {
  const safe = name.replace(/'/g, "\\'");
  const q = `'${parentId}' in parents and name='${safe}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name)`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) throw new Error(`Failed to list Drive folders: ${await res.text()}`);
  const data = await res.json();
  return data.files || [];
}

// Root folder id is persisted in NotificationSettings (system record) so all
// functions share the same root.
export async function getOrCreateRootFolder(base44, accessToken) {
  try {
    const settings = await base44.asServiceRole.entities.NotificationSettings.filter({ user_email: "system@bytly.com" });
    if (settings.length > 0 && settings[0].reminder_timing?.drive_root_folder_id) {
      return settings[0].reminder_timing.drive_root_folder_id;
    }
  } catch (e) {
    console.log("No stored Drive root id, creating new one...");
  }

  const folder = await createDriveFolder(accessToken, ROOT_FOLDER_NAME);
  const folderId = folder.id;

  try {
    const existing = await base44.asServiceRole.entities.NotificationSettings.filter({ user_email: "system@bytly.com" });
    if (existing.length > 0) {
      await base44.asServiceRole.entities.NotificationSettings.update(existing[0].id, {
        reminder_timing: { ...existing[0].reminder_timing, drive_root_folder_id: folderId }
      });
    } else {
      await base44.asServiceRole.entities.NotificationSettings.create({
        user_email: "system@bytly.com",
        reminder_timing: { drive_root_folder_id: folderId }
      });
    }
  } catch (e) {
    console.log("Could not persist Drive root folder id:", e.message);
  }

  console.log(`Created Drive root folder: https://drive.google.com/drive/folders/${folderId}`);
  return folderId;
}

// Deterministic per-project folder: name includes a short id slice so projects
// with identical titles never collide. Find-or-create keeps all files for one
// project in a single folder.
export async function findOrCreateProjectFolder(base44, accessToken, projectName, projectId) {
  const rootId = await getOrCreateRootFolder(base44, accessToken);
  const folderName = `${projectName} — ${String(projectId).slice(0, 8)}`;
  const existing = await listChildFolders(accessToken, rootId, folderName);
  if (existing.length > 0) {
    return {
      id: existing[0].id,
      url: `https://drive.google.com/drive/folders/${existing[0].id}`,
      created: false
    };
  }
  const folder = await createDriveFolder(accessToken, folderName, rootId);
  return {
    id: folder.id,
    url: `https://drive.google.com/drive/folders/${folder.id}`,
    created: true
  };
}

export async function uploadFileToDrive(accessToken, fileUrl, fileName, folderId) {
  const fileRes = await fetch(fileUrl);
  if (!fileRes.ok) throw new Error(`Failed to download file from: ${fileUrl}`);
  const fileBuffer = await fileRes.arrayBuffer();
  const contentType = fileRes.headers.get("content-type") || "application/octet-stream";

  const boundary = "bytly_boundary_" + Date.now();
  const metadata = JSON.stringify({ name: fileName, parents: [folderId] });
  const body = [
    `--${boundary}`,
    `Content-Type: application/json; charset=UTF-8`,
    ``,
    metadata,
    `--${boundary}`,
    `Content-Type: ${contentType}`,
    ``,
    ``
  ].join("\r\n");

  const bodyBytes = new TextEncoder().encode(body);
  const endBytes = new TextEncoder().encode(`\r\n--${boundary}--`);
  const combined = new Uint8Array(bodyBytes.length + fileBuffer.byteLength + endBytes.length);
  combined.set(bodyBytes, 0);
  combined.set(new Uint8Array(fileBuffer), bodyBytes.length);
  combined.set(endBytes, bodyBytes.length + fileBuffer.byteLength);

  const res = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": `multipart/related; boundary=${boundary}`,
      "Content-Length": combined.length.toString()
    },
    body: combined
  });

  if (!res.ok) throw new Error(`Failed to upload file to Drive: ${await res.text()}`);
  return await res.json();
}