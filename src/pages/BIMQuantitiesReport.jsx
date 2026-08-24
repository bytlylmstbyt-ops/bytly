import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import {
    Loader2, Building2, BarChart3, AlertTriangle, Download,
    Search, Package, TrendingUp, CheckCircle2, ArrowRight,
    Filter, RefreshCw, FileText
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#F97316', '#84CC16'];

const PRIORITY_CONFIG = {
    critical: { label: 'حرجة', color: 'bg-red-100 text-red-700' },
    high: { label: 'عالية', color: 'bg-orange-100 text-orange-700' },
};

function exportCSV(quantities, modelName) {
    const headers = ['المادة', 'الفئة', 'العدد', 'الحجم (م³)', 'المساحة (م²)', 'الطول (م)', 'التكلفة التقديرية (ر.س)'];
    const rows = quantities.map(q => [
        `"${q.material}"`, `"${q.category}"`, q.count,
        q.totalVolume, q.totalArea, q.totalLength, q.totalCost
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bim_quantities_${modelName || 'report'}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

export default function BIMQuantitiesReport() {
    const [models, setModels] = useState([]);
    const [selectedModelId, setSelectedModelId] = useState('');
    const [loading, setLoading] = useState(false);
    const [modelsLoading, setModelsLoading] = useState(true);
    const [data, setData] = useState(null);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('cost');
    const [filterPriority, setFilterPriority] = useState('all');
    const [activeView, setActiveView] = useState('table'); // table | chart | priority

    useEffect(() => {
        base44.entities.BIMModel.list('-created_date', 100).then(list => {
            const withUrn = list.filter(m => m.model_urn);
            setModels(withUrn);
            if (withUrn.length > 0) setSelectedModelId(withUrn[0].id);
            setModelsLoading(false);
        });
    }, []);

    const selectedModel = models.find(m => m.id === selectedModelId);

    const fetchQuantities = async () => {
        if (!selectedModel?.model_urn) return;
        setLoading(true);
        setError('');
        setData(null);
        try {
            const res = await base44.functions.invoke('bimQuantities', {
                action: 'get_quantities',
                model_urn: selectedModel.model_urn,
                model_id: selectedModel.id,
            });
            if (res.data?.error) throw new Error(res.data.error);
            setData(res.data);
        } catch (e) {
            setError(e.message || 'فشل في استخراج الكميات');
        } finally {
            setLoading(false);
        }
    };

    // Filtered & sorted quantities
    const filteredQuantities = (data?.quantities || [])
        .filter(q => !search || q.material?.toLowerCase().includes(search.toLowerCase()) || q.category?.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => {
            if (sortBy === 'cost') return b.totalCost - a.totalCost;
            if (sortBy === 'volume') return b.totalVolume - a.totalVolume;
            if (sortBy === 'area') return b.totalArea - a.totalArea;
            return b.count - a.count;
        });

    const filteredPriority = (data?.priority_elements || [])
        .filter(e => filterPriority === 'all' || e.priority === filterPriority);

    // Chart data: top 8 by cost
    const chartData = filteredQuantities
        .filter(q => q.totalCost > 0 || q.totalVolume > 0)
        .slice(0, 8)
        .map(q => ({
            name: q.material?.length > 12 ? q.material.slice(0, 12) + '…' : q.material,
            cost: q.totalCost,
            volume: q.totalVolume,
            area: q.totalArea,
        }));

    const pieData = filteredQuantities.slice(0, 6).map((q, i) => ({
        name: q.material?.length > 10 ? q.material.slice(0, 10) + '…' : q.material,
        value: q.count,
    }));

    return (
        <div className="min-h-screen bg-gray-50" dir="rtl">
            {/* Header */}
            <div className="bg-gradient-to-l from-slate-900 to-blue-900 text-white px-6 py-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/30 flex items-center justify-center">
                                <BarChart3 className="w-6 h-6" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold">تقرير كميات BIM</h1>
                                <p className="text-blue-300 text-xs mt-0.5">استخراج وتحليل كميات المواد التفصيلية</p>
                            </div>
                        </div>
                        <Link to={createPageUrl('BIMDashboard')}>
                            <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10 gap-2">
                                <ArrowRight className="w-4 h-4" /> لوحة التحكم
                            </Button>
                        </Link>
                    </div>

                    {/* Model Selector */}
                    <div className="mt-5 flex items-center gap-3 flex-wrap">
                        {modelsLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin text-blue-300" />
                        ) : models.length === 0 ? (
                            <p className="text-blue-300 text-sm">لا توجد نماذج BIM بـ URN محدد</p>
                        ) : (
                            <>
                                <Select value={selectedModelId} onValueChange={setSelectedModelId}>
                                    <SelectTrigger className="w-72 bg-white/10 border-white/20 text-white h-10">
                                        <Building2 className="w-4 h-4 ml-2 shrink-0" />
                                        <SelectValue placeholder="اختر نموذج BIM" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {models.map(m => (
                                            <SelectItem key={m.id} value={m.id}>
                                                {m.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button
                                    onClick={fetchQuantities}
                                    disabled={loading || !selectedModelId}
                                    className="bg-blue-500 hover:bg-blue-400 gap-2 h-10"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-4 h-4" />}
                                    {loading ? 'جارٍ التحليل...' : 'استخراج الكميات'}
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
                {/* Error */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                        <p className="text-red-700 text-sm">{error}</p>
                        <Button size="sm" variant="outline" onClick={fetchQuantities} className="mr-auto gap-1">
                            <RefreshCw className="w-3 h-3" /> إعادة
                        </Button>
                    </div>
                )}

                {/* Loading */}
                {loading && (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                        </div>
                        <p className="text-gray-600 font-medium">جارٍ تحليل بيانات النموذج...</p>
                        <p className="text-gray-400 text-sm">قد يستغرق ذلك دقيقة حسب حجم الملف</p>
                    </div>
                )}

                {/* Empty state */}
                {!loading && !data && !error && (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
                            <FileText className="w-8 h-8 text-blue-400" />
                        </div>
                        <p className="text-gray-600 font-medium">اختر نموذجاً واضغط "استخراج الكميات"</p>
                        <p className="text-gray-400 text-sm text-center max-w-sm">
                            سيتم استخراج كميات المواد التفصيلية من بيانات نموذج BIM تلقائياً
                        </p>
                    </div>
                )}

                {/* Results */}
                {data && !loading && (
                    <>
                        {/* Summary Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <Card className="border-0 shadow-sm">
                                <CardContent className="p-4 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                                        <Package className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-xl font-bold text-gray-900">{data.summary.total_materials}</p>
                                        <p className="text-xs text-gray-500">نوع مادة</p>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="border-0 shadow-sm">
                                <CardContent className="p-4 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                                        <TrendingUp className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-xl font-bold text-gray-900">{data.summary.total_volume} م³</p>
                                        <p className="text-xs text-gray-500">الحجم الكلي</p>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="border-0 shadow-sm">
                                <CardContent className="p-4 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                                        <AlertTriangle className="w-5 h-5 text-red-500" />
                                    </div>
                                    <div>
                                        <p className="text-xl font-bold text-gray-900">{data.summary.critical_count}</p>
                                        <p className="text-xs text-gray-500">عنصر حرج</p>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="border-0 shadow-sm">
                                <CardContent className="p-4 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                                        <CheckCircle2 className="w-5 h-5 text-orange-500" />
                                    </div>
                                    <div>
                                        <p className="text-xl font-bold text-gray-900">{data.summary.total_elements}</p>
                                        <p className="text-xs text-gray-500">عنصر محلّل</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* View Tabs */}
                        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 w-fit">
                            {[
                                { id: 'table', label: 'جدول الكميات' },
                                { id: 'chart', label: 'الرسوم البيانية' },
                                { id: 'priority', label: `الأولوية (${data.priority_elements?.length || 0})` },
                            ].map(t => (
                                <button key={t.id} onClick={() => setActiveView(t.id)}
                                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeView === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                                    {t.label}
                                </button>
                            ))}
                        </div>

                        {/* TABLE VIEW */}
                        {activeView === 'table' && (
                            <Card className="border-0 shadow-sm">
                                <CardHeader className="pb-0 pt-5 px-5">
                                    <div className="flex items-center justify-between flex-wrap gap-3">
                                        <div className="flex items-center gap-2">
                                            <Package className="w-4 h-4 text-blue-600" />
                                            <span className="font-bold text-gray-800">كميات المواد</span>
                                            <Badge className="bg-blue-50 text-blue-700 text-xs">{filteredQuantities.length}</Badge>
                                        </div>
                                        <Button size="sm" variant="outline" className="gap-1 text-xs h-8"
                                            onClick={() => exportCSV(data.quantities, selectedModel?.name)}>
                                            <Download className="w-3.5 h-3.5" /> تصدير CSV
                                        </Button>
                                    </div>
                                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                                        <div className="relative flex-1 min-w-48">
                                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                            <Input value={search} onChange={e => setSearch(e.target.value)}
                                                placeholder="بحث في المواد..." className="pr-8 h-8 text-sm" />
                                        </div>
                                        <Select value={sortBy} onValueChange={setSortBy}>
                                            <SelectTrigger className="w-40 h-8 text-sm">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="cost">ترتيب: التكلفة</SelectItem>
                                                <SelectItem value="volume">ترتيب: الحجم</SelectItem>
                                                <SelectItem value="area">ترتيب: المساحة</SelectItem>
                                                <SelectItem value="count">ترتيب: العدد</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0 mt-4">
                                    {/* Desktop table */}
                                    <div className="hidden sm:block overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-50 border-y border-gray-100">
                                                <tr>
                                                    <th className="px-5 py-3 text-right font-semibold text-gray-600 text-xs">#</th>
                                                    <th className="px-5 py-3 text-right font-semibold text-gray-600 text-xs">المادة</th>
                                                    <th className="px-5 py-3 text-right font-semibold text-gray-600 text-xs">الفئة</th>
                                                    <th className="px-5 py-3 text-center font-semibold text-gray-600 text-xs">العدد</th>
                                                    <th className="px-5 py-3 text-center font-semibold text-gray-600 text-xs">الحجم (م³)</th>
                                                    <th className="px-5 py-3 text-center font-semibold text-gray-600 text-xs">المساحة (م²)</th>
                                                    <th className="px-5 py-3 text-center font-semibold text-gray-600 text-xs">التكلفة (ر.س)</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredQuantities.map((q, i) => (
                                                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                                        <td className="px-5 py-3 text-gray-400 text-xs">{i + 1}</td>
                                                        <td className="px-5 py-3">
                                                            <p className="font-medium text-gray-800">{q.material}</p>
                                                            {q.elements?.length > 0 && (
                                                                <p className="text-xs text-gray-400 truncate max-w-48">{q.elements.slice(0, 2).join('، ')}</p>
                                                            )}
                                                        </td>
                                                        <td className="px-5 py-3 text-gray-500 text-xs">{q.category}</td>
                                                        <td className="px-5 py-3 text-center">
                                                            <Badge className="bg-blue-50 text-blue-700 text-xs">{q.count}</Badge>
                                                        </td>
                                                        <td className="px-5 py-3 text-center text-gray-700">{q.totalVolume > 0 ? q.totalVolume : '—'}</td>
                                                        <td className="px-5 py-3 text-center text-gray-700">{q.totalArea > 0 ? q.totalArea : '—'}</td>
                                                        <td className="px-5 py-3 text-center">
                                                            {q.totalCost > 0 ? (
                                                                <span className="font-semibold text-green-700">{q.totalCost.toLocaleString()}</span>
                                                            ) : '—'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    {/* Mobile card list */}
                                    <div className="sm:hidden divide-y divide-gray-100">
                                        {filteredQuantities.map((q, i) => (
                                            <div key={i} className="p-4 space-y-2">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <p className="font-semibold text-gray-800 text-sm">{q.material}</p>
                                                        {q.category && <p className="text-xs text-gray-400">{q.category}</p>}
                                                    </div>
                                                    <Badge className="bg-blue-50 text-blue-700 text-xs shrink-0">{q.count} عنصر</Badge>
                                                </div>
                                                <div className="grid grid-cols-3 gap-2 text-xs">
                                                    <div className="bg-gray-50 rounded p-2 text-center">
                                                        <p className="text-gray-500">الحجم</p>
                                                        <p className="font-medium text-gray-700">{q.totalVolume > 0 ? `${q.totalVolume} م³` : '—'}</p>
                                                    </div>
                                                    <div className="bg-gray-50 rounded p-2 text-center">
                                                        <p className="text-gray-500">المساحة</p>
                                                        <p className="font-medium text-gray-700">{q.totalArea > 0 ? `${q.totalArea} م²` : '—'}</p>
                                                    </div>
                                                    <div className="bg-green-50 rounded p-2 text-center">
                                                        <p className="text-gray-500">التكلفة</p>
                                                        <p className="font-semibold text-green-700">{q.totalCost > 0 ? q.totalCost.toLocaleString() : '—'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* CHART VIEW */}
                        {activeView === 'chart' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Card className="border-0 shadow-sm">
                                    <CardContent className="p-5">
                                        <h3 className="font-bold text-gray-800 mb-4 text-sm">التكلفة التقديرية حسب المادة</h3>
                                        {chartData.length === 0 ? (
                                            <p className="text-gray-400 text-sm text-center py-8">لا توجد بيانات تكلفة</p>
                                        ) : (
                                            <ResponsiveContainer width="100%" height={240}>
                                                <BarChart data={chartData} layout="vertical">
                                                    <XAxis type="number" tick={{ fontSize: 11 }} />
                                                    <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 11 }} />
                                                    <Tooltip formatter={(v) => [`${v.toLocaleString()} ر.س`, 'التكلفة']} />
                                                    <Bar dataKey="cost" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        )}
                                    </CardContent>
                                </Card>
                                <Card className="border-0 shadow-sm">
                                    <CardContent className="p-5">
                                        <h3 className="font-bold text-gray-800 mb-4 text-sm">توزيع العناصر حسب المادة</h3>
                                        {pieData.length === 0 ? (
                                            <p className="text-gray-400 text-sm text-center py-8">لا توجد بيانات</p>
                                        ) : (
                                            <ResponsiveContainer width="100%" height={240}>
                                                <PieChart>
                                                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                                                        {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                                    </Pie>
                                                    <Tooltip />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        )}
                                    </CardContent>
                                </Card>
                                <Card className="border-0 shadow-sm md:col-span-2">
                                    <CardContent className="p-5">
                                        <h3 className="font-bold text-gray-800 mb-4 text-sm">الحجم الكلي حسب المادة (م³)</h3>
                                        {chartData.filter(d => d.volume > 0).length === 0 ? (
                                            <p className="text-gray-400 text-sm text-center py-8">لا توجد بيانات حجم</p>
                                        ) : (
                                            <ResponsiveContainer width="100%" height={200}>
                                                <BarChart data={chartData.filter(d => d.volume > 0)}>
                                                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                                    <YAxis tick={{ fontSize: 11 }} />
                                                    <Tooltip formatter={(v) => [`${v} م³`, 'الحجم']} />
                                                    <Bar dataKey="volume" radius={[4, 4, 0, 0]}>
                                                        {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {/* PRIORITY VIEW */}
                        {activeView === 'priority' && (
                            <Card className="border-0 shadow-sm">
                                <CardHeader className="pb-0 pt-5 px-5">
                                    <div className="flex items-center justify-between flex-wrap gap-3">
                                        <div className="flex items-center gap-2">
                                            <AlertTriangle className="w-4 h-4 text-orange-500" />
                                            <span className="font-bold text-gray-800">العناصر ذات الأولوية</span>
                                        </div>
                                        <Select value={filterPriority} onValueChange={setFilterPriority}>
                                            <SelectTrigger className="w-40 h-8 text-sm">
                                                <Filter className="w-3.5 h-3.5 ml-1" />
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">كل الأولويات</SelectItem>
                                                <SelectItem value="critical">حرجة فقط</SelectItem>
                                                <SelectItem value="high">عالية فقط</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0 mt-4">
                                    {filteredPriority.length === 0 ? (
                                        <div className="text-center py-12 text-gray-400">
                                            <CheckCircle2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                            <p className="text-sm">لا توجد عناصر ذات أولوية في هذا الفلتر</p>
                                        </div>
                                    ) : (
                                        <>
                                        {/* Desktop table */}
                                        <div className="hidden sm:block overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead className="bg-gray-50 border-y border-gray-100">
                                                    <tr>
                                                        <th className="px-5 py-3 text-right font-semibold text-gray-600 text-xs">العنصر</th>
                                                        <th className="px-5 py-3 text-right font-semibold text-gray-600 text-xs">المادة</th>
                                                        <th className="px-5 py-3 text-center font-semibold text-gray-600 text-xs">الأولوية</th>
                                                        <th className="px-5 py-3 text-center font-semibold text-gray-600 text-xs">التكلفة (ر.س)</th>
                                                        <th className="px-5 py-3 text-center font-semibold text-gray-600 text-xs">الحجم (م³)</th>
                                                        <th className="px-5 py-3 text-right font-semibold text-gray-600 text-xs">الحالة</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filteredPriority.map((el, i) => {
                                                        const cfg = PRIORITY_CONFIG[el.priority] || PRIORITY_CONFIG.high;
                                                        return (
                                                            <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                                                                <td className="px-5 py-3 font-medium text-gray-800">{el.name}</td>
                                                                <td className="px-5 py-3 text-gray-500 text-xs">{el.material}</td>
                                                                <td className="px-5 py-3 text-center">
                                                                    <Badge className={`text-xs ${cfg.color}`}>{cfg.label}</Badge>
                                                                </td>
                                                                <td className="px-5 py-3 text-center font-semibold text-green-700">
                                                                    {el.cost > 0 ? el.cost.toLocaleString() : '—'}
                                                                </td>
                                                                <td className="px-5 py-3 text-center text-gray-700">
                                                                    {el.volume > 0 ? el.volume : '—'}
                                                                </td>
                                                                <td className="px-5 py-3 text-gray-500 text-xs">{el.status}</td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                        {/* Mobile card list */}
                                        <div className="sm:hidden divide-y divide-gray-100">
                                            {filteredPriority.map((el, i) => {
                                                const cfg = PRIORITY_CONFIG[el.priority] || PRIORITY_CONFIG.high;
                                                return (
                                                    <div key={i} className="p-4 space-y-2">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div>
                                                                <p className="font-semibold text-gray-800 text-sm">{el.name}</p>
                                                                {el.material && <p className="text-xs text-gray-400">{el.material}</p>}
                                                            </div>
                                                            <Badge className={`text-xs shrink-0 ${cfg.color}`}>{cfg.label}</Badge>
                                                        </div>
                                                        <div className="grid grid-cols-3 gap-2 text-xs">
                                                            <div className="bg-green-50 rounded p-2 text-center">
                                                                <p className="text-gray-500">التكلفة</p>
                                                                <p className="font-semibold text-green-700">{el.cost > 0 ? el.cost.toLocaleString() : '—'}</p>
                                                            </div>
                                                            <div className="bg-gray-50 rounded p-2 text-center">
                                                                <p className="text-gray-500">الحجم</p>
                                                                <p className="font-medium text-gray-700">{el.volume > 0 ? `${el.volume} م³` : '—'}</p>
                                                            </div>
                                                            <div className="bg-gray-50 rounded p-2 text-center">
                                                                <p className="text-gray-500">الحالة</p>
                                                                <p className="font-medium text-gray-700 truncate">{el.status || '—'}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}