import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import {
    Construction, CheckCircle2, Clock, AlertCircle,
    Loader2, Plus, Save, RefreshCw, HardHat, Pencil, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const STAGES = [
    { id: 'design', label: 'التصميم', color: 'bg-blue-100 text-blue-700' },
    { id: 'permits', label: 'التصاريح', color: 'bg-yellow-100 text-yellow-700' },
    { id: 'foundation', label: 'الأساسات', color: 'bg-orange-100 text-orange-700' },
    { id: 'structure', label: 'الهيكل الإنشائي', color: 'bg-purple-100 text-purple-700' },
    { id: 'finishing', label: 'التشطيبات', color: 'bg-pink-100 text-pink-700' },
    { id: 'handover', label: 'التسليم', color: 'bg-green-100 text-green-700' },
];

const STAGE_PROGRESS = {
    design: 10, permits: 25, foundation: 40, structure: 60, finishing: 80, handover: 100
};

function StageIcon({ stage }) {
    const colors = {
        design: 'text-blue-500',
        permits: 'text-yellow-500',
        foundation: 'text-orange-500',
        structure: 'text-purple-500',
        finishing: 'text-pink-500',
        handover: 'text-green-500',
    };
    return <HardHat className={`w-4 h-4 ${colors[stage] || 'text-gray-400'}`} />;
}

function ProgressBar({ value, color = 'bg-blue-500' }) {
    return (
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
                className={`h-full rounded-full transition-all duration-500 ${color}`}
                style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
            />
        </div>
    );
}

function getProgressColor(pct) {
    if (pct >= 80) return 'bg-green-500';
    if (pct >= 50) return 'bg-blue-500';
    if (pct >= 25) return 'bg-yellow-500';
    return 'bg-orange-500';
}

export default function BuildingProgressPanel({ selectedDbId, selectedName, modelUrn }) {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [progress, setProgress] = useState(null); // BuildingProgress record
    const [allProgress, setAllProgress] = useState([]);
    const [editMode, setEditMode] = useState(false);
    const [formStage, setFormStage] = useState('design');
    const [formNote, setFormNote] = useState('');

    // Load all BuildingProgress records for this model (by model_urn mapped to project_id)
    useEffect(() => {
        loadAllProgress();
    }, [modelUrn]);

    // When element selected, find matching progress record
    useEffect(() => {
        if (selectedDbId == null) {
            setProgress(null);
            setEditMode(false);
            return;
        }
        const match = allProgress.find(p =>
            p.project_id === String(selectedDbId) ||
            p.project_title?.includes(String(selectedDbId))
        );
        setProgress(match || null);
        if (match) {
            setFormStage(match.current_stage || 'design');
            setFormNote('');
        }
        setEditMode(false);
    }, [selectedDbId, allProgress]);

    const loadAllProgress = async () => {
        setLoading(true);
        try {
            const data = await base44.entities.BuildingProgress.list('-updated_date', 100);
            setAllProgress(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!selectedDbId) return;
        setSaving(true);
        try {
            const overallProgress = STAGE_PROGRESS[formStage] || 0;
            if (progress?.id) {
                // Update existing
                await base44.entities.BuildingProgress.update(progress.id, {
                    current_stage: formStage,
                    overall_progress: overallProgress,
                    last_update_note: formNote || progress.last_update_note,
                    last_updated_by: 'engineer',
                });
            } else {
                // Create new
                await base44.entities.BuildingProgress.create({
                    project_id: String(selectedDbId),
                    project_title: selectedName || `Element #${selectedDbId}`,
                    client_email: '',
                    engineer_email: '',
                    current_stage: formStage,
                    overall_progress: overallProgress,
                    last_update_note: formNote,
                    last_updated_by: 'engineer',
                });
            }
            await loadAllProgress();
            setEditMode(false);
            setFormNote('');
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(false);
        }
    };

    // No element selected
    if (selectedDbId == null) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3 p-6 text-center">
                <Construction className="w-10 h-10 opacity-40" />
                <p className="text-sm">انقر على عنصر في النموذج لعرض تقدم بنائه</p>
                <div className="mt-2 w-full">
                    <p className="text-xs text-gray-400 mb-2">العناصر المُتابَعة ({allProgress.length})</p>
                    {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                    ) : allProgress.slice(0, 5).map(p => {
                        const stage = STAGES.find(s => s.id === p.current_stage);
                        return (
                            <div key={p.id} className="flex items-center gap-2 py-1.5 border-b border-gray-50">
                                <StageIcon stage={p.current_stage} />
                                <span className="text-xs text-gray-700 flex-1 truncate">{p.project_title || p.project_id}</span>
                                <span className="text-xs font-medium text-gray-500">{p.overall_progress || 0}%</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    const currentStageInfo = STAGES.find(s => s.id === (progress?.current_stage || formStage));
    const overallPct = progress?.overall_progress ?? 0;

    return (
        <div className="flex flex-col h-full overflow-y-auto">
            {/* Element header */}
            <div className="px-3 py-2.5 bg-gray-50 border-b border-gray-100">
                <div className="flex items-center gap-2">
                    <Construction className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                    <span className="text-xs font-medium text-gray-700 truncate flex-1">{selectedName || `Element #${selectedDbId}`}</span>
                    <button onClick={loadAllProgress} className="text-gray-400 hover:text-gray-600">
                        <RefreshCw className="w-3 h-3" />
                    </button>
                </div>
            </div>

            <div className="p-3 space-y-3">
                {loading ? (
                    <div className="flex justify-center py-6">
                        <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
                    </div>
                ) : progress ? (
                    /* Existing record */
                    <>
                        {/* Progress overview */}
                        <div className="bg-white rounded-lg border border-gray-100 p-3 space-y-2.5">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-gray-700">نسبة الإنجاز</span>
                                <span className="text-lg font-bold text-gray-900">{overallPct}%</span>
                            </div>
                            <ProgressBar value={overallPct} color={getProgressColor(overallPct)} />

                            <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">المرحلة الحالية</span>
                                {currentStageInfo && (
                                    <Badge className={`text-xs ${currentStageInfo.color}`}>
                                        {currentStageInfo.label}
                                    </Badge>
                                )}
                            </div>

                            {progress.last_update_note && (
                                <p className="text-xs text-gray-500 bg-gray-50 rounded p-2">
                                    {progress.last_update_note}
                                </p>
                            )}
                        </div>

                        {/* Stages timeline */}
                        <div className="space-y-1.5">
                            <p className="text-xs font-semibold text-gray-600">مراحل البناء</p>
                            {STAGES.map((stage, idx) => {
                                const stageProgress = STAGE_PROGRESS[stage.id];
                                const isCurrent = stage.id === progress.current_stage;
                                const isDone = stageProgress < overallPct || (isCurrent && overallPct >= stageProgress);
                                const isPending = stageProgress > overallPct && !isCurrent;

                                return (
                                    <div key={stage.id} className={`flex items-center gap-2 p-2 rounded-lg text-xs ${
                                        isCurrent ? 'bg-purple-50 border border-purple-100' : 'bg-white'
                                    }`}>
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                                            isDone && !isCurrent ? 'bg-green-100' :
                                            isCurrent ? 'bg-purple-500' :
                                            'bg-gray-100'
                                        }`}>
                                            {isDone && !isCurrent ? (
                                                <CheckCircle2 className="w-3 h-3 text-green-600" />
                                            ) : isCurrent ? (
                                                <Clock className="w-3 h-3 text-white" />
                                            ) : (
                                                <span className="text-gray-400 text-xs font-medium">{idx + 1}</span>
                                            )}
                                        </div>
                                        <span className={`flex-1 ${isCurrent ? 'font-semibold text-purple-700' : isDone ? 'text-green-700' : 'text-gray-400'}`}>
                                            {stage.label}
                                        </span>
                                        <span className="text-gray-400">{stageProgress}%</span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Edit button */}
                        {!editMode ? (
                            <Button
                                size="sm"
                                variant="outline"
                                className="w-full h-8 text-xs gap-1.5"
                                onClick={() => { setEditMode(true); setFormStage(progress.current_stage); }}
                            >
                                <Pencil className="w-3 h-3" /> تحديث الحالة
                            </Button>
                        ) : (
                            <div className="bg-purple-50 rounded-lg border border-purple-100 p-3 space-y-2.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-purple-700">تحديث المرحلة</span>
                                    <button onClick={() => setEditMode(false)}>
                                        <X className="w-3.5 h-3.5 text-gray-400" />
                                    </button>
                                </div>
                                <Select value={formStage} onValueChange={setFormStage}>
                                    <SelectTrigger className="h-8 text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {STAGES.map(s => (
                                            <SelectItem key={s.id} value={s.id} className="text-xs">{s.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <textarea
                                    value={formNote}
                                    onChange={e => setFormNote(e.target.value)}
                                    placeholder="ملاحظة التحديث (اختياري)"
                                    className="w-full text-xs border border-gray-200 rounded-lg p-2 resize-none h-16 focus:outline-none focus:ring-1 focus:ring-purple-400"
                                />
                                <Button
                                    size="sm"
                                    className="w-full h-8 text-xs bg-purple-600 hover:bg-purple-700 gap-1.5"
                                    onClick={handleSave}
                                    disabled={saving}
                                >
                                    {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                    حفظ التحديث
                                </Button>
                            </div>
                        )}
                    </>
                ) : (
                    /* No record yet — create */
                    <div className="space-y-3">
                        <div className="text-center py-4">
                            <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                            <p className="text-xs text-gray-500">لا يوجد سجل تقدم لهذا العنصر</p>
                        </div>

                        <div className="bg-blue-50 rounded-lg border border-blue-100 p-3 space-y-2.5">
                            <p className="text-xs font-semibold text-blue-700">إنشاء سجل تقدم</p>
                            <Select value={formStage} onValueChange={setFormStage}>
                                <SelectTrigger className="h-8 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {STAGES.map(s => (
                                        <SelectItem key={s.id} value={s.id} className="text-xs">{s.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <textarea
                                value={formNote}
                                onChange={e => setFormNote(e.target.value)}
                                placeholder="ملاحظة أولية..."
                                className="w-full text-xs border border-gray-200 rounded-lg p-2 resize-none h-16 focus:outline-none focus:ring-1 focus:ring-blue-400"
                            />
                            <Button
                                size="sm"
                                className="w-full h-8 text-xs gap-1.5"
                                onClick={handleSave}
                                disabled={saving}
                            >
                                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                                إنشاء سجل التقدم
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}