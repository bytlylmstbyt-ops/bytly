import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import BIMViewer from '@/components/bim/BIMViewer';
import {
    Search, Building2, Layers, CloudDownload, RefreshCw, ExternalLink,
    Mail, FolderOpen, TableProperties, CheckCircle2, Clock, AlertCircle,
    BarChart3, Filter, X, Eye, Plus, FileText, ArrowUpRight, Loader2,
    SlidersHorizontal, Calendar, Cloud
} from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';

const FILE_TYPE_COLORS = {
    rvt: 'bg-blue-100 text-blue-700',
    dwg: 'bg-green-100 text-green-700',
    ifc: 'bg-purple-100 text-purple-700',
    nwc: 'bg-orange-100 text-orange-700',
    nwd: 'bg-orange-100 text-orange-700',
};

function getExt(name = '') { return name.split('.').pop()?.toLowerCase() || ''; }

function getFileType(model) {
    const ext = getExt(model.name);
    return FILE_TYPE_COLORS[ext] ? ext.toUpperCase() : 'BIM';
}

function timeAgo(dateStr) {
    if (!dateStr) return 'غير معروف';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `منذ ${days} يوم`;
    if (hours > 0) return `منذ ${hours} ساعة`;
    if (mins > 0) return `منذ ${mins} دقيقة`;
    return 'الآن';
}

function hasDriveLink(model) {
    return model.description?.includes('[Drive:');
}

function extractDriveLink(model) {
    const match = model.description?.match(/\[Drive: (https?:\/\/[^\]]+)\]/);
    return match ? match[1] : null;
}

// ── Stat Card ──────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color = 'blue' }) {
    const colors = {
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-green-50 text-green-600',
        purple: 'bg-purple-50 text-purple-600',
        orange: 'bg-orange-50 text-orange-600',
    };
    return (
        <Card className="border-0 shadow-sm">
            <CardContent className="p-5 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${colors[color]}`}>
                    {icon}
                </div>
                <div>
                    <p className="text-2xl font-bold text-gray-900">{value}</p>
                    <p className="text-sm text-gray-600">{label}</p>
                    {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
                </div>
            </CardContent>
        </Card>
    );
}

// ── Model Row ──────────────────────────────────────────────────
function ModelRow({ model, onView }) {
    const driveLink = extractDriveLink(model);
    const syncStatus = model.last_bim360_sync;
    const fileType = getFileType(model);
    const ext = getExt(model.name);
    const typeColor = FILE_TYPE_COLORS[ext] || 'bg-gray-100 text-gray-600';

    return (
        <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100 group">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-blue-500" />
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-medium text-gray-900 truncate text-sm">{model.name}</span>
                    <Badge className={`text-xs shrink-0 ${typeColor}`}>{fileType}</Badge>
                    {model.source === 'bim360' && (
                        <Badge className="text-xs bg-indigo-50 text-indigo-600 shrink-0">ACC</Badge>
                    )}
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                    {model.floor_level && <span>{model.floor_level}</span>}
                    {model.building_type && <span>• {model.building_type}</span>}
                    <span>• {timeAgo(model.created_date)}</span>
                </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
                {/* Drive status */}
                {driveLink ? (
                    <a href={driveLink} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-green-600 hover:underline">
                        <FolderOpen className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Drive</span>
                    </a>
                ) : (
                    <span className="flex items-center gap-1 text-xs text-gray-300">
                        <FolderOpen className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">-</span>
                    </span>
                )}

                {/* Sync status */}
                {syncStatus ? (
                    <span className="flex items-center gap-1 text-xs text-blue-500">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">مزامن</span>
                    </span>
                ) : (
                    <span className="flex items-center gap-1 text-xs text-gray-300">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">محلي</span>
                    </span>
                )}

                <Button size="sm" variant="outline" onClick={() => onView(model)}
                    className="h-7 text-xs gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Eye className="w-3 h-3" /> عرض
                </Button>
            </div>
        </div>
    );
}

