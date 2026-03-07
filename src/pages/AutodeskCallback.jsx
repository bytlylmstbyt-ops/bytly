import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';

export default function AutodeskCallback() {
    const [status, setStatus] = useState('loading'); // loading | success | error
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const error = params.get('error');

        if (error) {
            setStatus('error');
            setErrorMsg(error === 'access_denied' ? 'تم رفض الإذن من Autodesk' : error);
            return;
        }

        if (!code) {
            setStatus('error');
            setErrorMsg('لم يتم استلام رمز التفويض');
            return;
        }

        // Exchange the code for tokens
        const redirect_uri = `${window.location.origin}${window.location.pathname}`;
        base44.functions.invoke('autodeskOAuth', { action: 'exchange_code', code, redirect_uri })
            .then(res => {
                if (res.data?.success) {
                    setStatus('success');
                    // Close popup if opened in popup, or redirect
                    if (window.opener) {
                        window.opener.postMessage({ type: 'autodesk_oauth_success' }, '*');
                        window.close();
                    } else {
                        setTimeout(() => {
                            window.location.href = createPageUrl('BIMSearch');
                        }, 1500);
                    }
                } else {
                    setStatus('error');
                    setErrorMsg(res.data?.error || 'فشل التبادل');
                }
            })
            .catch(e => {
                setStatus('error');
                setErrorMsg(e.message);
            });
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50" dir="rtl">
            <div className="bg-white rounded-2xl shadow-lg p-10 max-w-sm w-full text-center">
                {status === 'loading' && (
                    <>
                        <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                        <h2 className="text-lg font-semibold text-gray-800">جارٍ الاتصال بـ Autodesk...</h2>
                        <p className="text-sm text-gray-500 mt-2">يرجى الانتظار</p>
                    </>
                )}
                {status === 'success' && (
                    <>
                        <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
                        <h2 className="text-lg font-semibold text-gray-800">تم الربط بنجاح!</h2>
                        <p className="text-sm text-gray-500 mt-2">تم ربط حسابك بـ Autodesk Construction Cloud</p>
                    </>
                )}
                {status === 'error' && (
                    <>
                        <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <h2 className="text-lg font-semibold text-gray-800">فشل الربط</h2>
                        <p className="text-sm text-red-500 mt-2">{errorMsg}</p>
                        <Button className="mt-4" onClick={() => window.location.href = createPageUrl('BIMSearch')}>
                            العودة
                        </Button>
                    </>
                )}
            </div>
        </div>
    );
}