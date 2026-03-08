import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Loader2, BarChart3, Search, Download, AlertTriangle,
    CheckCircle2, TrendingUp, Package, ArrowUpDown, Filter
} from 'lucide-react';

const PRIORITY_CONFIG = {
    critical: { label: 'حرجة', color: 'bg-red-100 text-red-700 border-red-200' },
    high: { label: 'عالية', color: 'bg-orange-100 text-orange-700 border-orange-200' },
    medium: { label: 'متوسطة', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    low: { label: 'منخفضة', color: 'bg-green-100 text-green-700 border-green-200' },
};

function exportCSV(quantities, modelName) {
    const headers = ['المادة', 'الفئة', 'العدد', 'الحجم (م³)', 'المساحة (م²)', 'الطول (م)', 'التكلفة التقديرية'];
    const rows = quantities.map(q => [
        q.material, q.category, q.count,
        q.totalVolume, q.totalArea, q.totalLength, q.totalCost
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quantities_${modelName || 'bim'}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

function SummaryCard({ icon, label, value, color }) {
    return (
        <div className={`rounded-lg p-3 flex items-center gap-2 ${color}`}>
            {icon}
            <div>
                <p className="text-xs opacity-70">{label}</p>
                <p className="font-bold text-sm">{value}</p>
            </div>
        </div>
    );
}

export default function QuantitiesPanel({ modelUrn, modelId, modelName }) {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('materials'); // materials | priority
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('cost'); // cost | volume | area | count
    const [filterPriority, setFilterPriority] = useState('all');

    const fetchQuantities = async () => {
        setLoading(true);
        setError('');
        setData(null);
        try {
            const res = await base44.functions.invoke('bimQuantities', {
                action: 'get_quantities',
                model_urn: modelUrn,
                model_id: modelId,
            });
            if (res.data?.error) throw new Error(res.data.error);
            setData(res.data);
        } catch (e) {
            setError(e.message || 'فشل في استخراج الكميات');
        } finally {
            setLoading(false);
        }
    };

    // Filter & sort quantities
    const filteredQuantities = (data?.quantities || [])
        .filter(q => !search || q.material?.toLowerCase().includes(search.toLowerCase()) || q.category?.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => {
            if (sortBy === 'cost') return b.totalCost - a.totalCost;
            if (sortBy === 'volume') return b.totalVolume - a.totalVolume;
            if (sortBy === 'area') return b.totalArea - a.totalArea;
            if (sortBy === 'count') return b.count - a.count;
            return 0;
        });

    const filteredPriority = (data?.priority_elements || [])
        .filter(e => filterPriority === 'all' || e.priority === filterPriority);

    // Empty state
    if (!data && !loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center gap-4">
                <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center">
                    <BarChart3 className="w-7 h-7 text-blue-500" />
                </div>
                <div>
                    <p className="font-semibold text-gray-700 text-sm mb-1">تحليل كميات المواد</p>
                    <p className="text-xs text-gray-400 leading-relaxed">
                        استخراج تفصيلي للكميات والتكاليف التقديرية من بيانات النموذج
                    </p>
                </div>
                <Button onClick={fetchQuantities} className="gap-2 bg-blue-600 hover:bg-blue-700" size="sm">
                    <BarChart3 className="w-4 h-4" />
                    استخراج الكميات
                </Button>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-500">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <p className="text-xs">جارٍ تحليل بيانات النموذج...</p>
                <p className="text-xs text-gray-400">قد يستغرق ذلك دقيقة</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center gap-3">
                <AlertTriangle className="w-8 h-8 text-red-400" />
                <p className="text-xs text-red-600">{error}</p>
                <Button size="sm" variant="outline" onClick={fetchQuantities}>إعادة المحاولة</Button>
            </div>
        );
    }

    const { summary } = data;

    return (
        <div className="flex flex-col h-full overflow-hidden text-xs">
            {/* Summary */}
            <div className="p-3 border-b border-gray-100 bg-gray-50 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                    <SummaryCard
                        icon={<Package className="w-4 h-4 text-blue-600" />}
                        label="إجمالي المواد"
                        value={summary.total_materials}
                        color="bg-blue-50 text-blue-800"
                    />
                    <SummaryCard
                        icon={<TrendingUp className="w-4 h-4 text-green-600" />}
                        label="الحجم الكلي"
                        value={`${summary.total_volume} م³`}
                        color="bg-green-50 text-green-800"
                    />
                    <SummaryCard
                        icon={<AlertTriangle className="w-4 h-4 text-red-500" />}
                        label="عناصر حرجة"
                        value={summary.critical_count}
                        color="bg-red-50 text-red-800"
                    />
                    <SummaryCard
                        icon={<CheckCircle2 className="w-4 h-4 text-orange-500" />}
                        label="أولوية عالية"
                        value={summary.high_count}
                        color="bg-orange-50 text-orange-800"
                    />
                </div>
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 h-7 text-xs gap-1"
                        onClick={() => exportCSV(data.quantities, modelName)}
                    >
                        <Download className="w-3 h-3" /> تصدير CSV
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={fetchQuantities}>
                        <BarChart3 className="w-3 h-3" /> إعادة التحليل
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100 shrink-0">
                <button
                    onClick={() => setActiveTab('materials')}
                    className={`flex-1 py-2 text-xs font-medium transition-colors ${activeTab === 'materials' ? 'text-blue-600 border-b-2 border-blue-600 bg-white' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    كميات المواد ({data.quantities_count})
                </button>
                <button
                    onClick={() => setActiveTab('priority')}
                    className={`flex-1 py-2 text-xs font-medium transition-colors ${activeTab === 'priority' ? 'text-blue-600 border-b-2 border-blue-600 bg-white' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    الأولوية ({data.priority_elements?.length || 0})
                </button>
            </div>

            {/* Materials Tab */}
            {activeTab === 'materials' && (
                <div className="flex flex-col flex-1 overflow-hidden">
                    <div className="p-2 border-b border-gray-100 space-y-1.5">
                        <div className="relative">
                            <Search className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                            <Input value={search} onChange={e => setSearch(e.target.value)}
                                placeholder="بحث في المواد..." className="pr-7 h-7 text-xs" />
                        </div>
                        <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger className="h-7 text-xs">
                                <ArrowUpDown className="w-3 h-3 ml-1" />
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
                    <div className="flex-1 overflow-y-auto">
                        {filteredQuantities.length === 0 ? (
                            <p className="text-center text-gray-400 p-6">لا توجد بيانات كميات</p>
                        ) : (
                            filteredQuantities.map((q, i) => (
                                <MaterialRow key={i} q={q} />
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Priority Tab */}
            {activeTab === 'priority' && (
                <div className="flex flex-col flex-1 overflow-hidden">
                    <div className="p-2 border-b border-gray-100">
                        <Select value={filterPriority} onValueChange={setFilterPriority}>
                            <SelectTrigger className="h-7 text-xs">
                                <Filter className="w-3 h-3 ml-1" />
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">كل الأولويات</SelectItem>
                                <SelectItem value="critical">حرجة فقط</SelectItem>
                                <SelectItem value="high">عالية فقط</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {filteredPriority.length === 0 ? (
                            <p className="text-center text-gray-400 p-6">لا توجد عناصر ذات أولوية</p>
                        ) : (
                            filteredPriority.map((el, i) => (
                                <PriorityRow key={i} el={el} />
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function MaterialRow({ q }) {
    const [expanded, setExpanded] = useState(false);
    return (
        <div className="border-b border-gray-50">
            <button
                onClick={() => setExpanded(e => !e)}
                className="w-full flex items-start gap-2 px-3 py-2.5 hover:bg-gray-50 text-right"
            >
                <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate">{q.material}</p>
                    <p className="text-gray-400 truncate">{q.category}</p>
                </div>
                <div className="text-left shrink-0 space-y-0.5">
                    {q.totalVolume > 0 && <p className="text-gray-600">{q.totalVolume} م³</p>}
                    {q.totalArea > 0 && <p className="text-gray-600">{q.totalArea} م²</p>}
                    {q.totalCost > 0 && <p className="text-green-700 font-medium">{q.totalCost.toLocaleString()} ر.س</p>}
                    <Badge className="text-xs bg-blue-50 text-blue-600">{q.count} عنصر</Badge>
                </div>
            </button>
            {expanded && q.elements?.length > 0 && (
                <div className="px-3 pb-2 bg-gray-50">
                    <p className="text-gray-400 mb-1">العناصر المرتبطة:</p>
                    <div className="flex flex-wrap gap-1">
                        {q.elements.map((el, i) => (
                            <span key={i} className="bg-white border border-gray-200 rounded px-1.5 py-0.5 text-gray-600">{el}</span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function PriorityRow({ el }) {
    const cfg = PRIORITY_CONFIG[el.priority] || PRIORITY_CONFIG.medium;
    return (
        <div className="flex items-start gap-2 px-3 py-2.5 border-b border-gray-50 hover:bg-gray-50">
            <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 truncate">{el.name}</p>
                <p className="text-gray-400 truncate">{el.material}</p>
                <p className="text-gray-400">الحالة: {el.status}</p>
            </div>
            <div className="text-left shrink-0 space-y-1">
                <Badge className={`text-xs ${cfg.color}`}>{cfg.label}</Badge>
                {el.cost > 0 && <p className="text-green-700 font-medium">{el.cost.toLocaleString()} ر.س</p>}
                {el.volume > 0 && <p className="text-gray-500">{el.volume} م³</p>}
            </div>
        </div>
    );
}