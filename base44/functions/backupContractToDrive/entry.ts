import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

// ── Helper: البحث عن مجلد أو إنشاؤه داخل مجلد أب ──────────────────────────
async function findOrCreateFolder(accessToken, name, parentId) {
  const escaped = name.replace(/'/g, "\\'");
  let q = `name='${escaped}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  if (parentId) q += ` and '${parentId}' in parents`;

  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name)`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const searchData = await searchRes.json();
  if (searchData.files && searchData.files.length > 0) {
    return searchData.files[0].id;
  }

  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      mimeType: 'application/vnd.google-apps.folder',
      ...(parentId ? { parents: [parentId] } : {}),
    }),
  });
  const created = await createRes.json();
  return created.id;
}

// رفع نسخة احتياطية من العقد الموقع إلى Google Drive — مجلد خاص بكل مشروع
// Payload: { contractId, contractNumber, projectTitle, projectId, contractType, status, signedDate, fileUrl }
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { contractId, contractNumber, projectTitle, projectId, contractType, status, signedDate, fileUrl } = body;

    if (!contractId) return Response.json({ error: 'contractId required' }, { status: 400 });

    // ── Authorization: verify the caller is a party to the contract or project ──
    const [contract] = await base44.asServiceRole.entities.Contract.filter({ id: contractId });
    if (!contract) return Response.json({ error: 'Contract not found' }, { status: 404 });

    let project = null;
    if (contract.project_id) {
      const [proj] = await base44.asServiceRole.entities.Project.filter({ id: contract.project_id });
      project = proj;
    }

    const isAdmin = user.role === 'admin';
    const isContractCreator = contract.created_by === user.email;
    const isProjectOwner = project?.created_by === user.email;
    let isAssignedEngineer = false;
    if (project?.assigned_engineer_id) {
      const [eng] = await base44.asServiceRole.entities.Engineer.filter({ id: project.assigned_engineer_id });
      isAssignedEngineer = eng?.email === user.email;
    }
    if (!isAdmin && !isContractCreator && !isProjectOwner && !isAssignedEngineer) {
      return Response.json({ error: 'Forbidden: not a party to this contract' }, { status: 403 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googledrive');

    // ── 1. مجلد الجذر "Bytly Contracts" ──────────────────────────────────
    const rootFolderId = await findOrCreateFolder(accessToken, 'Bytly Contracts', null);

    // ── 2. مجلد فرعي خاص بالمشروع ────────────────────────────────────────
    const safeTitle = (projectTitle || 'مشروع بدون عنوان').replace(/['"\\]/g, '').slice(0, 80);
    const projectFolderName = projectId ? `${safeTitle} - ${String(projectId).slice(-6)}` : safeTitle;
    const projectFolderId = await findOrCreateFolder(accessToken, projectFolderName, rootFolderId);

    // ── 3. بناء محتوى وثيقة العقد (HTML) ─────────────────────────────────
    const now = new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric', calendar: 'gregory' });
    const docContent = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8"><title>عقد: ${contractNumber || contractId}</title>
<style>
  body { font-family: 'Segoe UI', Arial, sans-serif; margin: 40px; color: #1e293b; direction: rtl; }
  h1 { color: #4A3F35; border-bottom: 3px solid #C9A66B; padding-bottom: 10px; }
  .badge { display: inline-block; background: #C9A66B; color: white; padding: 4px 12px; border-radius: 20px; font-size: 13px; }
  table { width: 100%; border-collapse: collapse; margin-top: 20px; }
  td, th { border: 1px solid #e2e8f0; padding: 10px 14px; text-align: right; }
  th { background: #f8fafc; font-weight: bold; color: #475569; }
  .seal { margin-top: 40px; padding: 20px; background: #f0fdf4; border: 2px solid #86efac; border-radius: 12px; }
  .footer { margin-top: 40px; font-size: 12px; color: #94a3b8; text-align: center; }
</style>
</head>
<body>
  <h1>🏛️ وثيقة عقد — Bytly Platform</h1>
  <p><span class="badge">رقم العقد: ${contractNumber || '—'}</span></p>

  <table>
    <tr><th>المشروع</th><td>${projectTitle || '—'}</td></tr>
    <tr><th>معرف المشروع</th><td>${projectId || '—'}</td></tr>
    <tr><th>نوع العقد</th><td>${contractType === 'project_start' ? 'عقد بدء مشروع' : 'اتفاقية خدمة'}</td></tr>
    <tr><th>الحالة</th><td>${status || '—'}</td></tr>
    <tr><th>تاريخ اكتمال التوقيع</th><td>${signedDate ? new Date(signedDate).toLocaleDateString('ar-SA', { calendar: 'gregory' }) : '—'}</td></tr>
    <tr><th>نسخة ملف العقد</th><td>${fileUrl ? '<a href="' + fileUrl + '">رابط الملف الأصلي</a>' : 'لا يوجد ملف مرفوع'}</td></tr>
    <tr><th>تاريخ النسخ الاحتياطي</th><td>${now}</td></tr>
  </table>

  <div class="seal">
    <strong>✅ تأكيد التوثيق الرقمي</strong><br/>
    تم توقيع هذا العقد إلكترونياً من كلا الطرفين (العميل والمهندس) وتوثيقه في سجل امتثال منصة Bytly.
    هذه النسخة الاحتياطية مولَّدة تلقائياً عند اكتمال التوقيع وحفظها في مجلد المشروع على Google Drive.
  </div>

  <div class="footer">
    Bytly Platform | النسخة الاحتياطية موثوقة ومعتمدة | ${new Date().toISOString()}
  </div>
</body>
</html>`;

    const fileName = `عقد_${contractNumber || contractId}_${new Date().toISOString().slice(0, 10)}.html`;

    // ── 4. إذا وُجد ملف PDF للعقد، نرفعه مباشرةً بجانب وثيقة HTML ────────
    let pdfUploadResult = null;
    // Validate fileUrl belongs to a trusted Base44 storage domain to prevent SSRF
    const trustedHosts = ['media.base44.com', 'storage.base44.com', 'files.base44.com'];
    let isTrustedUrl = false;
    if (fileUrl && fileUrl.startsWith('https://')) {
      try {
        const parsed = new URL(fileUrl);
        isTrustedUrl = trustedHosts.includes(parsed.hostname);
      } catch { isTrustedUrl = false; }
    }
    if (fileUrl && isTrustedUrl) {
      try {
        const pdfRes = await fetch(fileUrl);
        if (pdfRes.ok) {
          const pdfBuffer = await pdfRes.arrayBuffer();
          const pdfBoundary = '-------bytly_pdf_' + Date.now();
          const pdfMetadata = JSON.stringify({
            name: `عقد_${contractNumber || contractId}_PDF_${new Date().toISOString().slice(0, 10)}.pdf`,
            parents: [projectFolderId],
            mimeType: 'application/pdf',
          });
          const pdfMultipart =
            `--${pdfBoundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${pdfMetadata}\r\n` +
            `--${pdfBoundary}\r\nContent-Type: application/pdf\r\n\r\n` +
            String.fromCharCode(...new Uint8Array(pdfBuffer)) +
            `\r\n--${pdfBoundary}--`;

          const pdfUploadRes = await fetch(
            'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': `multipart/related; boundary=${pdfBoundary}`,
              },
              body: pdfMultipart,
            }
          );
          if (pdfUploadRes.ok) {
            pdfUploadResult = await pdfUploadRes.json();
          }
        }
      } catch (pdfErr) {
        console.error('PDF upload skipped:', pdfErr.message);
      }
    }

    // ── 5. رفع وثيقة HTML إلى مجلد المشروع ───────────────────────────────
    const boundary = '-------bytly_boundary_' + Date.now();
    const metadata = JSON.stringify({ name: fileName, parents: [projectFolderId], mimeType: 'text/html' });
    const multipartBody =
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n` +
      `--${boundary}\r\nContent-Type: text/html; charset=UTF-8\r\n\r\n${docContent}\r\n` +
      `--${boundary}--`;

    const uploadRes = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: multipartBody,
      }
    );

    if (!uploadRes.ok) {
      const err = await uploadRes.text();
      console.error('Drive upload error:', err);
      return Response.json({ error: 'Drive upload failed', details: err }, { status: 500 });
    }

    const uploaded = await uploadRes.json();
    console.log('Backed up to Drive:', uploaded.id, uploaded.webViewLink, 'folder:', projectFolderName);

    return Response.json({
      success: true,
      driveFileId: uploaded.id,
      driveLink: uploaded.webViewLink,
      fileName,
      projectFolderId,
      projectFolderName,
      pdfDriveFileId: pdfUploadResult?.id || null,
      pdfDriveLink: pdfUploadResult?.webViewLink || null,
    });
  } catch (error) {
    console.error('backupContractToDrive error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});