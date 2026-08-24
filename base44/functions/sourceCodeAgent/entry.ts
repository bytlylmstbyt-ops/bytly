import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Source Code Agent
// Reads the connected GitHub repository, plans source edits with an LLM,
// and applies explicitly approved file operations through the GitHub API.
// It never handles secrets supplied by the user and never edits database
// records through this endpoint.

const OWNER = 'bytlylmstbyt-ops';
const REPO = 'bytly';
const DEFAULT_BRANCH = 'main';

function ghHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
  };
}

async function gh(token, path, options = {}) {
  const response = await fetch(`https://api.github.com${path}`, {
    ...options,
    headers: { ...ghHeaders(token), ...(options.headers || {}) },
  });
  const text = await response.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
  if (!response.ok) {
    throw new Error(`GitHub API ${response.status}: ${data?.message || text || 'request failed'}`);
  }
  return data;
}

async function getToken(base44) {
  try {
    const connection = await base44.asServiceRole.connectors.getConnection('github');
    if (!connection?.accessToken) throw new Error('GitHub غير متصل بعد. يجب إكمال ربط GitHub من إعدادات التكامل.');
    return connection.accessToken;
  } catch (error) {
    throw new Error(`تعذر الوصول إلى GitHub: ${error?.message || 'connector unavailable'}`);
  }
}

async function getBranchState(token, branch = DEFAULT_BRANCH) {
  const ref = await gh(token, `/repos/${OWNER}/${REPO}/git/ref/heads/${encodeURIComponent(branch)}`);
  const commit = await gh(token, `/repos/${OWNER}/${REPO}/git/commits/${ref.object.sha}`);
  const tree = await gh(token, `/repos/${OWNER}/${REPO}/git/trees/${commit.tree.sha}?recursive=1`);
  return { branch, refSha: ref.object.sha, commitSha: commit.sha, treeSha: commit.tree.sha, tree: tree.tree || [] };
}

async function readFile(token, path, ref = DEFAULT_BRANCH) {
  const data = await gh(token, `/repos/${OWNER}/${REPO}/contents/${path.split('/').map(encodeURIComponent).join('/')}?ref=${encodeURIComponent(ref)}`);
  if (Array.isArray(data)) throw new Error(`${path} is a directory, not a file`);
  if (data.encoding !== 'base64') return { path, sha: data.sha, content: '' };
  const content = new TextDecoder().decode(Uint8Array.from(atob(data.content.replace(/\n/g, '')), c => c.charCodeAt(0)));
  return { path, sha: data.sha, content };
}

function relevantFiles(tree, request) {
  const text = request.toLowerCase();
  const tokens = text.replace(/[^\p{L}\p{N}_/-]+/gu, ' ').split(/\s+/).filter(t => t.length >= 3);
  const source = tree.filter(x => x.type === 'blob' && /\.(jsx?|tsx?|css|json|jsonc|svg)$/.test(x.path));
  const scored = source.map(file => {
    const p = file.path.toLowerCase();
    let score = 0;
    for (const token of tokens) if (p.includes(token)) score += 3;
    if (p.includes('admin') && /(إدارة|admin|لوحة|مساعد)/i.test(request)) score += 2;
    if (p.includes('logo') && /(logo|لوقو|شعار)/i.test(request)) score += 5;
    if (p.includes('route') && /(صفحة|page|route|مسار)/i.test(request)) score += 2;
    return { ...file, score };
  });
  const ranked = scored.sort((a, b) => b.score - a.score);
  const selected = ranked.filter(x => x.score > 0).slice(0, 12);
  const structural = source.filter(x => /(^|\/)App\.(jsx?|tsx?)$|(^|\/)(router|routes|main)\.(jsx?|tsx?)$/i.test(x.path)).slice(0, 4);
  const merged = [...selected, ...structural].filter((file, index, arr) => arr.findIndex(x => x.path === file.path) === index);
  return merged.length ? merged.slice(0, 16) : ranked.slice(0, 12);
}