// ── Main Dashboard ─────────────────────────────────────────────
export default function BIMDashboard() {
    const [user, setUser] = useState(null);
    const [models, setModels] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedModel, setSelectedModel] = useState(null);
    const [syncing, setSyncing] = useState(false);
    const [lastSync, setLastSync] = useState(null);

    // Filters
    const [search, setSearch] = useState('');
    const [filterSource, setFilterSource] = useState('all');
    const [filterType, setFilterType] = useState('all');
    const [filterDrive, setFilterDrive] = useState('all');

    const sheetsId = null; // Will be replaced by BIM_SHEETS_ID when configured

    useEffect(() => {
        const init = async () => {
            try {
                const u = await base44.auth.me();
                setUser(u);
                await loadModels();
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        init();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [models, search, filterSource, filterType, filterDrive]);

    const loadModels = async () => {
        const data = await base44.entities.BIMModel.list('-created_date', 200);
        setModels(data);
        setLastSync(new Date());
    };

    const applyFilters = () => {
        let result = [...models];
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(m =>
                m.name?.toLowerCase().includes(q) ||
                m.description?.toLowerCase().includes(q) ||
                m.floor_level?.toLowerCase().includes(q) ||
                m.building_type?.toLowerCase().includes(q) ||
                m.project_id?.toLowerCase().includes(q)
            );
        }
        if (filterSource !== 'all') result = result.filter(m => m.source === filterSource);
        if (filterType !== 'all') result = result.filter(m => getExt(m.name) === filterType);
        if (filterDrive === 'synced') result = result.filter(m => hasDriveLink(m));
        if (filterDrive === 'not_synced') result = result.filter(m => !hasDriveLink(m));
        setFiltered(result);
    };

    const handleSyncAll = async () => {
        setSyncing(true);
        try {
            await base44.functions.invoke('bimService', { action: 'sync_all' });
            await loadModels();
        } catch (e) { console.error(e); }
        finally { setSyncing(false); }
    };

    const clearFilters = () => {
        setSearch('');
        setFilterSource('all');
        setFilterType('all');
        setFilterDrive('all');
    };

    const hasActiveFilters = search || filterSource !== 'all' || filterType !== 'all' || filterDrive !== 'all';

    // Stats
    const totalModels = models.length;
    const syncedModels = models.filter(m => m.last_bim360_sync).length;
    const driveModels = models.filter(m => hasDriveLink(m)).length;
    const bim360Models = models.filter(m => m.source === 'bim360').length;

    // Recent models (last 5)
    const recentModels = [...models].sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).slice(0, 5);

    // File type breakdown
    const typeBreakdown = models.reduce((acc, m) => {
        const ext = getExt(m.name) || 'other';
        acc[ext] = (acc[ext] || 0) + 1;
        return acc;
    }, {});

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen" dir="rtl">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50" dir="rtl">
            {/* Header */}
            <div className="bg-gradient-to-l from-slate-900 to-blue-900 text-white px-6 py-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/30 flex items-center justify-center">
                                <Building2 className="w-6 h-6" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold">لوحة تحكم BIM المركزية</h1>
                                <p className="text-blue-300 text-xs mt-0.5">
                                    {lastSync ? `آخر تحديث: ${lastSync.toLocaleTimeString('ar-SA')}` : 'جارٍ التحميل...'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <Button variant="outline" size="sm"
                                className="border-white/20 text-white hover:bg-white/10 gap-2"
                                onClick={handleSyncAll} disabled={syncing}>
                                <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                                مزامنة الكل
                            </Button>
                            <Link to={createPageUrl('BIMSearch')}>
                                <Button size="sm" className="bg-blue-500 hover:bg-blue-400 gap-2">
                                    <Search className="w-4 h-4" /> البحث الذكي
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">

                {/* Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard icon={<Layers className="w-6 h-6" />} label="إجمالي النماذج" value={totalModels} sub="نموذج BIM" color="blue" />
                    <StatCard icon={<Cloud className="w-6 h-6" />} label="مزامن ACC" value={syncedModels} sub={`من ${totalModels}`} color="purple" />
                    <StatCard icon={<FolderOpen className="w-6 h-6" />} label="في Google Drive" value={driveModels} sub="نموذج مؤرشف" color="green" />
                    <StatCard icon={<CloudDownload className="w-6 h-6" />} label="من BIM 360" value={bim360Models} sub="مستورد تلقائياً" color="orange" />
                </div>

                {/* Integration Status Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Google Drive */}
                    <Card className="border-0 shadow-sm">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center">
                                    <FolderOpen className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="font-semibold text-sm text-gray-800">Google Drive</p>
                                    <p className="text-xs text-gray-400">الأرشفة التلقائية</p>
                                </div>
                                <Badge className="mr-auto bg-green-100 text-green-700 text-xs">مفعّل</Badge>
                            </div>
                            <div className="text-xs text-gray-500 space-y-1">
                                <div className="flex justify-between">
                                    <span>ملفات مؤرشفة</span>
                                    <span className="font-medium text-gray-700">{driveModels}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>بانتظار الأرشفة</span>
                                    <span className="font-medium text-gray-700">{totalModels - driveModels}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Gmail */}
                    <Card className="border-0 shadow-sm">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center">
                                    <Mail className="w-5 h-5 text-red-500" />
                                </div>
                                <div>
                                    <p className="font-semibold text-sm text-gray-800">Gmail</p>
                                    <p className="text-xs text-gray-400">إشعارات المهندسين</p>
                                </div>
                                <Badge className="mr-auto bg-green-100 text-green-700 text-xs">مفعّل</Badge>
                            </div>
                            <p className="text-xs text-gray-500">
                                يُرسل إشعار تلقائي للمهندس المسؤول فور رفع أي نموذج BIM جديد مع رابط Drive المباشر.
                            </p>
                        </CardContent>
                    </Card>

                    {/* Google Sheets */}
                    <Card className="border-0 shadow-sm">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                                    <TableProperties className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div>
                                    <p className="font-semibold text-sm text-gray-800">Google Sheets</p>
                                    <p className="text-xs text-gray-400">جدول ميزانية المشروع</p>
                                </div>
                                {sheetsId ? (
                                    <Badge className="mr-auto bg-green-100 text-green-700 text-xs">مفعّل</Badge>
                                ) : (
                                    <Badge className="mr-auto bg-yellow-100 text-yellow-700 text-xs">يحتاج إعداد</Badge>
                                )}
                            </div>
                            {sheetsId ? (
                                <a href={`https://docs.google.com/spreadsheets/d/${sheetsId}`}
                                    target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-xs text-emerald-600 hover:underline">
                                    <ExternalLink className="w-3.5 h-3.5" />
                                    فتح جدول الميزانية
                                </a>
                            ) : (
                                <p className="text-xs text-gray-400">
                                    أضف <code className="bg-gray-100 px-1 rounded">BIM_SHEETS_ID</code> في إعدادات الأسرار لتفعيل التحديث التلقائي.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content: Search + Table */}
                <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-0 pt-5 px-5">
                        <div className="flex items-center justify-between flex-wrap gap-3">
                            <div className="flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-blue-600" />
                                <h2 className="font-bold text-gray-800">النماذج المستوردة</h2>
                                <Badge className="bg-blue-50 text-blue-700 text-xs">{filtered.length} / {totalModels}</Badge>
                            </div>
                            {hasActiveFilters && (
                                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-gray-400 hover:text-gray-600 gap-1 text-xs h-7">
                                    <X className="w-3.5 h-3.5" /> مسح الفلاتر
                                </Button>
                            )}
                        </div>

                        {/* Filters */}
                        <div className="flex items-center gap-2 mt-4 flex-wrap">
                            <div className="relative flex-1 min-w-48">
                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="بحث بالاسم، المشروع، الطابق..."
                                    className="pr-9 h-9 text-sm"
                                />
                            </div>
                            <Select value={filterSource} onValueChange={setFilterSource}>
                                <SelectTrigger className="w-36 h-9 text-sm">
                                    <SelectValue placeholder="المصدر" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">كل المصادر</SelectItem>
                                    <SelectItem value="bim360">BIM 360 / ACC</SelectItem>
                                    <SelectItem value="manual">يدوي</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={filterType} onValueChange={setFilterType}>
                                <SelectTrigger className="w-32 h-9 text-sm">
                                    <SelectValue placeholder="نوع الملف" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">كل الأنواع</SelectItem>
                                    <SelectItem value="rvt">RVT - Revit</SelectItem>
                                    <SelectItem value="dwg">DWG - AutoCAD</SelectItem>
                                    <SelectItem value="ifc">IFC</SelectItem>
                                    <SelectItem value="nwc">NWC - Navisworks</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={filterDrive} onValueChange={setFilterDrive}>
                                <SelectTrigger className="w-36 h-9 text-sm">
                                    <SelectValue placeholder="Drive" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">كل الحالات</SelectItem>
                                    <SelectItem value="synced">مؤرشف في Drive</SelectItem>
                                    <SelectItem value="not_synced">غير مؤرشف</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>

                    <CardContent className="px-5 pt-4 pb-5">
                        {filtered.length === 0 ? (
                            <div className="text-center py-16 text-gray-400">
                                {hasActiveFilters ? (
                                    <>
                                        <Filter className="w-10 h-10 mx-auto mb-3 opacity-30" />
                                        <p className="text-sm">لا توجد نماذج تطابق الفلاتر المحددة</p>
                                        <Button variant="ghost" size="sm" onClick={clearFilters} className="mt-2 text-blue-500">مسح الفلاتر</Button>
                                    </>
                                ) : (
                                    <>
                                        <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
                                        <p className="text-sm">لا توجد نماذج BIM بعد</p>
                                        <Link to={createPageUrl('BIMSearch')}>
                                            <Button className="mt-3 gap-2" size="sm">
                                                <CloudDownload className="w-4 h-4" /> استورد من ACC
                                            </Button>
                                        </Link>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {filtered.map(model => (
                                    <ModelRow key={model.id} model={model} onView={setSelectedModel} />
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Bottom: Recent Activity + Type Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Recent Additions */}
                    <Card className="border-0 shadow-sm">
                        <CardContent className="p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <Calendar className="w-4 h-4 text-blue-500" />
                                <h3 className="font-semibold text-sm text-gray-800">أحدث النماذج المضافة</h3>
                            </div>
                            {recentModels.length === 0 ? (
                                <p className="text-sm text-gray-400 text-center py-4">لا توجد نماذج</p>
                            ) : (
                                <div className="space-y-3">
                                    {recentModels.map(m => (
                                        <div key={m.id} className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                                                <FileText className="w-4 h-4 text-blue-500" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-800 truncate">{m.name}</p>
                                                <p className="text-xs text-gray-400">{timeAgo(m.created_date)}</p>
                                            </div>
                                            <button onClick={() => setSelectedModel(m)}
                                                className="text-blue-500 hover:text-blue-700 shrink-0">
                                                <ArrowUpRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* File Type Breakdown */}
                    <Card className="border-0 shadow-sm">
                        <CardContent className="p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <SlidersHorizontal className="w-4 h-4 text-purple-500" />
                                <h3 className="font-semibold text-sm text-gray-800">توزيع أنواع الملفات</h3>
                            </div>
                            {Object.keys(typeBreakdown).length === 0 ? (
                                <p className="text-sm text-gray-400 text-center py-4">لا توجد بيانات</p>
                            ) : (
                                <div className="space-y-3">
                                    {Object.entries(typeBreakdown).sort((a, b) => b[1] - a[1]).map(([ext, count]) => {
                                        const pct = Math.round((count / totalModels) * 100);
                                        const color = FILE_TYPE_COLORS[ext] || 'bg-gray-100 text-gray-600';
                                        return (
                                            <div key={ext}>
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${color}`}>
                                                        {ext.toUpperCase()}
                                                    </span>
                                                    <span className="text-xs text-gray-500">{count} نموذج ({pct}%)</span>
                                                </div>
                                                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-blue-400 rounded-full" style={{ width: `${pct}%` }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* BIM Viewer */}
            {selectedModel && (
                <BIMViewer
                    modelUrn={selectedModel.model_urn}
                    modelName={selectedModel.name}
                    onClose={() => setSelectedModel(null)}
                />
            )}
        </div>
    );
}