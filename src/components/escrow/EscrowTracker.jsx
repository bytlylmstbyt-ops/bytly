/**
 * EscrowTracker — واجهة تتبع حالة الضمان المالي بالكامل
 * تعرض: المراحل + حالة كل دفعة + سجل المعاملات + إجراءات الإيداع/التحرير
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Shield, Lock, Unlock, CheckCircle2, Clock, AlertCircle,
  DollarSign, Loader2, Info, ArrowDownCircle, ArrowUpCircle,
  ChevronDown, ChevronUp, RefreshCw, Wallet, FileText,
  TrendingUp, CircleDollarSign, CalendarClock, CheckCheck
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog';

// ── Status configs ────────────────────────────────────────────────────────────
const ESCROW_STATUS = {
  none:     { label: 'لم يُودَع', color: 'bg-slate-100 text-slate-600', bar: 'bg-slate-300', icon: Lock },
  held:     { label: 'محجوز في بيتلي', color: 'bg-blue-100 text-blue-700', bar: 'bg-blue-500', icon: Shield },
  released: { label: 'تم الصرف', color: 'bg-green-100 text-green-700', bar: 'bg-green-500', icon: CheckCircle2 },
  refunded: { label: 'مُسترجَع', color: 'bg-rose-100 text-rose-700', bar: 'bg-rose-400', icon: AlertCircle }
};

const MILESTONE_STATUS_LABEL = {
  pending: 'لم تبدأ', in_progress: 'جارية', submitted: 'بانتظار المراجعة',
  revision_requested: 'تعديل مطلوب', approved: 'معتمدة', completed: 'مكتملة'
};

// ── Helper ────────────────────────────────────────────────────────────────────
function fmt(n) { return (n || 0).toLocaleString('ar-SA'); }

function StepDot({ done, active, failed }) {
  if (done) return <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shrink-0"><CheckCircle2 className="w-3.5 h-3.5 text-white" /></div>;
  if (active) return <div className="w-6 h-6 rounded-full bg-blue-500 animate-pulse flex items-center justify-center shrink-0"><Clock className="w-3.5 h-3.5 text-white" /></div>;
  if (failed) return <div className="w-6 h-6 rounded-full bg-rose-400 flex items-center justify-center shrink-0"><AlertCircle className="w-3.5 h-3.5 text-white" /></div>;
  return <div className="w-6 h-6 rounded-full border-2 border-slate-200 bg-white shrink-0" />;
}

function MilestoneEscrowRow({ milestone, isClient, projectId, onAction, commissionRate }) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState(null); // 'deposit' | 'release'

  const cfg = ESCROW_STATUS[milestone.escrow_status || 'none'];
  const Icon = cfg.icon;
  const gross = milestone.escrow_amount || milestone.amount || 0;
  const commission = Math.round(gross * (commissionRate / 100));
  const net = gross - commission;
  const canDeposit = isClient && (!milestone.escrow_status || milestone.escrow_status === 'none');
  const canRelease = isClient && milestone.escrow_status === 'held' && milestone.status === 'submitted';

  const doAction = async (type) => {
    setLoading(true);
    await onAction(type, milestone.id, gross);
    setLoading(false);
    setConfirm(null);
  };

  return (
    <div className={`rounded-xl border ${milestone.escrow_status === 'held' ? 'border-blue-200 bg-blue-50/40' : milestone.escrow_status === 'released' ? 'border-green-200 bg-green-50/30' : 'border-slate-100 bg-white'} overflow-hidden`}>
      {/* Header row */}
      <button
        className="w-full flex items-center gap-3 px-4 py-3 text-right hover:bg-black/[0.02] transition-colors"
        onClick={() => setExpanded(v => !v)}
      >
        <StepDot
          done={milestone.escrow_status === 'released'}
          active={milestone.escrow_status === 'held'}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-slate-800 truncate">{milestone.title}</span>
            <Badge className={`${cfg.color} text-[10px] py-0`}>
              <Icon className="w-2.5 h-2.5 ml-0.5 inline" />
              {cfg.label}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{MILESTONE_STATUS_LABEL[milestone.status] || milestone.status}</p>
        </div>
        <div className="text-left shrink-0">
          <p className="font-bold text-sm text-slate-800">{fmt(gross)} ر.س</p>
          <p className="text-xs text-slate-400">إجمالي</p>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
      </button>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 space-y-3 border-t border-slate-100">
              {/* Breakdown */}
              <div className="bg-slate-50 rounded-lg p-3 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">إجمالي الدفعة</span>
                  <span className="font-semibold">{fmt(gross)} ر.س</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">عمولة المنصة ({commissionRate}%)</span>
                  <span className="text-slate-500">− {fmt(commission)} ر.س</span>
                </div>
                <div className="border-t pt-1.5 flex justify-between">
                  <span className="font-semibold text-slate-700">صافي للمهندس</span>
                  <span className="font-bold text-green-600">{fmt(net)} ر.س</span>
                </div>
              </div>

              {milestone.due_date && (
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <CalendarClock className="w-3.5 h-3.5" />
                  موعد الاستحقاق: {new Date(milestone.due_date).toLocaleDateString('ar-SA')}
                </p>
              )}

              {milestone.submission_notes && (
                <div className="bg-amber-50 rounded-lg p-2.5 text-xs text-amber-800">
                  <FileText className="w-3.5 h-3.5 inline ml-1" />
                  <strong>ملاحظات التسليم: </strong>{milestone.submission_notes}
                </div>
              )}

              {/* Actions */}
              {canDeposit && !confirm && (
                <Button
                  size="sm"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2 text-xs"
                  onClick={() => setConfirm('deposit')}
                >
                  <Lock className="w-3.5 h-3.5" />
                  إيداع {fmt(gross)} ر.س ضماناً لهذه المرحلة
                </Button>
              )}
              {canRelease && !confirm && (
                <Button
                  size="sm"
                  className="w-full bg-green-600 hover:bg-green-700 text-white gap-2 text-xs"
                  onClick={() => setConfirm('release')}
                >
                  <Unlock className="w-3.5 h-3.5" />
                  تأكيد المراجعة وتحرير الدفعة
                </Button>
              )}
              {milestone.escrow_status === 'held' && milestone.status !== 'submitted' && isClient && (
                <p className="text-xs text-blue-600 bg-blue-50 rounded-lg p-2 text-center">
                  ⏳ في انتظار تسليم المهندس للمرحلة لتتمكن من إطلاق الدفعة
                </p>
              )}

              {/* Inline confirm */}
              {confirm && (
                <div className={`rounded-lg p-3 border ${confirm === 'deposit' ? 'border-blue-200 bg-blue-50' : 'border-green-200 bg-green-50'}`}>
                  <p className="text-xs text-slate-700 mb-2 font-medium">
                    {confirm === 'deposit'
                      ? `سيتم خصم ${fmt(gross)} ر.س من محفظتك وحجزها كضمان لهذه المرحلة.`
                      : `سيتم تحرير ${fmt(net)} ر.س للمهندس (بعد عمولة المنصة). هذا الإجراء لا يمكن التراجع عنه.`}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className={`flex-1 text-xs ${confirm === 'deposit' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'} text-white`}
                      onClick={() => doAction(confirm)}
                      disabled={loading}
                    >
                      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'تأكيد'}
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => setConfirm(null)} disabled={loading}>
                      إلغاء
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function EscrowTracker({ project, proposalId, isClient, isEngineer, onUpdate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [clientBalance, setClientBalance] = useState(0);
  const [showDeposit, setShowDeposit] = useState(false);
  const [showRelease, setShowRelease] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showTx, setShowTx] = useState(false);

  useEffect(() => { load(); }, [project?.id]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('escrow', { action: 'status', project_id: project.id });
      setData(res.data);
      if (isClient) {
        const user = await base44.auth.me();
        const clients = await base44.entities.Client.filter({ email: user.email });
        setClientBalance(clients[0]?.wallet_balance || 0);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleMilestoneAction = async (type, milestoneId, amount) => {
    const actionMap = { deposit: 'deposit_milestone', release: 'release_milestone' };
    const res = await base44.functions.invoke('escrow', {
      action: actionMap[type],
      project_id: project.id,
      milestone_id: milestoneId,
      amount
    });
    if (res.data?.error === 'insufficient_balance') {
      alert(`رصيدك غير كافٍ. المطلوب: ${res.data.required?.toLocaleString('ar-SA')} ر.س، المتاح: ${res.data.available?.toLocaleString('ar-SA')} ر.س`);
    }
    await load();
    onUpdate?.();
  };

  const handleProjectDeposit = async () => {
    setActionLoading(true);
    const res = await base44.functions.invoke('escrow', {
      action: 'deposit', project_id: project.id,
      proposal_id: proposalId, amount: project.escrow_amount
    });
    if (res.data?.error === 'insufficient_balance') {
      alert(`رصيدك غير كافٍ. المطلوب: ${res.data.required?.toLocaleString('ar-SA')} ر.س`);
    }
    setShowDeposit(false);
    await load();
    onUpdate?.();
    setActionLoading(false);
  };

  const handleProjectRelease = async () => {
    setActionLoading(true);
    await base44.functions.invoke('escrow', { action: 'release', project_id: project.id });
    setShowRelease(false);
    await load();
    onUpdate?.();
    setActionLoading(false);
  };

  if (loading) return (
    <Card className="border-0 shadow-lg">
      <CardContent className="flex items-center justify-center py-10">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </CardContent>
    </Card>
  );

  const status = data?.escrow_status || 'none';
  const cfg = ESCROW_STATUS[status];
  const StatusIcon = cfg.icon;
  const hasMilestones = data?.milestones?.length > 0;
  const useMilestoneEscrow = hasMilestones;
  const totalHeld = data?.total_held || 0;
  const totalReleased = data?.total_released || 0;
  const totalProject = data?.escrow_amount || project?.escrow_amount || 0;
  const insufficient = isClient && clientBalance < totalProject;

  return (
    <>
      <Card className="border-0 shadow-lg overflow-hidden" dir="rtl">
        {/* Color bar */}
        <div className={`h-1.5 ${cfg.bar}`} />

        <CardHeader className="pb-2 pt-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="w-5 h-5 text-blue-600" />
              نظام الضمان المالي (Escrow)
            </CardTitle>
            <button onClick={load} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pb-5">
          {/* Status badge */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">الحالة العامة</span>
            <Badge className={`${cfg.color} gap-1`}>
              <StatusIcon className="w-3.5 h-3.5" />
              {cfg.label}
            </Badge>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-blue-50 rounded-xl p-3 text-center">
              <Lock className="w-4 h-4 text-blue-500 mx-auto mb-1" />
              <p className="text-xs text-blue-600 font-semibold">{fmt(totalHeld)}</p>
              <p className="text-[10px] text-blue-400">محجوز</p>
            </div>
            <div className="bg-green-50 rounded-xl p-3 text-center">
              <Unlock className="w-4 h-4 text-green-500 mx-auto mb-1" />
              <p className="text-xs text-green-600 font-semibold">{fmt(totalReleased)}</p>
              <p className="text-[10px] text-green-400">محرَّر</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-3 text-center">
              <CircleDollarSign className="w-4 h-4 text-amber-500 mx-auto mb-1" />
              <p className="text-xs text-amber-600 font-semibold">{data?.commission_rate || 15}%</p>
              <p className="text-[10px] text-amber-400">عمولة</p>
            </div>
          </div>

          {/* How it works */}
          <div className="bg-blue-50 rounded-lg p-3 flex gap-2">
            <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700 leading-relaxed">
              المبلغ محجوز بأمان لدى بيتلي ولا يُحوَّل للمهندس إلا بعد موافقتك على مخرجاته.
              {useMilestoneEscrow && ' يمكنك إيداع دفعة كل مرحلة بشكل منفصل.'}
            </p>
          </div>

          {/* PROJECT-LEVEL Escrow (no milestones OR full project mode) */}
          {!useMilestoneEscrow && (
            <>
              <div className="bg-slate-50 rounded-xl p-3.5 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">المبلغ الكامل</span>
                  <span className="font-bold">{fmt(totalProject)} ر.س</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">عمولة المنصة ({data?.commission_rate || 15}%)</span>
                  <span className="text-slate-500">− {fmt(data?.commission_amount)} ر.س</span>
                </div>
                <div className="border-t pt-2 flex justify-between">
                  <span className="font-semibold text-slate-700">صافي المهندس</span>
                  <span className="font-bold text-green-600">{fmt(data?.engineer_will_receive)} ر.س</span>
                </div>
              </div>

              {/* Steps */}
              <div className="space-y-2">
                {[
                  { done: true, label: 'قبول العرض من العميل' },
                  { done: status !== 'none', active: status === 'none', label: 'إيداع المبلغ في ضمان بيتلي' },
                  { done: status === 'released', active: status === 'held', label: 'تنفيذ المشروع وتسليم المخططات' },
                  { done: status === 'released', label: 'موافقة العميل وتحرير المبلغ' }
                ].map((s, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <StepDot done={s.done} active={s.active} />
                    <span className={`text-xs ${s.done ? 'text-green-700 font-medium' : s.active ? 'text-blue-700 font-medium' : 'text-slate-400'}`}>
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Client actions */}
              {isClient && status === 'none' && totalProject > 0 && (
                <div className="space-y-2">
                  {insufficient && (
                    <div className="bg-rose-50 border border-rose-200 rounded-lg p-2 text-xs text-rose-700">
                      رصيدك ({fmt(clientBalance)} ر.س) غير كافٍ.{' '}
                      <Link to={createPageUrl('WalletTopup')} className="underline font-semibold">اشحن محفظتك</Link>
                    </div>
                  )}
                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2"
                    onClick={() => setShowDeposit(true)}
                    disabled={insufficient}
                  >
                    <Lock className="w-4 h-4" />
                    إيداع {fmt(totalProject)} ر.س ضماناً
                  </Button>
                </div>
              )}
              {isClient && status === 'held' && (
                <Button className="w-full bg-green-600 hover:bg-green-700 text-white gap-2" onClick={() => setShowRelease(true)}>
                  <Unlock className="w-4 h-4" />
                  تأكيد الاستلام وتحرير المبلغ
                </Button>
              )}
              {isEngineer && status === 'held' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mx-auto mb-1" />
                  <p className="text-sm text-green-700 font-medium">المبلغ محجوز بأمان</p>
                  <p className="text-xs text-green-500">سيُحوَّل إليك عند موافقة العميل</p>
                </div>
              )}
            </>
          )}

          {/* MILESTONE-LEVEL Escrow */}
          {useMilestoneEscrow && (
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-sm font-semibold text-slate-700">دفعات المراحل</h4>
                <span className="text-xs text-slate-400">{data.milestones.length} مراحل</span>
              </div>
              {data.milestones.map(m => (
                <MilestoneEscrowRow
                  key={m.id}
                  milestone={m}
                  isClient={isClient}
                  projectId={project.id}
                  onAction={handleMilestoneAction}
                  commissionRate={data?.commission_rate || 15}
                />
              ))}
              {/* Full-project release if overall held */}
              {isClient && status === 'held' && data.milestones.every(m => m.escrow_status !== 'held') && (
                <Button className="w-full bg-green-600 hover:bg-green-700 text-white gap-2 mt-2" onClick={() => setShowRelease(true)}>
                  <CheckCheck className="w-4 h-4" />
                  الموافقة النهائية وتحرير الرصيد المتبقي
                </Button>
              )}
            </div>
          )}

          {/* Transactions history toggle */}
          {data?.recent_transactions?.length > 0 && (
            <button
              onClick={() => setShowTx(v => !v)}
              className="w-full flex items-center justify-between text-xs text-slate-500 hover:text-slate-700 py-1 border-t border-slate-100 mt-1"
            >
              <span className="flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" /> سجل المعاملات</span>
              {showTx ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}
          <AnimatePresence>
            {showTx && data?.recent_transactions?.length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="space-y-2">
                  {data.recent_transactions.map((tx, i) => (
                    <div key={i} className="flex items-center gap-2.5 bg-slate-50 rounded-lg px-3 py-2">
                      {tx.type === 'escrow_hold'
                        ? <ArrowDownCircle className="w-4 h-4 text-blue-500 shrink-0" />
                        : tx.type === 'escrow_release'
                        ? <ArrowUpCircle className="w-4 h-4 text-green-500 shrink-0" />
                        : <Wallet className="w-4 h-4 text-slate-400 shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-700 truncate">{tx.description}</p>
                        <p className="text-[10px] text-slate-400">
                          {new Date(tx.created_date).toLocaleDateString('ar-SA')}
                        </p>
                      </div>
                      <span className={`text-xs font-bold shrink-0 ${tx.type === 'escrow_release' ? 'text-green-600' : 'text-blue-600'}`}>
                        {fmt(tx.amount)} ر.س
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {status === 'released' && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
              <CheckCheck className="w-5 h-5 text-green-600 mx-auto mb-1" />
              <p className="text-sm text-green-700 font-bold">اكتملت جميع المدفوعات ✓</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirm Deposit Dialog */}
      <Dialog open={showDeposit} onOpenChange={setShowDeposit}>
        <DialogContent className="max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-blue-600" />
              تأكيد إيداع الضمان
            </DialogTitle>
            <DialogDescription className="text-right space-y-2 pt-1">
              <p>سيتم خصم <strong className="text-slate-800">{fmt(totalProject)} ر.س</strong> من محفظتك وإيداعها في نظام الضمان.</p>
              <div className="bg-slate-50 rounded-lg p-2.5 text-xs space-y-1">
                <div className="flex justify-between"><span>إجمالي الضمان</span><span className="font-semibold">{fmt(totalProject)} ر.س</span></div>
                <div className="flex justify-between"><span>عمولة المنصة ({data?.commission_rate || 15}%)</span><span>− {fmt(data?.commission_amount)} ر.س</span></div>
                <div className="flex justify-between border-t pt-1"><span className="font-semibold">سيستلم المهندس</span><span className="font-bold text-green-600">{fmt(data?.engineer_will_receive)} ر.س</span></div>
              </div>
              <p className="text-xs text-slate-500">المبلغ لن يُحوَّل للمهندس إلا بعد موافقتك على المخرجات.</p>
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 mt-1">
            <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" onClick={handleProjectDeposit} disabled={actionLoading}>
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Lock className="w-4 h-4 ml-1" />تأكيد الإيداع</>}
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => setShowDeposit(false)}>إلغاء</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm Release Dialog */}
      <Dialog open={showRelease} onOpenChange={setShowRelease}>
        <DialogContent className="max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Unlock className="w-5 h-5 text-green-600" />
              تأكيد استلام المشروع وتحرير المبلغ
            </DialogTitle>
            <DialogDescription className="text-right space-y-2 pt-1">
              <p>بالموافقة، ستؤكد استلام المخرجات وسيتم تحرير المبلغ للمهندس.</p>
              <div className="bg-green-50 rounded-lg p-2.5 text-xs text-green-800 font-semibold text-center">
                سيستلم المهندس: {fmt(data?.engineer_will_receive)} ر.س
              </div>
              <p className="text-xs text-rose-600 font-medium">⚠️ هذا الإجراء لا يمكن التراجع عنه.</p>
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 mt-1">
            <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white" onClick={handleProjectRelease} disabled={actionLoading}>
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4 ml-1" />تأكيد الاستلام</>}
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => setShowRelease(false)}>إلغاء</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}