async function planChange(base44, token, request) {
  const state = await getBranchState(token);
  const candidates = relevantFiles(state.tree, request);
  const files = [];
  for (const candidate of candidates.slice(0, 12)) {
    try {
      const file = await readFile(token, candidate.path);
      if (file.content.length <= 120000) files.push(file);
    } catch (_) {}
  }

  const planning = await base44.integrations.Core.InvokeLLM({
    prompt: `You are the source-code implementation planner for Bytly. You have real GitHub source files below. The admin request must be translated into concrete, minimal file edits.

Repository: ${OWNER}/${REPO}, branch: ${DEFAULT_BRANCH}

ADMIN REQUEST:
${request}

SOURCE FILES:
${files.map(f => `\n===== ${f.path} =====\n${f.content}`).join('\n')}

Rules:
- Only edit files that are actually provided above.
- Never invent a file path.
- Prefer minimal, focused changes.
- Preserve existing architecture, styling conventions, Arabic RTL support, and working behavior.
- For a logo/brand request, find the actual logo component/assets in the provided source before changing anything.
- For a new page, include the page file and the actual route registration only if the relevant route file is present.
- For an integration request, identify the existing integration layer and do not invent credentials or secret values.
- Do not change authentication, authorization, payments, escrow, financial calculations, or production deployment in this source-edit path.
- Return complete replacement contents for each changed file, not patches. Unchanged files must not be returned.
- You may create a new source file under src/ when the request explicitly asks for a new page/component/function. Use the exact route/architecture files supplied in context to wire it in; never invent a route registry.
- If the available files are insufficient, return needs_more_context=true and list the exact paths that should be read next.

Return JSON with:
summary_ar, needs_more_context, missing_paths[], tests[], operations:[{path,content}], risk_level(low|medium|high), blocked(boolean), block_reason.
`,
    add_context_from_internet: false,
    response_json_schema: {
      type: 'object',
      properties: {
        summary_ar: { type: 'string' },
        needs_more_context: { type: 'boolean' },
        missing_paths: { type: 'array', items: { type: 'string' } },
        tests: { type: 'array', items: { type: 'string' } },
        operations: {
          type: 'array',
          items: { type: 'object', properties: { path: { type: 'string' }, content: { type: 'string' } }, required: ['path', 'content'] },
        },
        risk_level: { type: 'string', enum: ['low', 'medium', 'high'] },
        blocked: { type: 'boolean' },
        block_reason: { type: 'string' },
      },
      required: ['summary_ar','needs_more_context','missing_paths','tests','operations','risk_level','blocked','block_reason'],
    },
  });

  const operations = (planning.operations || []).filter(op => {
    if (!op || typeof op.content !== 'string' || typeof op.path !== 'string') return false;
    if (op.path.includes('..') || op.path.startsWith('/') || op.path.startsWith('.git/')) return false;
    return /^src\//.test(op.path) && /\.(jsx?|tsx?|css|json|jsonc|svg)$/.test(op.path);
  });
  return {
    branch: DEFAULT_BRANCH,
    base_commit: state.commitSha,
    summary_ar: planning.summary_ar || '',
    needs_more_context: !!planning.needs_more_context,
    missing_paths: planning.missing_paths || [],
    tests: planning.tests || [],
    operations,
    risk_level: planning.risk_level || 'medium',
    blocked: !!planning.blocked,
    block_reason: planning.block_reason || '',
  };
}

async function applyOperations(token, operations, message, branch = DEFAULT_BRANCH) {
  if (!Array.isArray(operations) || !operations.length) throw new Error('لا توجد تغييرات مصدرية قابلة للتطبيق.');
  if (operations.length > 20) throw new Error('عدد الملفات كبير جدًا لعملية واحدة. قسّم التعديل إلى مراحل.');
  for (const op of operations) {
    if (!op?.path || typeof op.content !== 'string') throw new Error('عملية ملف غير صالحة.');
    if (op.path.includes('..') || op.path.startsWith('/') || op.path.startsWith('.git/')) throw new Error('مسار ملف غير مسموح.');
    if (!/^src\//.test(op.path) || !/\.(jsx?|tsx?|css|json|jsonc|svg)$/.test(op.path)) throw new Error(`نوع/مسار الملف غير مسموح: ${op.path}`);
  }

  const state = await getBranchState(token, branch);
  const blobs = [];
  for (const op of operations) {
    const blob = await gh(token, `/repos/${OWNER}/${REPO}/git/blobs`, {
      method: 'POST', body: JSON.stringify({ content: op.content, encoding: 'utf-8' }),
    });
    blobs.push({ path: op.path, mode: '100644', type: 'blob', sha: blob.sha });
  }

  const newTree = await gh(token, `/repos/${OWNER}/${REPO}/git/trees`, {
    method: 'POST',
    body: JSON.stringify({ base_tree: state.treeSha, tree: blobs }),
  });
  const commit = await gh(token, `/repos/${OWNER}/${REPO}/git/commits`, {
    method: 'POST',
    body: JSON.stringify({ message: `AI Agent: ${message.slice(0, 120)}`, tree: newTree.sha, parents: [state.commitSha] }),
  });
  await gh(token, `/repos/${OWNER}/${REPO}/git/refs/heads/${encodeURIComponent(branch)}`, {
    method: 'PATCH', body: JSON.stringify({ sha: commit.sha, force: false }),
  });
  return { branch, commit_sha: commit.sha, files_changed: operations.map(x => x.path), message: 'تم تطبيق التغييرات على مستودع GitHub.' };
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  try {
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });
    const body = await req.json();
    const action = body?.action || 'plan';
    const token = await getToken(base44);

    if (action === 'plan') {
      const request = String(body?.request || '').trim();
      if (!request) return Response.json({ error: 'Missing request' }, { status: 400 });
      const plan = await planChange(base44, token, request);
      return Response.json({ success: true, plan });
    }

    if (action === 'apply') {
      const operations = Array.isArray(body?.operations) ? body.operations : [];
      const result = await applyOperations(token, operations, String(body?.message || 'approved source change'), String(body?.branch || DEFAULT_BRANCH));
      return Response.json({ success: true, result });
    }

    if (action === 'scan') {
      const state = await getBranchState(token);
      const files = state.tree.filter(x => x.type === 'blob').map(x => x.path);
      return Response.json({ success: true, repository: `${OWNER}/${REPO}`, branch: state.branch, commit_sha: state.commitSha, file_count: files.length, source_files: files.filter(p => /\.(jsx?|tsx?|css|json|jsonc)$/.test(p)).length });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('sourceCodeAgent error:', error);
    return Response.json({ error: error?.message || 'Source-code agent failed.' }, { status: 500 });
  }
});
