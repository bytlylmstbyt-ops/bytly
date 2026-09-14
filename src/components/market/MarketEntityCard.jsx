import React, { useState } from "react";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, MapPin, TrendingUp, MessageSquarePlus } from "lucide-react";
import MarketContactModal from "@/components/market/MarketContactModal";

export default function MarketEntityCard({ entity, onViewDetails }) {
  const [showContact, setShowContact] = useState(false);

  const entityTypeLabels = {
    developer: "مطور عقاري",
    investor: "مستثمر"
  };

  const entityTypeColors = {
    developer: "bg-blue-100 text-blue-800",
    investor: "bg-green-100 text-green-800"
  };

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-slate-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{entity.name}</h3>
              <Badge className={entityTypeColors[entity.entity_type]}>
                {entityTypeLabels[entity.entity_type]}
              </Badge>
            </div>
          </div>
          {entity.is_verified && (
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
              ✓ موثوق
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="w-4 h-4" />
          <span>{entity.region}</span>
        </div>

        {entity.project_types?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {entity.project_types.slice(0, 3).map((type, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {type}
              </Badge>
            ))}
            {entity.project_types.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{entity.project_types.length - 3}
              </Badge>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 text-sm">
          <TrendingUp className="w-4 h-4 text-muted-foreground" />
          <span className="text-muted-foreground">حجم الاستثمار:</span>
          <span className="font-medium">{entity.investment_range}</span>
        </div>

        {entity.completed_projects > 0 && (
          <div className="text-sm text-muted-foreground">
            المشاريع المنجزة: <span className="font-medium text-foreground">{entity.completed_projects}</span>
          </div>
        )}

        <p className="text-sm text-muted-foreground line-clamp-2">
          {entity.description}
        </p>
      </CardContent>

      <CardFooter className="flex gap-2">
        <Button
          className="w-full gap-2 bg-[#c9a66b] hover:bg-[#b8935a] text-white"
          onClick={() => setShowContact(true)}
        >
          <MessageSquarePlus className="w-4 h-4" />
          تقديم طلب
        </Button>
      </CardFooter>

      <MarketContactModal
        entity={entity}
        open={showContact}
        onClose={() => setShowContact(false)}
      />
    </Card>
  );
}