import { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, AlertCircle } from 'lucide-react';

export default function BIMViewer({ modelUrn, onClose }) {
    const viewerRef = useRef(null);
    const viewerInstance = useRef(null);
    const [status, setStatus] = useState('loading'); // loading | ready | error
    const [error, setError] = useState('');

    useEffect(() => {
        if (!modelUrn) return;

        // Load Autodesk Viewer script dynamically
        const loadViewer = async () => {
            try {
                // Get token from backend
                const res = await base44.functions.invoke('bimService', { action: 'get_token' });
                const { access_token } = res.data;

                // Check if Autodesk script already loaded
                if (!window.Autodesk) {
                    await new Promise((resolve, reject) => {
                        const script = document.createElement('script');
                        script.src = 'https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/viewer3D.min.js';
                        script.onload = resolve;
                        script.onerror = reject;
                        document.head.appendChild(script);

                        const link = document.createElement('link');
                        link.rel = 'stylesheet';
                        link.href = 'https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/style.min.css';
                        document.head.appendChild(link);
                    });
                }

                const options = {
                    env: 'AutodeskProduction2',
                    api: 'streamingV2',
                    getAccessToken: (callback) => {
                        callback(access_token, 3600);
                    }
                };

                window.Autodesk.Viewing.Initializer(options, () => {
                    if (!viewerRef.current) return;
                    const viewer = new window.Autodesk.Viewing.GuiViewer3D(viewerRef.current);
                    viewer.start();
                    viewerInstance.current = viewer;

                    const documentId = 'urn:' + btoa(modelUrn).replace(/=/g, '');
                    window.Autodesk.Viewing.Document.load(
                        documentId,
                        (doc) => {
                            const viewables = doc.getRoot().getDefaultGeometry();
                            viewer.loadDocumentNode(doc, viewables);
                            setStatus('ready');
                        },
                        (err) => {
                            console.error('Document load error:', err);
                            setError('تعذر تحميل النموذج. تحقق من صحة URN.');
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

    return (
        <div className="fixed inset-0 z-50 bg-black/80 flex flex-col" dir="rtl">
            <div className="flex items-center justify-between bg-gray-900 px-4 py-3">
                <h2 className="text-white font-bold text-lg">عارض BIM ثلاثي الأبعاد</h2>
                <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl leading-none">✕</button>
            </div>

            <div className="flex-1 relative">
                {status === 'loading' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white gap-3">
                        <Loader2 className="w-10 h-10 animate-spin text-blue-400" />
                        <p>جارٍ تحميل النموذج ثلاثي الأبعاد...</p>
                    </div>
                )}
                {status === 'error' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white gap-3">
                        <AlertCircle className="w-10 h-10 text-red-400" />
                        <p className="text-red-300">{error}</p>
                    </div>
                )}
                <div ref={viewerRef} className="w-full h-full" style={{ minHeight: '500px' }} />
            </div>
        </div>
    );
}