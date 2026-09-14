import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Wallet, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle2, XCircle, DollarSign, ShieldCheck, RefreshCw } from 'lucide-react';

const typeConfig = {
  deposit: { label: 'إيداع', color: 'bg-green-100 text-green-700', icon: ArrowDownLeft },
  withdrawal: { label: 'سحب', color: 'bg-red-100 text-red-700', icon: ArrowUpRight },
  escrow_hold: { label: 'حجز ضمان', color: 'bg-amber-100 text-amber-700', icon: ShieldCheck },
  escrow_release: { label: 'تحرير ضمان', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  commission: { label: 'عمولة', color: 'bg-purple-100 text-purple-700', icon: DollarSign },
  refund: { label: 'استرجاع', color: 'bg-blue-100 text-blue-700', icon: ArrowDownLeft },
  payment: { label: 'دفعة', color: 'bg-sky-100 text-sky-700', icon: DollarSign },
  withdrawal_request: { label: 'طلب سحب', color: 'bg-orange-100 text-orange-700', icon: Clock },
  withdrawal_completed: { label: 'سحب مكتمل', color: 'bg-teal-100 text-teal-700', icon: CheckCircle2 },
  subscription: { label: 'اشتراك', color: 'bg-indigo-100 text-indigo-700', icon: DollarSign }
};

const statusConfig = {
  pending: { label: 'معلق', color: 'text-amber-600', icon: Clock },
  completed: { label: 'مكتمل', color: 'text-green-600', icon: CheckCircle2 },
  failed: { label: 'فشل', color: 'text-red-600', icon: XCircle },
  cancelled: { label: 'ملغي', color: 'text-gray-400', icon: XCircle },
  held_in_escrow: { label: 'محتجز', color: 'text-amber-600', icon: ShieldCheck }
};

function formatSAR(n) {
  const num = n || 0;
  return (num < 0 ? '-' : '') + Math.abs(num).toLocaleString('ar-SA') + ' ريال';
}

export default function TransactionHistory({ userEmail, walletBalance, onRefresh }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.Transaction.filter(
        { user_email: userEmail },
        '-created_date',
        50
      );
      setTransactions(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (userEmail) loadTransactions();
  }, [userEmail]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20" dir="rtl">
        <Loader2 className="w-8 h-8 animate-spin text-[#C9A66B]" />
      </div>
    );
  }

  return (
    <div dir="rtl" className="space-y-4">
      {/* Balance Card */}
      <Card className="bg-gradient-to-l from-[#4A3F35] to-[#6B5D4F] text-white border-0 shadow-lg">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-sm flex items-center gap-1.5">
                <Wallet className="w-4 h-4" /> رصيد المحفظة
              </p>
              <p className="text-3xl font-bold mt-1 text-[#C9A66B]">{formatSAR(walletBalance)}</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => { loadTransactions(); if (onRefresh) onRefresh(); }}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" /> تحديث
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transactions */}
      <h3 className="text-lg font-bold text-[#4A3F35] flex items-center gap-2">
        <Clock className="w-5 h-5 text-[#C9A66B]" /> سجل الحركات المالية
      </h3>

      {transactions.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>لا توجد حركات مالية حتى الآن</p>
        </div>
      ) : (
        <div className="space-y-2">
          {transactions.map(tx => {
            const tc = typeConfig[tx.type] || { label: tx.type, color: 'bg-gray-100 text-gray-600', icon: DollarSign };
            const sc = statusConfig[tx.status] || { label: tx.status, color: 'text-gray-500', icon: Clock };
            const isOut = ['escrow_hold', 'withdrawal', 'withdrawal_request', 'subscription'].includes(tx.type);

            return (
              <Card key={tx.id} className="border-gray-200 hover:shadow-sm transition-shadow">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={`p-2 rounded-lg shrink-0 ${tc.color.split(' ')[0]} bg-opacity-20`}>
                        <tc.icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={tc.color + ' text-xs gap-1'}>
                            <tc.icon className="w-3 h-3" />
                            {tc.label}
                          </Badge>
                          <span className={`text-xs flex items-center gap-1 ${sc.color}`}>
                            <sc.icon className="w-3 h-3" />
                            {sc.label}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-[#4A3F35] mt-1.5 truncate">
                          {tx.description || 'معاملة'}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(tx.created_date).toLocaleDateString('ar-SA', {
                            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-left shrink-0">
                      <p className={`text-base font-bold ${isOut ? 'text-red-500' : 'text-green-600'}`}>
                        {isOut ? '-' : '+'}{formatSAR(tx.net_amount || tx.amount)}
                      </p>
                      {tx.balance_after != null && (
                        <p className="text-xs text-gray-400 mt-0.5">الرصيد: {formatSAR(tx.balance_after)}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}