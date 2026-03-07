import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Eye, Plus, Building2, Layers, Shield, AlertCircle, Loader2 } from 'lucide-react';
import BIMViewer from '@/components/bim/BIMViewer';
import AddBIMModelModal from '@/components/bim/AddBIMModelModal';

export default function BIMSearch() {
    const [user, setUser] = useState(null);
    const [models, setModels] = useState([]);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedModel, setSelectedModel] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);

    useEffect(() => {
        const init = async () => {
            try {
                const u = await base44.auth.me();
                setUser(u);
                await loadModels(u);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, []);

    const loadModels = async (u) => {
        const allModels = await base44.entities.BIMModel.list('-created_date', 100);
        // حوكمة الوصول
        const filtered = allModels.filter(m => hasAccess(m, u));
        setModels(filtered);
        setResults(filtered);
    };

    // حوكمة البيانات - Data Governance Filter
    const hasAccess = (model, u) => {
        if (!u) return false;
        if (u.role === 'admin') return true;
        // المستثمر: يرى فقط النماذج المرتبطة به
        if (u.role === 'investor' || u.role === 'client') {
            return model.investor_id === u.id || model.created_by === u.email;
        }
        // المهندس: يرى نماذجه فقط
        if (u.role === 'engineer') {
            return model.created_by === u.email || model.owner_engineer_id === u.id;
        }
        // admin/firm
        return model.created_by === u.email;
    };

    const handleSearch = (q) => {
        setQuery(q);
        if (!q.trim()) {
            setResults(models);
            return;
        }
        const lower = q.toLowerCase();
        const filtered = models.filter(m => {
            // البحث في حقول النموذج الأساسية
            const basicMatch =
                m.name?.toLowerCase().includes(lower) ||
                m.description?.toLowerCase().includes(lower) ||
                m.floor_level?.toLowerCase().includes(lower) ||
                m.building_type?.toLowerCase().includes(lower);

            if (basicMatch) return true;

            // البحث في الخصائص المفهرسة (BIM metadata)
            if (m.indexed_properties && m.indexed_properties.length > 0) {
                return m.indexed_properties.some(el => {
                    const name = el.name?.toLowerCase() || '';
                    if (name.includes(lower)) return true;
                    // البحث داخل قيم الخصائص
                    if (el.properties) {
                        return Object.values(el.properties).some(group => {
                            if (typeof group === 'object') {
                                return Object.entries(group).some(([k, v]) =>
                                    k.toLowerCase().includes(lower) ||
                                    String(v).toLowerCase().includes(lower)
                                );
                            }
                            return String(group).toLowerCase().includes(lower);
                        });
                    }
                    return false;
                });
            }
            return false;
        });
        setResults(filtered);
    };

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
            <div className="bg-gradient-to-l from-blue-900 to-blue-700 text-white px-6 py-8">
                <div className="max-w-5xl mx-auto">
                    <div className="flex items-center gap-3 mb-2">
                        <Building2 className="w-8 h-8" />
                        <h1 className="text-2xl font-bold">محرك البحث الذكي - BIM Cloud</h1>
                    </div>
                    <p className="text-blue-200 text-sm mb-6">ابحث في المخططات الهندسية بالكلمات: "جدران خرسانية"، "الدور الأرضي"، "مساحة"...</p>

                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <Input
                            className="pr-12 h-12 text-gray-900 bg-white rounded-xl text-base shadow-lg"
                            placeholder="ابحث في المخططات والعناصر الهندسية..."
                            value={query}
                            onChange={e => handleSearch(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-2 mt-3 text-blue-200 text-xs">
                        <Shield className="w-4 h-4" />
                        <span>الوصول محكوم بدورك - تظهر فقط النماذج المصرح لك بها</span>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-5xl mx-auto px-6 py-6">
                {/* Stats + Add Button */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                        <Layers className="w-4 h-4" />
                        <span>{results.length} نموذج {query ? 'في نتائج البحث' : 'متاح'}</span>
                        {models.length === 0 && (
                            <Badge variant="outline" className="text-orange-600 border-orange-300">لا توجد نماذج بعد</Badge>
                        )}
                    </div>
                    {(user?.role === 'admin' || user?.role === 'engineer') && (
                        <Button onClick={() => setShowAddModal(true)} className="gap-2">
                            <Plus className="w-4 h-4" />
                            إضافة نموذج BIM
                        </Button>
                    )}
                </div>

                {/* Results */}
                {results.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">
                        {query ? (
                            <>
                                <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                <p>لم يتم العثور على نتائج لـ "<strong>{query}</strong>"</p>
                                <p className="text-sm mt-1">جرب كلمات أخرى مثل: خرسانة، مساحة، طابق</p>
                            </>
                        ) : (
                            <>
                                <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                <p>لا توجد نماذج BIM مضافة بعد</p>
                                {(user?.role === 'admin' || user?.role === 'engineer') && (
                                    <Button className="mt-4" onClick={() => setShowAddModal(true)}>
                                        <Plus className="w-4 h-4 ml-2" /> أضف أول نموذج
                                    </Button>
                                )}
                            </>
                        )}
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                        {results.map(model => (
                            <ModelCard
                                key={model.id}
                                model={model}
                                query={query}
                                onView={() => setSelectedModel(model)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* BIM 3D Viewer */}
            {selectedModel && (
                <BIMViewer
                    modelUrn={selectedModel.model_urn}
                    onClose={() => setSelectedModel(null)}
                />
            )}

            {/* Add Model Modal */}
            <AddBIMModelModal
                open={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSaved={() => loadModels(user)}
            />
        </div>
    );
}

function ModelCard({ model, query, onView }) {
    // Find matching properties for highlight
    const matchedProps = [];
    if (query && model.indexed_properties) {
        const lower = query.toLowerCase();
        model.indexed_properties.forEach(el => {
            if (el.properties) {
                Object.values(el.properties).forEach(group => {
                    if (typeof group === 'object') {
                        Object.entries(group).forEach(([k, v]) => {
                            if (k.toLowerCase().includes(lower) || String(v).toLowerCase().includes(lower)) {
                                matchedProps.push({ key: k, value: String(v), element: el.name });
                            }
                        });
                    }
                });
            }
        });
    }

    return (
        <Card className="hover:shadow-md transition-shadow border border-gray-200">
            <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
                            <h3 className="font-semibold text-gray-900 truncate">{model.name}</h3>
                        </div>
                        {model.description && <p className="text-sm text-gray-500 mb-2 line-clamp-2">{model.description}</p>}
                        <div className="flex flex-wrap gap-1 mb-2">
                            {model.floor_level && <Badge variant="outline" className="text-xs">{model.floor_level}</Badge>}
                            {model.building_type && <Badge variant="outline" className="text-xs">{model.building_type}</Badge>}
                            {model.indexed_properties?.length > 0 && (
                                <Badge className="text-xs bg-green-100 text-green-700 border-green-200">
                                    {model.indexed_properties.length} عنصر مفهرس
                                </Badge>
                            )}
                        </div>

                        {/* Matched Properties */}
                        {matchedProps.length > 0 && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-2 mt-2">
                                <p className="text-xs font-medium text-yellow-800 mb-1">نتائج مطابقة في خصائص العناصر:</p>
                                {matchedProps.slice(0, 3).map((p, i) => (
                                    <p key={i} className="text-xs text-yellow-700">
                                        <span className="font-medium">{p.element}</span> — {p.key}: <span className="font-medium">{p.value}</span>
                                    </p>
                                ))}
                                {matchedProps.length > 3 && <p className="text-xs text-yellow-600 mt-1">+{matchedProps.length - 3} نتيجة أخرى</p>}
                            </div>
                        )}
                    </div>
                    <Button size="sm" onClick={onView} className="shrink-0 gap-1">
                        <Eye className="w-4 h-4" />
                        عرض 3D
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}