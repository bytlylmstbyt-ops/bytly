import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import {
    Mail, Phone, MapPin, Send, CheckCircle2, Loader2,
    MessageSquare, Clock, Instagram, Facebook
} from 'lucide-react';

export default function ContactUs() {
    const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name || !form.email || !form.message) {
            setError('يرجى ملء جميع الحقول المطلوبة');
            return;
        }
        setError('');
        setLoading(true);
        try {
            await base44.functions.invoke('contactUs', form);
            setSent(true);
        } catch (err) {
            setError('حدث خطأ أثناء الإرسال، يرجى المحاولة مرة أخرى');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30" dir="rtl">
            {/* Hero */}
            <div className="bg-gradient-to-l from-[#1a1a2e] to-[#4a3f35] text-white py-16 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <MessageSquare className="w-8 h-8 text-[#d4a574]" />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold mb-3">تواصل معنا</h1>
                        <p className="text-slate-300 text-lg max-w-xl mx-auto">
                            نحن هنا للإجابة على استفساراتك ومساعدتك في كل ما تحتاج. تواصل معنا وسنرد عليك في أقرب وقت.
                        </p>
                    </motion.div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Contact Info */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="space-y-4"
                    >
                        <h2 className="text-xl font-bold text-[#1a1a2e] mb-6">معلومات التواصل</h2>

                        <InfoCard icon={<Mail className="w-5 h-5 text-[#d4a574]" />} title="البريد الإلكتروني">
                            <a href="mailto:info@mybytly.com" className="text-[#d4a574] hover:underline text-sm">
                                info@mybytly.com
                            </a>
                        </InfoCard>

                        <InfoCard icon={<Clock className="w-5 h-5 text-[#d4a574]" />} title="ساعات العمل">
                            <p className="text-sm text-slate-600">الأحد – الخميس</p>
                            <p className="text-sm text-slate-600">9:00 صباحاً – 5:00 مساءً</p>
                        </InfoCard>

                        <InfoCard icon={<MapPin className="w-5 h-5 text-[#d4a574]" />} title="الموقع">
                            <p className="text-sm text-slate-600">المملكة العربية السعودية</p>
                        </InfoCard>

                        <div className="pt-2">
                            <p className="text-sm font-medium text-slate-700 mb-3">تابعنا على</p>
                            <div className="flex gap-3">
                                <a href="https://www.instagram.com/bytlylmstbyt" target="_blank" rel="noopener noreferrer"
                                    className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white hover:opacity-90 transition-opacity">
                                    <Instagram className="w-5 h-5" />
                                </a>
                                <a href="https://www.facebook.com/profile.php?id=61587162083581" target="_blank" rel="noopener noreferrer"
                                    className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white hover:opacity-90 transition-opacity">
                                    <Facebook className="w-5 h-5" />
                                </a>
                            </div>
                        </div>
                    </motion.div>

                    {/* Form */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="lg:col-span-2"
                    >
                        <Card className="border-0 shadow-lg">
                            <CardContent className="p-8">
                                {sent ? (
                                    <div className="text-center py-12">
                                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <CheckCircle2 className="w-10 h-10 text-green-600" />
                                        </div>
                                        <h3 className="text-xl font-bold text-[#1a1a2e] mb-2">تم إرسال رسالتك بنجاح!</h3>
                                        <p className="text-slate-500 mb-6">سنتواصل معك في أقرب وقت ممكن على البريد الإلكتروني المدخل.</p>
                                        <Button onClick={() => { setSent(false); setForm({ name: '', email: '', phone: '', subject: '', message: '' }); }}
                                            variant="outline">إرسال استفسار آخر</Button>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmit} className="space-y-5">
                                        <h2 className="text-xl font-bold text-[#1a1a2e] mb-6">أرسل لنا رسالة</h2>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                                    الاسم الكامل <span className="text-red-500">*</span>
                                                </label>
                                                <Input name="name" value={form.name} onChange={handleChange}
                                                    placeholder="محمد أحمد" className="h-11" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                                    البريد الإلكتروني <span className="text-red-500">*</span>
                                                </label>
                                                <Input name="email" type="email" value={form.email} onChange={handleChange}
                                                    placeholder="example@email.com" className="h-11" dir="ltr" />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1.5">رقم الجوال</label>
                                                <Input name="phone" value={form.phone} onChange={handleChange}
                                                    placeholder="05xxxxxxxx" className="h-11" dir="ltr" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1.5">موضوع الرسالة</label>
                                                <Input name="subject" value={form.subject} onChange={handleChange}
                                                    placeholder="استفسار عام" className="h-11" />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                                الرسالة <span className="text-red-500">*</span>
                                            </label>
                                            <textarea
                                                name="message"
                                                value={form.message}
                                                onChange={handleChange}
                                                placeholder="اكتب رسالتك أو استفسارك هنا..."
                                                rows={5}
                                                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                                            />
                                        </div>

                                        {error && (
                                            <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">{error}</p>
                                        )}

                                        <Button type="submit" disabled={loading}
                                            className="w-full h-12 bg-gradient-to-r from-[#1a1a2e] to-[#d4a574] text-white hover:opacity-90 gap-2 text-base">
                                            {loading ? (
                                                <><Loader2 className="w-5 h-5 animate-spin" /> جارٍ الإرسال...</>
                                            ) : (
                                                <><Send className="w-5 h-5" /> إرسال الرسالة</>
                                            )}
                                        </Button>
                                    </form>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}

function InfoCard({ icon, title, children }) {
    return (
        <div className="flex items-start gap-3 p-4 bg-white rounded-xl shadow-sm border border-slate-100">
            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center shrink-0">
                {icon}
            </div>
            <div>
                <p className="font-semibold text-slate-800 text-sm mb-1">{title}</p>
                {children}
            </div>
        </div>
    );
}