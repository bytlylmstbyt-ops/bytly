import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
    Shield, Lock, Unlock, CheckCircle2, Clock, AlertCircle, 
    DollarSign, Loader2, ArrowLeft, Info
} from 'lucide-react';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog';

const ESCROW_STATUSES = {
    none: { label: 'لم يُودَع بعد', color: 'bg-gray-100 text-gray-600', icon: Lock },
    held: { label: 'محجوز في بيتلي', color: 'bg-blue-100 text-blue-700', icon: Shield },
    released: { label: 'تم الإفراج - مكتمل', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
    refunded: { label: 'مسترجع', color: 'bg-red-100 text-red-700', icon: AlertCircle }
};

export default function EscrowPanel({ project, proposalId, isClient, isEngineer, onUpdate }) {
    const [escrowInfo, setEscrowInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [showReleaseDialog, setShowReleaseDialog] = useState(false);
    const [clientBalance, setClientBalance] = useState(0);

    useEffect(() => {
        loadEscrowInfo();
    }, [project?.id]);

    const loadEscrowInfo = async () => {
        setLoading(true);
        try {
            const res = await base44.functions.invoke('escrow', { action: 'status', project_id: project.id });
            setEscrowInfo(res.data);

            if (isClient) {
                const user = await base44.auth.me();
                const clients = await base44.entities.Client.filter({ email: user.email });
                setClientBalance(clients[0]?.wallet_balance || 0);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleDeposit = async () => {
        setActionLoading(true);
        try {
            const res = await base44.functions.invoke('escrow', {
                action: 'deposit',
                project_id: project.id,
                proposal_id: proposalId,
                amount: project.escrow_amount
            });
            if (res.data?.success) {
                await loadEscrowInfo();
                onUpdate?.();
            } else if (res.data?.error === 'insufficient_balance') {
                alert(`رصيدك غير كافٍ. المطلوب: ${res.data.required?.toLocaleString('ar-SA')} ريال، المتاح: ${res.data.available?.toLocaleString('ar-SA')} ريال`);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setActionLoading(false);
        }
    };

    const handleRelease = async () => {
        setActionLoading(true);
        try {
            const res = await base44.functions.invoke('escrow', {
                action: 'release',
                project_id: project.id
            });
            if (res.data?.success) {
                setShowReleaseDialog(false);
                await loadEscrowInfo();
                onUpdate?.();
            }
        } catch (e) {
            console.error(e);
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <Card className="border-0 shadow-lg">
                <CardContent className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                </CardContent>
            </Card>
        );
    }

    const status = escrowInfo?.escrow_status || 'none';
    const statusConfig = ESCROW_STATUSES[status];
    const StatusIcon = statusConfig.icon;
    const amount = escrowInfo?.escrow_amount || project?.escrow_amount || 0;
    const insufficientBalance = isClient && clientBalance < amount;

    return (
        <>
            <Card className="border-0 shadow-lg overflow-hidden">
                <div className={`h-1.5 ${status === 'held' ? 'bg-blue-500' : status === 'released' ? 'bg-green-500' : 'bg-gray-300'}`} />
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Shield className="w-5 h-5 text-blue-600" />
                        نظام الضمان (Escrow)
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Status */}
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-500">حالة الضمان</span>
                        <Badge className={`${statusConfig.color} gap-1`}>
                            <StatusIcon className="w-3 h-3" />
                            {statusConfig.label}
                        </Badge>
                    </div>

                    {/* Amount Breakdown */}
                    <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">المبلغ الإجمالي</span>
                            <span className="font-bold">{amount.toLocaleString('ar-SA')} ر.س</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">عمولة المنصة ({escrowInfo?.commission_rate || 15}%)</span>
                            <span className="text-slate-600">- {escrowInfo?.commission_amount?.toLocaleString('ar-SA') || 0} ر.س</span>
                        </div>
                        <div className="border-t pt-2 flex justify-between">
                            <span className="text-sm font-semibold text-slate-700">صافي المهندس</span>
                            <span className="font-bold text-green-600">{escrowInfo?.engineer_will_receive?.toLocaleString('ar-SA') || 0} ر.س</span>
                        </div>
                    </div>

                    {/* How it works info */}
                    <div className="bg-blue-50 rounded-lg p-3 flex gap-2">
                        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        <p className="text-xs text-blue-700 leading-relaxed">
                            المبلغ محجوز بأمان في بيتلي ولن يُحوَّل للمهندس إلا بعد تأكيد العميل لاستلام المخططات والموافقة النهائية.
                        </p>
                    </div>

                    {/* Timeline */}
                    <div className="space-y-2">
                        <Step done={true} label="قبول العرض من العميل" />
                        <Step done={status !== 'none'} active={status === 'none'} label="إيداع المبلغ في محفظة بيتلي" />
                        <Step done={status === 'released'} active={status === 'held'} label="تنفيذ المشروع وتسليم المخططات" />
                        <Step done={status === 'released'} label="موافقة العميل وتحرير المبلغ للمهندس" />
                    </div>

                    {/* Actions */}
                    {isClient && status === 'none' && amount > 0 && (
                        <div className="space-y-2">
                            {insufficientBalance && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-xs text-red-700">
                                    رصيدك ({clientBalance.toLocaleString('ar-SA')} ر.س) غير كافٍ.{' '}
                                    <Link to={createPageUrl('WalletTopup')} className="underline font-semibold">
                                        اشحن محفظتك
                                    </Link>
                                </div>
                            )}
                            <Button
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2"
                                onClick={handleDeposit}
                                disabled={actionLoading || insufficientBalance}
                            >
                                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                                إيداع {amount.toLocaleString('ar-SA')} ر.س ضماناً
                            </Button>
                        </div>
                    )}

                    {isClient && status === 'held' && (
                        <Button
                            className="w-full bg-green-600 hover:bg-green-700 text-white gap-2"
                            onClick={() => setShowReleaseDialog(true)}
                        >
                            <Unlock className="w-4 h-4" />
                            تأكيد الاستلام وتحرير المبلغ
                        </Button>
                    )}

                    {isEngineer && status === 'held' && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                            <CheckCircle2 className="w-5 h-5 text-green-600 mx-auto mb-1" />
                            <p className="text-sm text-green-700 font-medium">المبلغ محجوز بأمان</p>
                            <p className="text-xs text-green-600">سيُحوَّل إليك عند تأكيد العميل</p>
                        </div>
                    )}

                    {status === 'released' && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                            <CheckCircle2 className="w-5 h-5 text-green-600 mx-auto mb-1" />
                            <p className="text-sm text-green-700 font-medium">تم إتمام المعاملة بنجاح ✓</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Confirm Release Dialog */}
            <Dialog open={showReleaseDialog} onOpenChange={setShowReleaseDialog}>
                <DialogContent className="max-w-sm" dir="rtl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Unlock className="w-5 h-5 text-green-600" />
                            تأكيد استلام المشروع
                        </DialogTitle>
                        <DialogDescription className="text-right">
                            بالضغط على تأكيد، ستوافق على استلام المخططات وتحرير المبلغ للمهندس.
                            <strong className="block mt-2 text-slate-700">
                                سيستلم المهندس: {escrowInfo?.engineer_will_receive?.toLocaleString('ar-SA')} ر.س
                            </strong>
                            هذا الإجراء لا يمكن التراجع عنه.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex gap-3 mt-2">
                        <Button
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                            onClick={handleRelease}
                            disabled={actionLoading}
                        >
                            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'تأكيد الاستلام'}
                        </Button>
                        <Button variant="outline" className="flex-1" onClick={() => setShowReleaseDialog(false)}>
                            إلغاء
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

function Step({ done, active, label }) {
    return (
        <div className="flex items-center gap-2">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                done ? 'bg-green-500' : active ? 'bg-blue-500 animate-pulse' : 'bg-slate-200'
            }`}>
                {done && <CheckCircle2 className="w-3 h-3 text-white" />}
                {active && <Clock className="w-3 h-3 text-white" />}
            </div>
            <span className={`text-xs ${done ? 'text-green-700 font-medium' : active ? 'text-blue-700 font-medium' : 'text-slate-400'}`}>
                {label}
            </span>
        </div>
    );
}