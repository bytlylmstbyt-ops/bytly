import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { 
  Download, ShoppingCart, Star, FileText, Edit3, 
  Clock, CheckCircle, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function MyPurchasedDesigns() {
  const [purchases, setPurchases] = useState([]);
  const [designs, setDesigns] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPurchases();
  }, []);

  const loadPurchases = async () => {
    setIsLoading(true);
    const user = await base44.auth.me();
    
    const purchasesData = await base44.entities.DesignPurchase.filter(
      { buyer_email: user.email, payment_status: "completed" },
      "-created_date"
    );
    setPurchases(purchasesData);

    // Load design details
    const designsMap = {};
    for (const purchase of purchasesData) {
      const [designData] = await base44.entities.ReadyMadeDesign.filter({ id: purchase.design_id });
      if (designData) {
        designsMap[purchase.design_id] = designData;
      }
    }
    setDesigns(designsMap);

    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-[#C9A66B]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-[#1a1a2e] mb-2">التصاميم المشتراة</h1>
          <p className="text-slate-600">جميع التصاميم الجاهزة التي قمت بشرائها</p>
        </motion.div>

        {purchases.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {purchases.map((purchase, index) => {
              const design = designs[purchase.design_id];
              if (!design) return null;

              return (
                <motion.div
                  key={purchase.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="border-0 shadow-lg overflow-hidden">
                    <div className="h-48 bg-slate-100">
                      <img 
                        src={design.preview_images?.[0]} 
                        alt={design.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <CardContent className="p-6">
                      <h3 className="text-xl font-bold text-[#1a1a2e] mb-2">
                        {design.title}
                      </h3>
                      
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-lg font-semibold text-green-600">
                          {purchase.amount_paid?.toLocaleString('ar-SA')} ر.س
                        </p>
                        <Badge className="bg-green-100 text-green-700">
                          <CheckCircle className="w-3 h-3 ml-1" />
                          مكتمل
                        </Badge>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">تاريخ الشراء</span>
                          <span className="font-medium">
                            {new Date(purchase.created_date).toLocaleDateString('ar-SA')}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">عدد التحميلات</span>
                          <span className="font-medium">{purchase.download_count || 0}</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {purchase.download_url && (
                          <a 
                            href={purchase.download_url} 
                            download 
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1"
                          >
                            <Button className="w-full bg-blue-600 hover:bg-blue-700">
                              <Download className="w-4 h-4 ml-2" />
                              تحميل
                            </Button>
                          </a>
                        )}
                        
                        {design.modification_available && !purchase.has_modification_request && (
                          <Link 
                            to={createPageUrl("DesignDetails") + `?id=${design.id}`}
                            className="flex-1"
                          >
                            <Button variant="outline" className="w-full">
                              <Edit3 className="w-4 h-4 ml-2" />
                              تعديل
                            </Button>
                          </Link>
                        )}
                      </div>

                      {purchase.has_modification_request && (
                        <Badge className="w-full mt-3 py-2 bg-purple-100 text-purple-700 justify-center">
                          <Clock className="w-4 h-4 ml-2" />
                          طلب تعديل: {purchase.modification_status === "completed" ? "مكتمل" : "قيد المعالجة"}
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <ShoppingCart className="w-20 h-20 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">لا توجد مشتريات</h3>
            <p className="text-slate-500 mb-6">لم تقم بشراء أي تصاميم بعد</p>
            <Link to={createPageUrl("DesignMarketplace")}>
              <Button className="bg-gradient-to-r from-[#1a1a2e] to-[#C9A66B] text-white">
                تصفح المتجر
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}