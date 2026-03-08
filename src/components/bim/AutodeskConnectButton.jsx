import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Link2, Link2Off, Loader2, ExternalLink } from 'lucide-react';

export default function AutodeskConnectButton({ onStatusChange }) {
    const [status, setStatus] = useState(null); // null | { connected, is_expired, has_refresh }
    const [loading, setLoading] = useState(true);
    const [disconnecting, setDisconnecting] = useState(false);

    useEffect(() => {
        checkStatus();

        // Listen for OAuth popup success
        const handler = (e) => {
            if (e.data?.type === 'autodesk_oauth_success') {
                checkStatus();
                onStatusChange?.('connected');
            }
        };
        window.addEventListener('message', handler);
        return () => window.removeEventListener('message', handler);
    }, []);

    const checkStatus = async () => {
        setLoading(true);
        try {
            const res = await base44.functions.invoke('autodeskOAuth', { action: 'status' });
            setStatus(res.data);
            onStatusChange?.(res.data?.connected ? 'connected' : 'disconnected');
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const connect = async () => {
        try {
            // Build redirect URI - must match exactly what's registered in Autodesk App settings
            const redirectUri = window.location.origin + '/AutodeskCallback';
            const res = await base44.functions.invoke('autodeskOAuth', {
                action: 'get_auth_url',
                redirect_uri: redirectUri
            });
            const authUrl = res.data?.auth_url;
            if (!authUrl) {
                console.error('No auth URL received');
                return;
            }
            console.log('Autodesk OAuth redirect_uri:', redirectUri);

            // Open popup
            const popup = window.open(authUrl, 'autodesk_oauth', 'width=600,height=700,left=200,top=100');
            if (!popup) {
                // Popup blocked - redirect in same tab
                window.location.href = authUrl;
            }
        } catch (e) {
            console.error('Autodesk connect error:', e);
        }
    };

    const disconnect = async () => {
        setDisconnecting(true);
        try {
            await base44.functions.invoke('autodeskOAuth', { action: 'disconnect' });
            setStatus({ connected: false });
            onStatusChange?.('disconnected');
        } catch (e) {
            console.error(e);
        } finally {
            setDisconnecting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>جارٍ التحقق...</span>
            </div>
        );
    }

    if (status?.connected) {
        return (
            <div className="flex items-center gap-2">
                <Badge className="bg-green-100 text-green-700 border-green-200 gap-1.5">
                    <CheckCircle2 className="w-3 h-3" />
                    مرتبط بـ Autodesk
                </Badge>
                <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 h-7 px-2 text-xs"
                    onClick={disconnect}
                    disabled={disconnecting}
                >
                    {disconnecting ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Link2Off className="w-3 h-3 ml-1" />فصل</>}
                </Button>
            </div>
        );
    }

    return (
        <Button
            size="sm"
            onClick={connect}
            className="gap-2 bg-orange-500 hover:bg-orange-600 text-white"
        >
            <Link2 className="w-4 h-4" />
            ربط حساب Autodesk
            <ExternalLink className="w-3 h-3 opacity-70" />
        </Button>
    );
}