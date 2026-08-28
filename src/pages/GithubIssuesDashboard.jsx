import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Github, RefreshCw, ExternalLink, Search, AlertCircle, CheckCircle2, Inbox } from 'lucide-react';

export default function GithubIssuesDashboard() {
  const [repo, setRepo] = useState('');
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [error, setError] = useState('');
  const [stateFilter, setStateFilter] = useState('all');
  const [search, setSearch] = useState('');

  const loadIssues = useCallback(async () => {
    if (!repo.trim()) {
      setIssues([]);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const all = await base44.entities.GitHubIssue.filter({ repo_full_name: repo.trim() }, '-github_updated_at', 200);
      setIssues(all);
    } catch (e) {
      setError(e.message || 'فشل تحميل المشاكل');
      setIssues([]);
    } finally {
      setLoading(false);
    }
  }, [repo]);

  useEffect(() => {
    loadIssues();
  }, [loadIssues]);

  const handleSync = async () => {
    if (!repo.trim()) {
      setError('أدخل اسم المستودع بصيغة owner/repo');
      return;
    }
    setSyncing(true);
    setError('');
    setSyncResult(null);
    try {
      const res = await base44.functions.invoke('syncGithubIssues', { repo: repo.trim() });
      setSyncResult(res.data);
      await loadIssues();
    } catch (e) {
      setError(e.response?.data?.error || e.message || 'فشلت المزامنة');
    } finally {
      setSyncing(false);
    }
  };

  const filtered = issues.filter((it) => {
    if (stateFilter !== 'all' && it.state !== stateFilter) return false;
    if (search && !it.title?.toLowerCase().includes(search.toLowerCase()) && !it.body?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const openCount = issues.filter((i) => i.state === 'open').length;
  const closedCount = issues.filter((i) => i.state === 'closed').length;

  return (
    <div className="min-h-screen bg-[#FDF6ED] py-8 px-4 md:px-8" dir="rtl">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1A1D2B] to-[#2D2D4E] flex items-center justify-center">
            <Github className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#1A1D2B]">لوحة مشاكل GitHub</h1>
            <p className="text-sm text-[#6B5D4F]">مزامنة وعرض مشاكل المستودعات من GitHub</p>
          </div>
        </div>

        {/* Sync controls */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-5 space-y-4">
            <div className="flex flex-col md:flex-row gap-3">
              <Input
                placeholder="owner/repo"
                value={repo}
                onChange={(e) => setRepo(e.target.value)}
                className="flex-1 text-right"
                dir="ltr"
              />
              <Button
                onClick={handleSync}
                disabled={syncing || !repo.trim()}
                className="bg-gradient-to-r from-[#1A1D2B] to-[#2D2D4E] text-white gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'جارٍ المزامنة...' : 'مزامنة الآن'}
              </Button>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {syncResult && (
              <Alert className="border-green-200 bg-green-50 text-green-800">
                <CheckCircle2 className="w-4 h-4" />
                <AlertDescription>
                  تمت المزامنة: {syncResult.fetched} عنصر، {syncResult.created} جديد، {syncResult.updated} محدّث
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Stats + filters */}
        {issues.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-0 shadow">
              <CardContent className="p-4 flex items-center justify-between">
                <span className="text-sm text-[#6B5D4F]">إجمالي</span>
                <span className="text-2xl font-bold text-[#1A1D2B]">{issues.length}</span>
              </CardContent>
            </Card>
            <Card className="border-0 shadow">
              <CardContent className="p-4 flex items-center justify-between">
                <span className="text-sm text-[#6B5D4F]">مفتوحة</span>
                <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">{openCount}</Badge>
              </CardContent>
            </Card>
            <Card className="border-0 shadow">
              <CardContent className="p-4 flex items-center justify-between">
                <span className="text-sm text-[#6B5D4F]">مغلقة</span>
                <Badge className="bg-green-100 text-green-700 hover:bg-green-100">{closedCount}</Badge>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        {issues.length > 0 && (
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute top-1/2 -translate-y-1/2 right-3 w-4 h-4 text-slate-400" />
              <Input
                placeholder="بحث في العناوين والنصوص..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-10"
              />
            </div>
            <div className="flex gap-2">
              {['all', 'open', 'closed'].map((s) => (
                <Button
                  key={s}
                  variant={stateFilter === s ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStateFilter(s)}
                  className={stateFilter === s ? 'bg-[#C6A775] text-white' : ''}
                >
                  {s === 'all' ? 'الكل' : s === 'open' ? 'مفتوحة' : 'مغلقة'}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Issues list */}
        <div className="space-y-3">
          {loading ? (
            <div className="flex justify-center py-12">
              <RefreshCw className="w-6 h-6 animate-spin text-[#C6A775]" />
            </div>
          ) : filtered.length === 0 ? (
            <Card className="border-0 shadow">
              <CardContent className="py-12 flex flex-col items-center text-center">
                <Inbox className="w-12 h-12 text-slate-300 mb-3" />
                <p className="text-[#6B5D4F]">
                  {issues.length === 0 ? 'أدخل مستودعاً واضغط مزامنة لعرض المشاكل' : 'لا توجد نتائج مطابقة'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filtered.map((issue) => (
              <Card key={issue.id} className="border-0 shadow hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 w-2.5 h-2.5 rounded-full flex-shrink-0 ${issue.state === 'open' ? 'bg-amber-400' : 'bg-green-500'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <a
                          href={issue.html_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-[#1A1D2B] hover:text-[#C6A775] transition-colors text-right"
                        >
                          #{issue.issue_number} · {issue.title}
                        </a>
                        <a
                          href={issue.html_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-400 hover:text-[#C6A775] flex-shrink-0"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                      {issue.body && (
                        <p className="text-sm text-[#6B5D4F] line-clamp-2 mb-2">{issue.body}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <Badge variant={issue.state === 'open' ? 'default' : 'secondary'} className={issue.state === 'open' ? 'bg-amber-100 text-amber-700 hover:bg-amber-100' : 'bg-green-100 text-green-700 hover:bg-green-100'}>
                          {issue.state === 'open' ? 'مفتوحة' : 'مغلقة'}
                        </Badge>
                        {issue.author && <span className="text-slate-500">بواسطة {issue.author}</span>}
                        {issue.labels?.map((l) => (
                          <span key={l} className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                            {l}
                          </span>
                        ))}
                        {issue.assignees?.length > 0 && (
                          <span className="text-slate-500">← {issue.assignees.join(', ')}</span>
                        )}
                        {issue.github_updated_at && (
                          <span className="text-slate-400 mr-auto">
                            {new Date(issue.github_updated_at).toLocaleDateString('ar-SA')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}