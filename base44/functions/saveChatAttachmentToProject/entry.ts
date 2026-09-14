import { createClientFromRequest } from 'npm:@base44/sdk@0.8.32';
import { getDriveAccessToken, findOrCreateProjectFolder, uploadFileToDrive } from "../../shared/driveFolders.ts";

/**
 * saveChatAttachmentToProject — حفظ نسخة تلقائية من الملفات المرفقة في الدردشة
 * إلى سجل المشروع (Document entity) لسهولة الرجوع إليها لاحقاً.
 *
 * يستقبل:
 *   project_id  — معرف المشروع
 *   attachments — مصفوفة المرفقات [{ name, url, size, type }]
 *   sender_email — بريد المرسل
 *   sender_name  — اسم المرسل
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'الرجاء تسجيل الدخول' }, { status: 401 });

    const body = await req.json();
    const { project_id, attachments, sender_email, sender_name } = body;

    if (!project_id) {
      return Response.json({ error: 'معرف المشروع مطلوب' }, { status: 400 });
    }

    if (!attachments || !Array.isArray(attachments) || attachments.length === 0) {
      return Response.json({ success: true, saved: 0, message: 'لا توجد مرفقات' });
    }

    // التحقق من وجود المشروع
    try {
      await base44.entities.Project.get(project_id);
    } catch {
      return Response.json({ error: 'المشروع غير موجود' }, { status: 404 });
    }

    // تصنيف نوع الملف تلقائياً
    const classifyFileType = (filename, mimeType) => {
      const name = (filename || '').toLowerCase();
      const type = mimeType || '';

      if (type.includes('pdf') || name.endsWith('.pdf')) return 'pdf';
      if (type.includes('image') || /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/.test(name)) return 'image';
      if (type.includes('video') || /\.(mp4|avi|mov|wmv|webm)$/.test(name)) return 'video';
      if (type.includes('audio') || /\.(mp3|wav|ogg|m4a|aac)$/.test(name)) return 'audio';
      if (type.includes('zip') || /\.(zip|rar|7z|tar|gz)$/.test(name)) return 'archive';
      if (type.includes('word') || /\.(doc|docx)$/.test(name)) return 'docx';
      if (type.includes('excel') || /\.(xls|xlsx|csv)$/.test(name)) return 'spreadsheet';
      if (type.includes('cad') || /\.(dwg|dxf|rvt|ifc|dae|skp)$/.test(name)) return 'cad';
      if (name.endsWith('.json') || name.endsWith('.xml') || name.endsWith('.txt')) return 'text';
      return 'other';
    };

    // تصنيف نوع المستند حسب نوع الملف (engineering drawings / plans)
    const classifyDocumentType = (fileType, filename) => {
      const name = (filename || '').toLowerCase();
      // ملفات CAD / مخططات هندسية
      if (fileType === 'cad' || /\.(dwg|dxf|rvt|ifc|dae|skp)$/.test(name)) return 'design';
      // صور المخططات / التصاميم
      if (fileType === 'image' && /مخطط|plan|drawing|design|تصميم|رسم|واجهة|elevation|section|plan/i.test(name)) return 'design';
      // العقود
      if (/عقد|contract|agreement|اتفاق/i.test(name)) return 'contract';
      // الفواتير
      if (/فاتورة|invoice|bill/i.test(name)) return 'invoice';
      // التقارير
      if (/تقرير|report|report/i.test(name)) return 'report';
      // المواصفات
      if (/مواصفات|specification|spec/i.test(name)) return 'specification';
      return 'other';
    };

    // إنشاء سجل Document لكل مرفق
    const savedDocs = [];
    const errors = [];

    for (const file of attachments) {
      // تخطي الرسائل الصوتية وتسجيلات المكالمات (ليست ملفات هندسية)
      if (file.isVoice || file.isCallRecording) continue;

      try {
        const fileType = classifyFileType(file.name, file.type);
        const documentType = classifyDocumentType(fileType, file.name);

        const doc = await base44.asServiceRole.entities.Document.create({
          name: file.name,
          file_url: file.url,
          file_type: fileType,
          file_size: file.size || 0,
          document_type: documentType,
          linked_to: 'project',
          linked_id: project_id,
          uploaded_by: sender_email || user.email,
          description: `📄 ملف مرفق في الدردشة بواسطة ${sender_name || user.full_name} — ${new Date().toLocaleString('ar-SA', { timeZone: 'Asia/Riyadh' })}`
        });

        savedDocs.push({ id: doc.id, name: file.name, document_type: documentType });
      } catch (docErr) {
        console.error(`Failed to save document ${file.name}:`, docErr.message);
        errors.push({ name: file.name, error: docErr.message });
      }
    }

    // إشعار بسيط للطرف الآخر بوجود ملفات جديدة في سجل المشروع (اختياري، غير حاجز)
    // تم تجنبه لتجنب الإزعاج - الإشعارات تُرسل بالفعل من ChatWindow

    // مزامنة الملفات الهندسية المتبادلة إلى Google Drive في مجلد منظّم لكل مشروع
    let drive_folder_url = null;
    let drive_synced = 0;
    try {
      const driveFiles = attachments.filter(f => !f.isVoice && !f.isCallRecording);
      if (driveFiles.length > 0) {
        const accessToken = await getDriveAccessToken(base44);
        let projectTitle = `مشروع-${project_id.slice(0, 8)}`;
        try {
          const p = await base44.asServiceRole.entities.Project.get(project_id);
          if (p?.title) projectTitle = p.title;
        } catch (e) {
          // استخدام العنوان الافتراضي
        }
        const folder = await findOrCreateProjectFolder(base44, accessToken, projectTitle, project_id);
        for (const f of driveFiles) {
          try {
            const safeName = `${Date.now()}_${f.name || "ملف"}`;
            await uploadFileToDrive(accessToken, f.url, safeName, folder.id);
            drive_synced++;
          } catch (e) {
            console.error(`Drive upload failed for ${f.name}:`, e.message);
          }
        }
        drive_folder_url = folder.url;
        console.log(`Synced ${drive_synced} file(s) to Drive folder: ${folder.url}`);
      }
    } catch (driveErr) {
      // المزامنة اختيارية — لا توقف حفظ سجل المشروع
      console.error("Google Drive sync failed:", driveErr.message);
    }

    return Response.json({
      success: true,
      saved: savedDocs.length,
      documents: savedDocs,
      drive_synced,
      drive_folder_url,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('saveChatAttachmentToProject error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});