import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import {
    Camera, Upload, X, ZoomIn, ChevronLeft, ChevronRight,
    Loader2, ImageOff, Tag, Calendar, User, MapPin, Plus
} from 'lucide-react';

const STAGE_LABELS = {
    design: 'التصميم',
    permits: 'التصاريح',
    foundation: 'الأساسات',
    structure: 'الهيكل',
    finishing: 'التشطيبات',
    handover: 'التسليم'
};

const STAGE_COLORS = {
    design: 'bg-purple-100 text-purple-700',
    permits: 'bg-yellow-100 text-yellow-700',
    foundation: 'bg-orange-100 text-orange-700',
    structure: 'bg-blue-100 text-blue-700',
    finishing: 'bg-green-100 text-green-700',
    handover: 'bg-teal-100 text-teal-700'
};

function LightboxModal({ photos, initialIndex, onClose }) {
    const [current, setCurrent] = useState(initialIndex);
    const photo = photos[current];

    useEffect(() => {
        const handler = (e) => {
            if (e.key === 'ArrowRight') setCurrent(i => (i + 1) % photos.length);
            if (e.key === 'ArrowLeft') setCurrent(i => (i - 1 + photos.length) % photos.length);
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [photos.length, onClose]);

    return (
        <div className="fixed inset-0 z-[200] bg-black/95 flex flex-col items-center justify-center" onClick={onClose}>
            <button onClick={onClose} className="absolute top-4 left-4 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10">
                <X className="w-6 h-6" />
            </button>
            <span className="absolute top-4 right-4 text-white/50 text-sm">{current + 1} / {photos.length}</span>

            <div className="relative flex items-center gap-4 max-w-5xl w-full px-4" onClick={e => e.stopPropagation()}>
                {photos.length > 1 && (
                    <button onClick={() => setCurrent(i => (i - 1 + photos.length) % photos.length)}
                        className="text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 shrink-0">
                        <ChevronRight className="w-8 h-8" />
                    </button>
                )}
                <div className="flex-1 flex flex-col items-center gap-3">
                    <img src={photo.photo_url} alt={photo.caption || ''} className="max-h-[70vh] max-w-full object-contain rounded-lg shadow-2xl" />
                    <div className="text-center">
                        {photo.caption && <p className="text-white font-medium">{photo.caption}</p>}
                        <div className="flex items-center justify-center gap-4 mt-1 text-white/50 text-xs">
                            {photo.taken_by && <span className="flex items-center gap-1"><User className="w-3 h-3" />{photo.taken_by}</span>}
                            {photo.taken_at && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(photo.taken_at).toLocaleDateString('ar-SA')}</span>}
                            {photo.stage && <span className={`px-2 py-0.5 rounded text-xs ${STAGE_COLORS[photo.stage]}`}>{STAGE_LABELS[photo.stage]}</span>}
                        </div>
                    </div>
                </div>
                {photos.length > 1 && (
                    <button onClick={() => setCurrent(i => (i + 1) % photos.length)}
                        className="text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 shrink-0">
                        <ChevronLeft className="w-8 h-8" />
                    </button>
                )}
            </div>
        </div>
    );
}

function UploadForm({ bimModelId, elementDbId, elementName, onUploaded, onCancel }) {
    const [caption, setCaption] = useState('');
    const [stage, setStage] = useState('structure');
    const [locationNote, setLocationNote] = useState('');
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState(null);
    const [file, setFile] = useState(null);
    const fileRef = useRef();
    const cameraRef = useRef();

    const handleFile = (f) => {
        if (!f) return;
        setFile(f);
        const reader = new FileReader();
        reader.onload = e => setPreview(e.target.result);
        reader.readAsDataURL(f);
    };

    const handleSubmit = async () => {
        if (!file) return;
        setUploading(true);
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        const user = await base44.auth.me();
        await base44.entities.SitePhoto.create({
            bim_model_id: bimModelId,
            element_db_id: elementDbId || null,
            element_name: elementName || null,
            photo_url: file_url,
            caption,
            stage,
            location_note: locationNote,
            taken_by: user?.full_name || '',
            taken_by_email: user?.email || '',
            taken_at: new Date().toISOString()
        });
        setUploading(false);
        onUploaded();
    };

    return (
        <div className="p-3 space-y-3">
            {/* Photo Input */}
            {!preview ? (
                <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => cameraRef.current?.click()}
                        className="flex flex-col items-center gap-2 p-4 border-2 border-dashed border-blue-300 rounded-lg hover:bg-blue-50 text-blue-600 text-xs">
                        <Camera className="w-6 h-6" />
                        <span>التقاط صورة</span>
                        <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden"
                            onChange={e => handleFile(e.target.files?.[0])} />
                    </button>
                    <button onClick={() => fileRef.current?.click()}
                        className="flex flex-col items-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:bg-gray-50 text-gray-500 text-xs">
                        <Upload className="w-6 h-6" />
                        <span>رفع من الجهاز</span>
                        <input ref={fileRef} type="file" accept="image/*" className="hidden"
                            onChange={e => handleFile(e.target.files?.[0])} />
                    </button>
                </div>
            ) : (
                <div className="relative">
                    <img src={preview} alt="preview" className="w-full h-36 object-cover rounded-lg" />
                    <button onClick={() => { setPreview(null); setFile(null); }}
                        className="absolute top-1 left-1 bg-black/60 text-white rounded-full p-1 hover:bg-black/80">
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}

            {/* Element badge */}
            {elementName && (
                <div className="bg-blue-50 border border-blue-100 rounded px-2 py-1 text-xs text-blue-700 flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    <span className="truncate">مرتبط بـ: {elementName}</span>
                </div>
            )}

            {/* Fields */}
            <input value={caption} onChange={e => setCaption(e.target.value)}
                placeholder="وصف الصورة..." className="w-full text-xs border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400" />

            <select value={stage} onChange={e => setStage(e.target.value)}
                className="w-full text-xs border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white">
                {Object.entries(STAGE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>

            <input value={locationNote} onChange={e => setLocationNote(e.target.value)}
                placeholder="ملاحظة الموقع (اختياري)..." className="w-full text-xs border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400" />

            <div className="flex gap-2">
                <Button onClick={handleSubmit} disabled={!file || uploading} size="sm" className="flex-1 text-xs h-8 bg-blue-600 hover:bg-blue-700">
                    {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'حفظ الصورة'}
                </Button>
                <Button onClick={onCancel} variant="ghost" size="sm" className="text-xs h-8 px-3">إلغاء</Button>
            </div>
        </div>
    );
}

export default function SitePhotoGallery({ bimModelId, selectedDbId, selectedName }) {
    const [photos, setPhotos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showUpload, setShowUpload] = useState(false);
    const [lightbox, setLightbox] = useState(null); // index
    const [filterElement, setFilterElement] = useState(false);

    const fetchPhotos = async () => {
        setLoading(true);
        const all = await base44.entities.SitePhoto.filter({ bim_model_id: bimModelId }, '-taken_at', 100);
        setPhotos(all);
        setLoading(false);
    };

    useEffect(() => {
        if (bimModelId) fetchPhotos();
    }, [bimModelId]);

    const displayed = filterElement && selectedDbId != null
        ? photos.filter(p => p.element_db_id === selectedDbId)
        : photos;

    const handleDelete = async (id) => {
        await base44.entities.SitePhoto.delete(id);
        setPhotos(p => p.filter(x => x.id !== id));
    };

    return (
        <div className="flex flex-col h-full">
            {/* Toolbar */}
            <div className="p-2 border-b border-gray-100 flex items-center gap-2 shrink-0">
                <Button onClick={() => setShowUpload(true)} size="sm"
                    className="text-xs h-7 bg-blue-600 hover:bg-blue-700 gap-1 flex-1">
                    <Camera className="w-3.5 h-3.5" />
                    إضافة صورة
                </Button>
                {selectedDbId != null && (
                    <button onClick={() => setFilterElement(f => !f)}
                        className={`text-xs px-2 py-1 rounded border transition-colors ${filterElement ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                        هذا العنصر فقط
                    </button>
                )}
            </div>

            {/* Upload form */}
            {showUpload && (
                <div className="border-b border-gray-100 shrink-0">
                    <UploadForm
                        bimModelId={bimModelId}
                        elementDbId={selectedDbId}
                        elementName={selectedName}
                        onUploaded={() => { setShowUpload(false); fetchPhotos(); }}
                        onCancel={() => setShowUpload(false)}
                    />
                </div>
            )}

            {/* Gallery */}
            <div className="flex-1 overflow-y-auto p-2">
                {loading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                    </div>
                ) : displayed.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400 py-8">
                        <ImageOff className="w-10 h-10 opacity-40" />
                        <p className="text-xs text-center">
                            {filterElement ? 'لا توجد صور لهذا العنصر' : 'لا توجد صور للموقع بعد'}
                        </p>
                        <button onClick={() => setShowUpload(true)}
                            className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1">
                            <Plus className="w-3 h-3" /> أضف أول صورة
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-1.5">
                        {displayed.map((photo, i) => (
                            <div key={photo.id} className="relative group rounded-lg overflow-hidden border border-gray-100 bg-gray-50">
                                <img
                                    src={photo.photo_url}
                                    alt={photo.caption || ''}
                                    className="w-full h-24 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                    onClick={() => setLightbox(displayed.findIndex(p => p.id === photo.id))}
                                />
                                {/* Stage badge */}
                                {photo.stage && (
                                    <span className={`absolute top-1 right-1 text-[9px] px-1.5 py-0.5 rounded font-medium ${STAGE_COLORS[photo.stage]}`}>
                                        {STAGE_LABELS[photo.stage]}
                                    </span>
                                )}
                                {/* Element tag */}
                                {photo.element_name && (
                                    <span className="absolute top-1 left-1 text-[9px] bg-blue-600 text-white px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                        <Tag className="w-2 h-2" />
                                    </span>
                                )}
                                {/* Hover overlay */}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 gap-2">
                                    <button onClick={() => setLightbox(displayed.findIndex(p => p.id === photo.id))}
                                        className="bg-white/90 rounded-full p-1.5 hover:bg-white">
                                        <ZoomIn className="w-3.5 h-3.5 text-gray-700" />
                                    </button>
                                    <button onClick={() => handleDelete(photo.id)}
                                        className="bg-white/90 rounded-full p-1.5 hover:bg-white">
                                        <X className="w-3.5 h-3.5 text-red-500" />
                                    </button>
                                </div>
                                {/* Caption */}
                                {photo.caption && (
                                    <div className="px-1.5 py-1 text-[10px] text-gray-600 truncate">{photo.caption}</div>
                                )}
                                {/* Meta */}
                                <div className="px-1.5 pb-1 flex items-center gap-1 text-[9px] text-gray-400">
                                    {photo.taken_by && <span className="flex items-center gap-0.5"><User className="w-2 h-2" />{photo.taken_by.split(' ')[0]}</span>}
                                    {photo.taken_at && <span className="flex items-center gap-0.5 mr-auto"><Calendar className="w-2 h-2" />{new Date(photo.taken_at).toLocaleDateString('ar-SA')}</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Total count */}
            <div className="px-3 py-1.5 border-t border-gray-100 text-[10px] text-gray-400 text-center shrink-0">
                {displayed.length} صورة {filterElement && selectedDbId ? 'للعنصر المحدد' : 'للموقع'}
                {filterElement && selectedDbId && photos.length > displayed.length && ` • ${photos.length} إجمالاً`}
            </div>

            {/* Lightbox */}
            {lightbox !== null && displayed.length > 0 && (
                <LightboxModal photos={displayed} initialIndex={lightbox} onClose={() => setLightbox(null)} />
            )}
        </div>
    );
}