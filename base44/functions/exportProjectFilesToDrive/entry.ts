import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import {
  getDriveAccessToken,
  findOrCreateProjectFolder,
  uploadFileToDrive
} from '../../shared/driveFolders.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { project_id } = body;
    if (!project_id) return Response.json({ error: 'project_id is required' }, { status: 400 });

    // Load project via service role (covers both client & engineer lookups)
    let project;
    try {
      const projects = await base44.asServiceRole.entities.Project.filter({ id: project_id });
      project = projects[0];
    } catch (e) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }
    if (!project) return Response.json({ error: 'Project not found' }, { status: 404 });

    // Authorization — only project owner or assigned engineer may export
    const isOwner = project.created_by === user.email;
    const isAssignedEngineer = project.assigned_engineer_id && await isUserAssignedEngineer(base44, user, project.assigned_engineer_id);
    const isAdmin = user.role === 'admin';
    if (!isOwner && !isAssignedEngineer && !isAdmin) {
      return Response.json({ error: 'Forbidden: you are not a party to this project' }, { status: 403 });
    }

    // Collect all engineering files & plans tied to this project
    const filesToUpload = [];

    // 1. Project attachments (uploaded by the client when creating the project)
    (project.attachments || []).forEach((url, i) => {
      if (url) filesToUpload.push({ url, name: `project_attachment_${i + 1}.${extractExt(url)}` });
    });

    // 2. Final deliverable
    if (project.final_deliverable_url) {
      filesToUpload.push({ url: project.final_deliverable_url, name: `final_deliverable.${extractExt(project.final_deliverable_url)}` });
    }

    // 3. Accepted proposal attachments (engineer's submitted plans/portfolio)
    const proposals = await base44.asServiceRole.entities.Proposal.filter({ project_id });
    proposals.forEach((p) => {
      (p.attachments || []).forEach((url, i) => {
        if (url) filesToUpload.push({ url, name: `proposal_${p.id.slice(0, 6)}_${i + 1}.${extractExt(url)}` });
      });
      (p.portfolio_items || []).forEach((url, i) => {
        if (url) filesToUpload.push({ url, name: `portfolio_${p.id.slice(0, 6)}_${i + 1}.${extractExt(url)}` });
      });
    });

    // 4. Milestone deliverable files
    const milestones = await base44.asServiceRole.entities.ProjectMilestone.filter({ project_id });
    milestones.forEach((m) => {
      const slug = (m.title || `milestone_${m.id.slice(0, 6)}`).replace(/\s+/g, '_');
      (m.deliverable_files || []).forEach((url, i) => {
        if (url) filesToUpload.push({ url, name: `${slug}_${i + 1}.${extractExt(url)}` });
      });
      if (m.deliverable_url) {
        filesToUpload.push({ url: m.deliverable_url, name: `${slug}_main.${extractExt(m.deliverable_url)}` });
      }
    });

    if (filesToUpload.length === 0) {
      return Response.json({ success: false, message: 'لا توجد ملفات أو مخططات لهذا المشروع لتصديرها' });
    }

    const accessToken = await getDriveAccessToken(base44);
    const folder = await findOrCreateProjectFolder(base44, accessToken, project.title, project.id);

    const uploaded = [];
    const failed = [];
    for (const f of filesToUpload) {
      try {
        const res = await uploadFileToDrive(accessToken, f.url, f.name, folder.id);
        uploaded.push({ name: f.name, drive_id: res.id });
        console.log(`Uploaded: ${f.name}`);
      } catch (e) {
        console.error(`Failed to upload ${f.name}:`, e.message);
        failed.push({ name: f.name, error: e.message });
      }
    }

    // Notify both parties that files were archived to Drive
    const parties = new Set([project.created_by]);
    if (project.assigned_engineer_id) {
      const assigned = await base44.asServiceRole.entities.Engineer.filter({ id: project.assigned_engineer_id });
      if (assigned[0]?.email) parties.add(assigned[0].email);
    }
    for (const email of parties) {
      try {
        await base44.asServiceRole.entities.Notification.create({
          recipient_email: email,
          title: 'تم تصدير ملفات المشروع إلى Google Drive',
          message: `تم حفظ ملفات ومخططات مشروع "${project.title}" في مجلد مشترك على Google Drive ليتمكن الطرفان من الوصول إليها لاحقاً.`,
          type: 'project_update',
          related_project_id: project_id,
          action_url: folder.url,
          priority: 'medium'
        });
      } catch (e) {
        console.log('Notification skipped:', e.message);
      }
    }

    return Response.json({
      success: true,
      folder_url: folder.url,
      uploaded_count: uploaded.length,
      failed_count: failed.length,
      files: uploaded
    });
  } catch (error) {
    console.error('Error exporting project files to Drive:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

function extractExt(url) {
  const clean = (url || '').split('?')[0];
  const ext = clean.split('.').pop();
  return ext && ext.length <= 5 ? ext : 'file';
}

async function isUserAssignedEngineer(base44, user, engineerId) {
  try {
    const engineers = await base44.asServiceRole.entities.Engineer.filter({ id: engineerId });
    return engineers[0]?.email === user.email;
  } catch {
    return false;
  }
}