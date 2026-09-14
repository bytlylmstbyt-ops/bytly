import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

export default function AddBIMModelModal({ open, onClose, onSaved }) {
    const [form, setForm] = useState({
        name: '', model_urn: '', project_id: '', investor_id: '',
        description: '', floor_level: '', building_type: ''
    });
    const [loading, setLoading] = useState(false);
    const [indexing, setIndexing] = useState(false);

    const handleSave = async () => {
        if (!form.name || !form.model_urn) return;
        setLoading(true);
        try {
            let indexed_properties = [];
            // Try to fetch and index metadata
            if (form.model_urn) {
                try {
                    setIndexing(true);
                    const metaRes = await base44.functions.invoke('bimService', {
                        action: 'get_metadata',
                        model_urn: form.model_urn
                    });
                    const guids = metaRes.data?.metadata?.data?.metadata || [];
                    if (guids.length > 0) {
                        const propsRes = await base44.functions.invoke('bimService', {
                            action: 'get_properties',
                            model_urn: form.model_urn,
                            guid: guids[0].guid
                        });
                        indexed_properties = propsRes.data?.properties?.slice(0, 200) || [];
                    }
                } catch (e) {
                    console.warn('Indexing skipped:', e.message);
                } finally {
                    setIndexing(false);
                }
            }

            await base44.entities.BIMModel.create({
                ...form,
                indexed_properties,
                last_indexed: new Date().toISOString()
            });

            onSaved();
            onClose();
            setForm({ name: '', model_urn: '', project_id: '', investor_id: '', description: '', floor_level: '', building_type: '' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-lg" dir="rtl">
                <DialogHeader>
                    <DialogTitle>إضافة نموذج BIM</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                    <Input placeholder="اسم النموذج *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                    <Input placeholder="Model URN *" value={form.model_urn} onChange={e => setForm({ ...form, model_urn: e.target.value })} dir="ltr" className="font-mono text-sm" />
                    <Input placeholder="معرف المشروع (اختياري)" value={form.project_id} onChange={e => setForm({ ...form, project_id: e.target.value })} />
                    <Input placeholder="معرف المستثمر (اختياري)" value={form.investor_id} onChange={e => setForm({ ...form, investor_id: e.target.value })} />
                    <Input placeholder="الطابق / المستوى (مثال: الدور الأرضي)" value={form.floor_level} onChange={e => setForm({ ...form, floor_level: e.target.value })} />
                    <Input placeholder="نوع المبنى" value={form.building_type} onChange={e => setForm({ ...form, building_type: e.target.value })} />
                    <Input placeholder="وصف النموذج" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                    {indexing && <p className="text-xs text-blue-600 flex items-center gap-2"><Loader2 className="w-3 h-3 animate-spin" /> جارٍ فهرسة البيانات للبحث الذكي...</p>}
                    <div className="flex gap-2 justify-end pt-2">
                        <Button variant="outline" onClick={onClose}>إلغاء</Button>
                        <Button onClick={handleSave} disabled={loading || !form.name || !form.model_urn}>
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'حفظ وفهرسة'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}