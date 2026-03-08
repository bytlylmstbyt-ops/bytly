import { useEffect, useRef, useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import {
    Loader2, AlertCircle, X, ChevronRight, ChevronDown,
    Layers, Info, List, Search, Home, ZoomIn, ZoomOut,
    Maximize2, RotateCcw, Box, FileText, BarChart3
} from 'lucide-react';
import QuantitiesPanel from './QuantitiesPanel';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const FILE_TYPE_LABELS = {
    rvt: { label: 'Revit', color: 'bg-blue-100 text-blue-700' },
    dwg: { label: 'AutoCAD', color: 'bg-green-100 text-green-700' },
    ifc: { label: 'IFC', color: 'bg-purple-100 text-purple-700' },
    nwc: { label: 'Navisworks', color: 'bg-orange-100 text-orange-700' },
    nwd: { label: 'Navisworks', color: 'bg-orange-100 text-orange-700' },
    pdf: { label: 'PDF', color: 'bg-red-100 text-red-700' },
};

function getExt(name = '') {
    return name.split('.').pop()?.toLowerCase() || '';
}

// Properties Panel
function PropertiesPanel({ viewer, selectedDbId }) {
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [expanded, setExpanded] = useState({});

    useEffect(() => {
        if (!viewer || selectedDbId == null) {
            setProperties([]);
            return;
        }
        setLoading(true);
        viewer.getProperties(selectedDbId, (result) => {
            // Group by category
            const grouped = {};
            (result.properties || []).forEach(prop => {
                const cat = prop.displayCategory || 'عام';
                if (!grouped[cat]) grouped[cat] = [];
                grouped[cat].push(prop);
            });
            const groups = Object.entries(grouped).map(([cat, props]) => ({ cat, props }));
            setProperties(groups);
            // auto-expand first group
            if (groups.length > 0) setExpanded({ [groups[0].cat]: true });
            setLoading(false);
        }, () => {
            setProperties([]);
            setLoading(false);
        });
    }, [viewer, selectedDbId]);

    const filtered = search.trim()
        ? properties.map(g => ({
            ...g,
            props: g.props.filter(p =>
                p.displayName?.toLowerCase().includes(search.toLowerCase()) ||
                String(p.displayValue)?.toLowerCase().includes(search.toLowerCase())
            )
        })).filter(g => g.props.length > 0)
        : properties;

    if (selectedDbId == null) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3 p-6 text-center">
                <Box className="w-10 h-10 opacity-40" />
                <p className="text-sm">انقر على عنصر في النموذج لعرض خصائصه</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            <div className="p-3 border-b border-gray-100">
                <div className="relative">
                    <Search className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <Input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="بحث في الخصائص..."
                        className="pr-8 h-8 text-xs"
                    />
                </div>
            </div>
            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                    </div>
                ) : filtered.length === 0 ? (
                    <p className="text-xs text-gray-400 p-4 text-center">لا توجد خصائص</p>
                ) : (
                    filtered.map(({ cat, props }) => (
                        <div key={cat} className="border-b border-gray-50">
                            <button
                                className="w-full flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 text-xs font-semibold text-gray-600 text-right"
                                onClick={() => setExpanded(e => ({ ...e, [cat]: !e[cat] }))}
                            >
                                {expanded[cat] ? <ChevronDown className="w-3 h-3 shrink-0" /> : <ChevronRight className="w-3 h-3 shrink-0" />}
                                {cat}
                                <span className="mr-auto text-gray-400 font-normal">{props.length}</span>
                            </button>
                            {expanded[cat] && (
                                <div>
                                    {props.map((prop, i) => (
                                        <div key={i} className="flex items-start gap-2 px-3 py-1.5 border-b border-gray-50 hover:bg-blue-50/50 text-xs">
                                            <span className="text-gray-500 flex-1 min-w-0 truncate" title={prop.displayName}>{prop.displayName}</span>
                                            <span className="text-gray-800 font-medium text-left max-w-[45%] break-words">
                                                {String(prop.displayValue ?? '')} {prop.units ? <span className="text-gray-400">{prop.units}</span> : null}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

// Model Tree Panel
function ModelTreePanel({ viewer }) {
    const [tree, setTree] = useState([]);
    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState({});

    useEffect(() => {
        if (!viewer) return;
        setLoading(true);
        viewer.getObjectTree((instanceTree) => {
            const rootId = instanceTree.getRootId();
            const buildTree = (nodeId, depth = 0) => {
                const name = instanceTree.getNodeName(nodeId);
                const children = [];
                instanceTree.enumNodeChildren(nodeId, (childId) => {
                    if (depth < 3) children.push(buildTree(childId, depth + 1));
                }, false);
                return { id: nodeId, name, children };
            };
            const root = buildTree(rootId);
            setTree(root.children.length > 0 ? root.children : [root]);
            setLoading(false);
        }, () => setLoading(false));
    }, [viewer]);

    const isolate = (nodeId) => {
        viewer.isolate([nodeId]);
        viewer.fitToView([nodeId]);
    };

    const TreeNode = ({ node, depth = 0 }) => (
        <div>
            <div
                className="flex items-center gap-1 py-1 px-2 hover:bg-blue-50 cursor-pointer text-xs rounded"
                style={{ paddingRight: `${8 + depth * 14}px` }}
            >
                {node.children.length > 0 ? (
                    <button onClick={() => setExpanded(e => ({ ...e, [node.id]: !e[node.id] }))} className="shrink-0">
                        {expanded[node.id] ? <ChevronDown className="w-3 h-3 text-gray-400" /> : <ChevronRight className="w-3 h-3 text-gray-400" />}
                    </button>
                ) : <span className="w-3 h-3 shrink-0" />}
                <span className="truncate text-gray-700 flex-1" title={node.name} onClick={() => isolate(node.id)}>
                    {node.name || `Node ${node.id}`}
                </span>
            </div>
            {expanded[node.id] && node.children.map(child => (
                <TreeNode key={child.id} node={child} depth={depth + 1} />
            ))}
        </div>
    );

    return (
        <div className="flex-1 overflow-y-auto p-2">
            {loading ? (
                <div className="flex justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                </div>
            ) : tree.length === 0 ? (
                <p className="text-xs text-gray-400 p-4 text-center">لا يوجد هيكل متاح</p>
            ) : (
                tree.map(node => <TreeNode key={node.id} node={node} />)
            )}
        </div>
    );
}

export default function BIMViewer({ modelUrn, modelName, onClose }) {
    const viewerRef = useRef(null);
    const viewerInstance = useRef(null);
    const [status, setStatus] = useState('loading');
    const [error, setError] = useState('');
    const [activePanel, setActivePanel] = useState('properties'); // properties | tree | info
    const [selectedDbId, setSelectedDbId] = useState(null);
    const [selectedName, setSelectedName] = useState('');
    const [modelInfo, setModelInfo] = useState(null);
    const [viewerReady, setViewerReady] = useState(false);

    const fileExt = getExt(modelName || '');
    const fileTypeInfo = FILE_TYPE_LABELS[fileExt];

    useEffect(() => {
        if (!modelUrn) return;

        const loadViewer = async () => {
            try {
                const res = await base44.functions.invoke('bimService', { action: 'get_token' });
                const { access_token } = res.data;

                if (!window.Autodesk) {
                    await new Promise((resolve, reject) => {
                        const link = document.createElement('link');
                        link.rel = 'stylesheet';
                        link.href = 'https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/style.min.css';
                        document.head.appendChild(link);

                        const script = document.createElement('script');
                        script.src = 'https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/viewer3D.min.js';
                        script.onload = resolve;
                        script.onerror = reject;
                        document.head.appendChild(script);
                    });
                }

                const options = {
                    env: 'AutodeskProduction2',
                    api: 'streamingV2',
                    getAccessToken: (callback) => callback(access_token, 3600)
                };

                window.Autodesk.Viewing.Initializer(options, () => {
                    if (!viewerRef.current) return;
                    const viewer = new window.Autodesk.Viewing.GuiViewer3D(viewerRef.current);
                    viewer.start();
                    viewerInstance.current = viewer;

                    // Selection event
                    viewer.addEventListener(window.Autodesk.Viewing.SELECTION_CHANGED_EVENT, (e) => {
                        if (e.dbIdArray && e.dbIdArray.length > 0) {
                            const dbId = e.dbIdArray[0];
                            setSelectedDbId(dbId);
                            setActivePanel('properties');
                            viewer.getProperties(dbId, (r) => setSelectedName(r.name || `Element ${dbId}`));
                        } else {
                            setSelectedDbId(null);
                            setSelectedName('');
                        }
                    });

                    const documentId = modelUrn.startsWith('urn:') ? modelUrn : 'urn:' + btoa(modelUrn).replace(/=/g, '');
                    window.Autodesk.Viewing.Document.load(
                        documentId,
                        (doc) => {
                            const viewables = doc.getRoot().getDefaultGeometry();
                            viewer.loadDocumentNode(doc, viewables).then(() => {
                                setStatus('ready');
                                setViewerReady(true);
                                // Get model metadata info
                                const md = doc.getRoot().data;
                                setModelInfo({
                                    name: md?.name || modelName,
                                    type: md?.type,
                                    viewableCount: doc.getRoot().search({ type: 'geometry' })?.length || 0,
                                });
                            });
                        },
                        (err) => {
                            console.error('Document load error:', err);
                            setError('تعذر تحميل النموذج. تحقق من صحة URN أو أن الملف تم ترجمته بنجاح.');
                            setStatus('error');
                        }
                    );
                });
            } catch (e) {
                console.error('Viewer init error:', e);
                setError(e.message || 'خطأ في تهيئة العارض');
                setStatus('error');
            }
        };

        loadViewer();

        return () => {
            if (viewerInstance.current) {
                viewerInstance.current.finish();
                viewerInstance.current = null;
            }
        };
    }, [modelUrn]);

    const viewerAction = useCallback((fn) => {
        if (viewerInstance.current) fn(viewerInstance.current);
    }, []);

    const panels = [
        { id: 'properties', icon: <List className="w-4 h-4" />, label: 'الخصائص' },
        { id: 'tree', icon: <Layers className="w-4 h-4" />, label: 'الهيكل' },
        { id: 'quantities', icon: <BarChart3 className="w-4 h-4" />, label: 'الكميات' },
        { id: 'info', icon: <Info className="w-4 h-4" />, label: 'معلومات' },
    ];

    return (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col" dir="rtl">
            {/* Header */}
            <div className="flex items-center justify-between bg-gray-900 px-4 py-3 shrink-0 border-b border-gray-700">
                <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-blue-400" />
                    <div>
                        <h2 className="text-white font-bold text-sm leading-tight">{modelName || 'عارض BIM'}</h2>
                        <div className="flex items-center gap-2 mt-0.5">
                            {fileTypeInfo && (
                                <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${fileTypeInfo.color}`}>
                                    {fileTypeInfo.label}
                                </span>
                            )}
                            {status === 'ready' && (
                                <span className="text-xs text-green-400 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block" />
                                    جاهز
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Viewer Controls */}
                <div className="flex items-center gap-1.5">
                    {status === 'ready' && (
                        <>
                            <Button size="sm" variant="ghost" className="text-gray-300 hover:text-white hover:bg-gray-700 h-8 w-8 p-0" title="عرض كامل"
                                onClick={() => viewerAction(v => v.fitToView())}>
                                <Home className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="text-gray-300 hover:text-white hover:bg-gray-700 h-8 w-8 p-0" title="تكبير"
                                onClick={() => viewerAction(v => v.navigation.setZoomTowardsCursor(true))}>
                                <ZoomIn className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="text-gray-300 hover:text-white hover:bg-gray-700 h-8 w-8 p-0" title="إظهار الكل"
                                onClick={() => viewerAction(v => v.showAll())}>
                                <Maximize2 className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="text-gray-300 hover:text-white hover:bg-gray-700 h-8 w-8 p-0" title="إعادة تعيين"
                                onClick={() => viewerAction(v => { v.showAll(); v.fitToView(); })}>
                                <RotateCcw className="w-4 h-4" />
                            </Button>
                            <div className="w-px h-6 bg-gray-600 mx-1" />
                        </>
                    )}
                    <button onClick={onClose} className="text-gray-400 hover:text-white w-8 h-8 flex items-center justify-center rounded hover:bg-gray-700">
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Body */}
            <div className="flex-1 flex overflow-hidden">
                {/* 3D Viewer */}
                <div className="flex-1 relative bg-gray-800">
                    {status === 'loading' && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white gap-4 z-10">
                            <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center">
                                <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
                            </div>
                            <div className="text-center">
                                <p className="font-medium mb-1">جارٍ تحميل النموذج...</p>
                                <p className="text-sm text-gray-400">{fileTypeInfo?.label || 'BIM'} Viewer</p>
                            </div>
                        </div>
                    )}
                    {status === 'error' && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white gap-4 z-10 p-8 text-center">
                            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
                                <AlertCircle className="w-8 h-8 text-red-400" />
                            </div>
                            <div>
                                <p className="font-medium text-red-300 mb-2">تعذر تحميل النموذج</p>
                                <p className="text-sm text-gray-400">{error}</p>
                            </div>
                        </div>
                    )}
                    <div ref={viewerRef} className="w-full h-full" />
                </div>

                {/* Side Panel */}
                {status === 'ready' && (
                    <div className="w-72 bg-white border-r border-gray-200 flex flex-col shrink-0">
                        {/* Panel Tabs */}
                        <div className="flex border-b border-gray-200 bg-gray-50 shrink-0">
                            {panels.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => setActivePanel(p.id)}
                                    className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-xs transition-colors ${
                                        activePanel === p.id
                                            ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                                            : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    {p.icon}
                                    <span>{p.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Selected element badge */}
                        {selectedDbId != null && activePanel === 'properties' && (
                            <div className="px-3 py-2 bg-blue-50 border-b border-blue-100 flex items-center gap-2">
                                <Box className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                <span className="text-xs text-blue-700 font-medium truncate">{selectedName || `Element #${selectedDbId}`}</span>
                            </div>
                        )}

                        {/* Panel Content */}
                        <div className="flex-1 overflow-hidden flex flex-col">
                            {activePanel === 'properties' && (
                                <PropertiesPanel viewer={viewerInstance.current} selectedDbId={selectedDbId} />
                            )}
                            {activePanel === 'tree' && (
                                <ModelTreePanel viewer={viewerInstance.current} />
                            )}
                            {activePanel === 'quantities' && (
                                <QuantitiesPanel
                                    modelUrn={modelUrn}
                                    modelId={null}
                                    modelName={modelName}
                                />
                            )}
                            {activePanel === 'info' && (
                                <div className="p-4 space-y-4 overflow-y-auto">
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">معلومات الملف</p>
                                        <div className="space-y-2">
                                            <InfoRow label="الاسم" value={modelName || '-'} />
                                            <InfoRow label="النوع" value={fileTypeInfo?.label || fileExt.toUpperCase() || '-'} />
                                            <InfoRow label="URN" value={modelUrn ? modelUrn.slice(0, 30) + '...' : '-'} mono />
                                        </div>
                                    </div>
                                    {modelInfo && (
                                        <div>
                                            <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">معلومات النموذج</p>
                                            <div className="space-y-2">
                                                <InfoRow label="عدد العروض" value={modelInfo.viewableCount} />
                                                <InfoRow label="نوع البيانات" value={modelInfo.type || '-'} />
                                            </div>
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">الأنواع المدعومة</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {Object.entries(FILE_TYPE_LABELS).map(([ext, info]) => (
                                                <span key={ext} className={`text-xs px-2 py-0.5 rounded font-medium ${info.color}`}>
                                                    .{ext}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function InfoRow({ label, value, mono }) {
    return (
        <div className="flex items-start justify-between gap-2">
            <span className="text-xs text-gray-500 shrink-0">{label}</span>
            <span className={`text-xs text-gray-800 font-medium text-left break-all ${mono ? 'font-mono' : ''}`}>{String(value ?? '-')}</span>
        </div>
    );
}