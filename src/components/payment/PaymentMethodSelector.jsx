import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Smartphone, Wallet } from "lucide-react";

export default function PaymentMethodSelector({ selectedGateway, onSelect }) {
  const gateways = [
    {
      id: 'tap',
      name: 'Tap Payments',
      description: 'ادفع باستخدام مدى، Apple Pay، STC Pay، أو البطاقات الائتمانية',
      icon: Wallet,
      recommended: true,
      methods: [
        { name: 'مدى', icon: '💳' },
        { name: 'Apple Pay', icon: '🍎' },
        { name: 'STC Pay', icon: '📱' },
        { name: 'Visa/Mastercard', icon: '💳' }
      ]
    },
    {
      id: 'stripe',
      name: 'Stripe',
      description: 'ادفع باستخدام البطاقات الائتمانية الدولية',
      icon: CreditCard,
      recommended: false,
      methods: [
        { name: 'Visa', icon: '💳' },
        { name: 'Mastercard', icon: '💳' },
        { name: 'Amex', icon: '💳' }
      ]
    }
  ];

  return (
    <div className="space-y-4">
      <div className="text-sm font-medium text-slate-700 mb-3">
        اختر طريقة الدفع المناسبة:
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {gateways.map((gateway) => {
          const Icon = gateway.icon;
          const isSelected = selectedGateway === gateway.id;
          
          return (
            <Card
              key={gateway.id}
              className={`cursor-pointer transition-all hover-lift ${
                isSelected 
                  ? 'ring-2 ring-[#C9A66B] border-[#C9A66B] bg-amber-50/50' 
                  : 'hover:border-[#C9A66B]/50'
              }`}
              onClick={() => onSelect(gateway.id)}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      isSelected ? 'bg-[#C9A66B]' : 'bg-slate-100'
                    }`}>
                      <Icon className={`w-5 h-5 ${
                        isSelected ? 'text-white' : 'text-slate-600'
                      }`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{gateway.name}</h3>
                      {gateway.recommended && (
                        <Badge className="mt-1 bg-green-100 text-green-800 text-xs">
                          موصى به للسوق السعودي
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {isSelected && (
                    <div className="w-5 h-5 bg-[#C9A66B] rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </div>
                
                <p className="text-sm text-slate-600 mb-3">{gateway.description}</p>
                
                <div className="flex flex-wrap gap-2">
                  {gateway.methods.map((method, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center gap-1 px-2 py-1 bg-white border border-slate-200 rounded text-xs"
                    >
                      <span>{method.icon}</span>
                      <span className="text-slate-600">{method.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}