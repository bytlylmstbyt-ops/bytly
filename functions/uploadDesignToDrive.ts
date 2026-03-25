import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

async function getAccessToken(base44) {
  return await base44.asServiceRole.connectors.getAccessToken("googledrive");
}

async function createDriveFolder(accessToken, folderName, parentFolderId = null) {
  const metadata = {
    name: folderName,
    mimeType: "application/vnd.google-apps.folder",
  };
  if (parentFolderId) {
    metadata.parents = [parentFolderId];
  }

  const response = await fetch("https://www.googleapis.com/drive/v3/files", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(metadata)
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Failed to create folder: ${err}`);
  }

  return await response.json();
}

async function uploadFileToDrive(accessToken, fileUrl, fileName, folderId) {
  // Download the file from the URL
  const fileResponse = await fetch(fileUrl);
  if (!fileResponse.ok) {
    throw new Error(`Failed to download file from: ${fileUrl}`);
  }

  const fileBuffer = await fileResponse.arrayBuffer();
  const contentType = fileResponse.headers.get("content-type") || "application/octet-stream";

  // Upload to Google Drive using multipart upload
  const boundary = "bytly_boundary_" + Date.now();
  const metadata = JSON.stringify({
    name: fileName,
    parents: [folderId]
  });

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

  const uploadResponse = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
        "Content-Length": combined.length.toString()
      },
      body: combined
    }
  );

  if (!uploadResponse.ok) {
    const err = await uploadResponse.text();
    throw new Error(`Failed to upload file to Drive: ${err}`);
  }

  return await uploadResponse.json();
}

// Store root folder ID in NotificationSettings for persistence
async function getOrCreateRootFolder(base44, accessToken) {
  try {
    const settings = await base44.asServiceRole.entities.NotificationSettings.filter({ user_email: "system@bytly.com" });
    if (settings.length > 0 && settings[0].reminder_timing?.drive_root_folder_id) {
      return settings[0].reminder_timing.drive_root_folder_id;
    }
  } catch (e) {
    console.log("No stored Drive folder ID, creating new one...");
  }

  const folder = await createDriveFolder(accessToken, "Bytly - تصاميم المشاريع");
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
    console.log("Could not store Drive folder ID:", e.message);
  }

  console.log(`Created root Drive folder: https://drive.google.com/drive/folders/${folderId}`);
  return folderId;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const { entity_name, entity_id, event_type, data, old_data } = body;

    // Only handle ProjectMilestone updates where files are submitted
    if (entity_name !== "ProjectMilestone") {
      return Response.json({ success: true, message: "Not applicable" });
    }

    const milestone = data;
    if (!milestone) {
      return Response.json({ success: false, message: "No milestone data" });
    }

    // Check if there are deliverable files to upload
    const files = milestone.deliverable_files || [];
    if (files.length === 0 && !milestone.deliverable_url) {
      return Response.json({ success: true, message: "No files to upload" });
    }

    const accessToken = await getAccessToken(base44);
    const rootFolderId = await getOrCreateRootFolder(base44, accessToken);

    // Create a folder for this project if needed
    const project = await base44.asServiceRole.entities.Project.filter({ id: milestone.project_id });
    const projectName = project[0]?.title || `مشروع-${milestone.project_id.slice(0, 8)}`;
    const milestoneTitle = milestone.title || `مرحلة-${entity_id.slice(0, 8)}`;

    // Create project folder
    const projectFolder = await createDriveFolder(accessToken, projectName, rootFolderId);

    // Create milestone subfolder
    const milestoneFolder = await createDriveFolder(accessToken, milestoneTitle, projectFolder.id);

    const uploadedFiles = [];

    // Upload deliverable_files
    for (let i = 0; i < files.length; i++) {
      const fileUrl = files[i];
      const ext = fileUrl.split('.').pop()?.split('?')[0] || 'file';
      const fileName = `${milestoneTitle}_${i + 1}.${ext}`;
      try {
        const uploaded = await uploadFileToDrive(accessToken, fileUrl, fileName, milestoneFolder.id);
        uploadedFiles.push({ name: fileName, drive_id: uploaded.id });
        console.log(`Uploaded: ${fileName}`);
      } catch (e) {
        console.error(`Failed to upload file ${i + 1}:`, e.message);
      }
    }

    // Upload deliverable_url if exists
    if (milestone.deliverable_url) {
      const ext = milestone.deliverable_url.split('.').pop()?.split('?')[0] || 'file';
      const fileName = `${milestoneTitle}_main.${ext}`;
      try {
        const uploaded = await uploadFileToDrive(accessToken, milestone.deliverable_url, fileName, milestoneFolder.id);
        uploadedFiles.push({ name: fileName, drive_id: uploaded.id });
        console.log(`Uploaded main deliverable: ${fileName}`);
      } catch (e) {
        console.error("Failed to upload main deliverable:", e.message);
      }
    }

    const folderUrl = `https://drive.google.com/drive/folders/${milestoneFolder.id}`;
    console.log(`All files uploaded to: ${folderUrl}`);

    return Response.json({
      success: true,
      uploaded_count: uploadedFiles.length,
      folder_url: folderUrl,
      files: uploadedFiles
    });

  } catch (error) {
    console.error("Error uploading to Google Drive:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});