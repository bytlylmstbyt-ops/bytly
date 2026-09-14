import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const repo = (body.repo || '').trim(); // e.g. "owner/repo"

    if (!repo || !repo.includes('/')) {
      return Response.json({ error: 'repo مطلوب بصيغة owner/repo' }, { status: 400 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('github');

    // Fetch issues (open + closed) — GitHub returns PRs too; filter them out
    const issuesUrl = `https://api.github.com/repos/${repo}/issues?state=all&per_page=100&sort=updated&direction=desc`;
    const ghRes = await fetch(issuesUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'bytly-github-sync',
      },
    });

    if (!ghRes.ok) {
      const errText = await ghRes.text();
      return Response.json({ error: `GitHub API: ${ghRes.status} — ${errText}` }, { status: 502 });
    }

    const issues = await ghRes.json();
    const now = new Date().toISOString();

    // Fetch existing synced issues for this repo to upsert
    const existing = await base44.asServiceRole.entities.GitHubIssue.filter({ repo_full_name: repo });
    const byKey = new Map<string, any>();
    for (const it of existing) {
      byKey.set(`${it.issue_number}`, it);
    }

    let created = 0;
    let updated = 0;
    const toCreate: any[] = [];

    for (const issue of issues) {
      // Skip pull requests (they appear in the issues endpoint)
      if (issue.pull_request) continue;

      const key = `${issue.number}`;
      const payload = {
        repo_full_name: repo,
        issue_number: issue.number,
        title: issue.title || '',
        body: issue.body || '',
        state: issue.state || 'open',
        labels: (issue.labels || []).map((l: any) => l.name),
        assignees: (issue.assignees || []).map((a: any) => a.login),
        author: issue.user?.login || '',
        html_url: issue.html_url || '',
        github_created_at: issue.created_at || null,
        github_updated_at: issue.updated_at || null,
        synced_at: now,
        description: (issue.title || '').slice(0, 1000),
      };

      const prev = byKey.get(key);
      if (prev) {
        // Update only if something changed
        if (prev.title !== payload.title || prev.state !== payload.state || prev.github_updated_at !== payload.github_updated_at) {
          await base44.asServiceRole.entities.GitHubIssue.update(prev.id, payload);
          updated++;
        }
      } else {
        toCreate.push(payload);
        created++;
      }
    }

    if (toCreate.length > 0) {
      await base44.asServiceRole.entities.GitHubIssue.bulkCreate(toCreate);
    }

    return Response.json({
      repo,
      fetched: issues.length,
      created,
      updated,
      synced_at: now,
    });
  } catch (error) {
    console.error('syncGithubIssues error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}