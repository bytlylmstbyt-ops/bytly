import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { CheckCircle, Download, ArrowLeft, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import confetti from 'canvas-confetti';

export default function DesignPurchaseSuccess() {
  const urlParams = new URLSearchParams(window.location.search);
  const purchaseId = urlParams.get("purchase_id");
  
  const [purchase, setPurchase] = useState(null);
  const [design, setDesign] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPurchaseData();
    
    // Celebrate!
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  }, [purchaseId]);

  const loadPurchaseData = async () => {
    try {
      const [purchaseData] = await base44.entities.DesignPurchase.filter({ id: purchaseId });
      
      if (purchaseData) {
        setPurchase(purchaseData);

        if (purchaseData.design_id) {
          const [designData] = await base44.entities.ReadyMadeDesign.filter({ id: purchaseData.design_id });
          setDesign(designData);
        }
      }
    } catch (error) {
      console.error("Error loading purchase data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-[#C9A66B]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50/30 py-12 flex items-center justify-center">
      <div className="max-w-2xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mb-6 shadow-2xl">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-[#1a1a2e] mb-4">
            تم الشراء بنجاح! 🎉
          </h1>
          <p className="text-lg text-slate-600 mb-8">
            شكراً لشرائك "{design?.title}"
          </p>

          <Card className="border-2 border-green-200 shadow-xl mb-6">
            <CardHeader className="bg-green-50">
              <CardTitle>تفاصيل الشراء</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="flex justify-between">
                <span className="text-slate-600">المبلغ المدفوع</span>
                <span className="font-bold text-xl">{purchase?.amount_paid?.toLocaleString('ar-SA')} ر.س</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">رقم العملية</span>
                <span className="font-mono text-slate-700">#{purchase?.id?.slice(0, 8)}</span>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            {purchase?.download_url && (
              <a 
                href={purchase.download_url} 
                download 
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white text-lg py-6">
                  <Download className="w-6 h-6 ml-2" />
                  تحميل الملفات الآن
                </Button>
              </a>
            )}

            <Link to={createPageUrl("MyPurchasedDesigns")}>
              <Button variant="outline" className="w-full">
                <FileText className="w-5 h-5 ml-2" />
                عرض مشترياتي
              </Button>
            </Link>

            <Link to={createPageUrl("DesignMarketplace")}>
              <Button variant="ghost" className="w-full">
                <ArrowLeft className="w-5 h-5 ml-2" />
                العودة للمتجر
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}