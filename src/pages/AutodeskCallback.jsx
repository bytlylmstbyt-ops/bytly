import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, CheckCircle2, XCircle, RefreshCw, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';

export default function AutodeskCallback() {
    const [status, setStatus] = useState('loading'); // loading | success | error
    const [errorMsg, setErrorMsg] = useState('');
    const [errorDetail, setErrorDetail] = useState('');

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const error = params.get('error');
        const errorDescription = params.get('error_description');

        console.log('AutodeskCallback params:', { code: code ? 'present' : 'missing', error, errorDescription });

        if (error) {
            setStatus('error');
            setErrorDetail(`error=${error}${errorDescription ? ` | ${errorDescription}` : ''}`);
            if (error === 'access_denied') {
                setErrorMsg('تم رفض الإذن من Autodesk. يرجى الموافقة على الصلاحيات المطلوبة.');
            } else {
                setErrorMsg(`خطأ من Autodesk: ${errorDescription || error}`);
            }
            return;
        }

        if (!code) {
            setStatus('error');
            setErrorMsg('لم يتم استلام رمز التفويض من Autodesk.');
            setErrorDetail(`URL params received: ${params.toString() || 'none'}`);
            return;
        }

        // redirect_uri must match EXACTLY what was sent in get_auth_url and what's registered in Autodesk app settings
        const redirect_uri = window.location.origin + '/AutodeskCallback';
        console.log('Exchanging code with redirect_uri:', redirect_uri);

        base44.functions.invoke('autodeskOAuth', { action: 'exchange_code', code, redirect_uri })
            .then(res => {
                if (res.data?.success) {
                    setStatus('success');
                    if (window.opener) {
                        window.opener.postMessage({ type: 'autodesk_oauth_success' }, '*');
                        setTimeout(() => window.close(), 1000);
                    } else {
                        setTimeout(() => {
                            window.location.href = createPageUrl('BIMSearch');
                        }, 1500);
                    }
                } else {
                    setStatus('error');
                    setErrorMsg('فشل تبادل رمز التفويض مع Autodesk.');
                    setErrorDetail(res.data?.details || res.data?.error || 'Token exchange failed');
                }
            })
            .catch(e => {
                setStatus('error');
                setErrorMsg('حدث خطأ أثناء الاتصال بالخادم.');
                setErrorDetail(e.message);
            });
    }, []);

    const retryConnect = () => {
        // Re-trigger the auth flow from scratch
        const redirectUri = window.location.origin + '/AutodeskCallback';
        base44.functions.invoke('autodeskOAuth', { action: 'get_auth_url', redirect_uri: redirectUri })
            .then(res => {
                if (res.data?.auth_url) {
                    window.location.href = res.data.auth_url;
                }
            })
            .catch(console.error);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50" dir="rtl">
            <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full text-center">
                {status === 'loading' && (
                    <>
                        <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                        <h2 className="text-lg font-semibold text-gray-800">جارٍ الاتصال بـ Autodesk...</h2>
                        <p className="text-sm text-gray-500 mt-2">يرجى الانتظار، يتم التحقق من التفويض</p>
                    </>
                )}
                {status === 'success' && (
                    <>
                        <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
                        <h2 className="text-lg font-semibold text-gray-800">تم الربط بنجاح!</h2>
                        <p className="text-sm text-gray-500 mt-2">تم ربط حسابك بـ Autodesk Construction Cloud</p>
                        <p className="text-xs text-gray-400 mt-1">جارٍ إعادة التوجيه...</p>
                    </>
                )}
                {status === 'error' && (
                    <>
                        <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <h2 className="text-lg font-semibold text-gray-800">فشل الربط</h2>
                        <p className="text-sm text-red-600 mt-2">{errorMsg}</p>

                        {errorDetail && (
                            <div className="mt-3 bg-gray-50 border border-gray-200 rounded-lg p-3 text-right">
                                <div className="flex items-center gap-2 mb-1">
                                    <AlertTriangle className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                                    <span className="text-xs font-semibold text-gray-600">تفاصيل الخطأ:</span>
                                </div>
                                <p className="text-xs text-gray-500 font-mono break-all">{errorDetail}</p>
                            </div>
                        )}

                        <div className="mt-4 bg-blue-50 border border-blue-100 rounded-lg p-3 text-right text-xs text-blue-700 space-y-1">
                            <p className="font-semibold">للمطورين: تأكد من:</p>
                            <p>• إضافة <code className="bg-blue-100 px-1 rounded">{window.location.origin}/AutodeskCallback</code> في إعدادات التطبيق على <a href="https://aps.autodesk.com/myapps" target="_blank" rel="noopener noreferrer" className="underline">APS Portal</a></p>
                            <p>• أن الـ Callback URL مطابق تماماً (بدون slash في النهاية)</p>
                        </div>

                        <div className="flex gap-2 mt-4">
                            <Button className="flex-1 gap-2" onClick={retryConnect}>
                                <RefreshCw className="w-4 h-4" /> إعادة المحاولة
                            </Button>
                            <Button variant="outline" className="flex-1" onClick={() => window.location.href = createPageUrl('BIMSearch')}>
                                العودة
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}