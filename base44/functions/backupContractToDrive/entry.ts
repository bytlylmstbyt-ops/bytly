import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// رفع نسخة احتياطية من العقد إلى Google Drive
// Payload: { contractId, contractNumber, projectTitle, contractType, status, signedDate, fileUrl? }
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { contractId, contractNumber, projectTitle, contractType, status, signedDate, fileUrl } = body;

    if (!contractId) return Response.json({ error: 'contractId required' }, { status: 400 });

    // الحصول على رمز الوصول لـ Google Drive
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googledrive');

    // ── 1. البحث عن مجلد "Bytly Contracts" أو إنشاؤه ──────────────────────
    const folderName = 'Bytly Contracts';
    const searchRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false&fields=files(id,name)`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const searchData = await searchRes.json();
    let folderId;

    if (searchData.files && searchData.files.length > 0) {
      folderId = searchData.files[0].id;
    } else {
      // إنشاء المجلد
      const createFolderRes = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: folderName, mimeType: 'application/vnd.google-apps.folder' }),
      });
      const folderData = await createFolderRes.json();
      folderId = folderData.id;
    }

    // ── 2. بناء محتوى ملف HTML كوثيقة العقد ───────────────────────────────
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
    <tr><th>نوع العقد</th><td>${contractType === 'project_start' ? 'عقد بدء مشروع' : 'اتفاقية خدمة'}</td></tr>
    <tr><th>الحالة</th><td>${status || '—'}</td></tr>
    <tr><th>تاريخ اكتمال التوقيع</th><td>${signedDate ? new Date(signedDate).toLocaleDateString('ar-SA', { calendar: 'gregory' }) : '—'}</td></tr>
    <tr><th>نسخة ملف العقد</th><td>${fileUrl ? '<a href="' + fileUrl + '">رابط الملف الأصلي</a>' : 'لا يوجد ملف مرفوع'}</td></tr>
    <tr><th>تاريخ النسخ الاحتياطي</th><td>${now}</td></tr>
  </table>

  <div class="seal">
    <strong>✅ تأكيد التوثيق الرقمي</strong><br/>
    تم توقيع هذا العقد إلكترونياً من كلا الطرفين (العميل والمهندس) وتوثيقه في سجل امتثال منصة Bytly.
    هذه النسخة الاحتياطية مولَّدة تلقائياً عند اكتمال التوقيع.
  </div>

  <div class="footer">
    Bytly Platform | النسخة الاحتياطية موثوقة ومعتمدة | ${new Date().toISOString()}
  </div>
</body>
</html>`;

    const fileName = `عقد_${contractNumber || contractId}_${new Date().toISOString().slice(0,10)}.html`;

    // ── 3. رفع الملف إلى المجلد ────────────────────────────────────────────
    const boundary = '-------bytly_boundary_' + Date.now();
    const metadata = JSON.stringify({ name: fileName, parents: [folderId], mimeType: 'text/html' });
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
    console.log('Backed up to Drive:', uploaded.id, uploaded.webViewLink);

    return Response.json({
      success: true,
      driveFileId: uploaded.id,
      driveLink: uploaded.webViewLink,
      fileName,
      folderId,
    });

  } catch (error) {
    console.error('backupContractToDrive error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});