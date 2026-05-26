import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import MobileSelect from "@/components/mobile/MobileSelect";
import { Search, Filter, X, Building2 } from "lucide-react";
import MarketEntityCard from "@/components/market/MarketEntityCard";
import MarketEntityDetail from "@/components/market/MarketEntityDetail";

const REGIONS = [
  "الرياض", "جدة", "الدمام", "مكة", "المدينة", 
  "أبها", "تبوك", "حائل", "الجوف", "القصيم", 
  "عسير", "جازان", "نجران", "الباحة", "الحدود الشمالية", "شرورة"
];

const PROJECT_TYPES = [
  "سكني", "تجاري", "صناعي", "ترفيهي", "تعليمي", "صحي", "مختلط"
];

const INVESTMENT_RANGES = [
  "أقل من 1 مليون", "1-5 مليون", "5-10 مليون", 
  "10-50 مليون", "50-100 مليون", "أكثر من 100 مليون"
];

export default function MarketEntitiesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [selectedEntityType, setSelectedEntityType] = useState("all");
  const [selectedProjectType, setSelectedProjectType] = useState("all");
  const [selectedInvestmentRange, setSelectedInvestmentRange] = useState("all");
  const [selectedEntity, setSelectedEntity] = useState(null);

  const { data: entities, isLoading } = useQuery({
    queryKey: ['market-entities'],
    queryFn: () => base44.entities.MarketEntity.filter({ status: "active" }),
    initialData: [],
  });

  const filteredEntities = entities.filter(entity => {
    const matchesSearch = entity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         entity.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRegion = selectedRegion === "all" || entity.region === selectedRegion;
    const matchesType = selectedEntityType === "all" || entity.entity_type === selectedEntityType;
    const matchesProjectType = selectedProjectType === "all" || 
                               entity.project_types?.includes(selectedProjectType);
    const matchesInvestment = selectedInvestmentRange === "all" || 
                              entity.investment_range === selectedInvestmentRange;
    
    return matchesSearch && matchesRegion && matchesType && matchesProjectType && matchesInvestment;
  });

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedRegion("all");
    setSelectedEntityType("all");
    setSelectedProjectType("all");
    setSelectedInvestmentRange("all");
  };

  const hasActiveFilters = searchQuery || selectedRegion !== "all" || 
                          selectedEntityType !== "all" || selectedProjectType !== "all" || 
                          selectedInvestmentRange !== "all";

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">سوق المطورين والمستثمرين</h1>
          <p className="text-muted-foreground">
            تصفح قائمة المطورين العقاريين والمستثمرين المعتمدين في المملكة
          </p>
        </div>

        <div className="mb-6 space-y-4">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="ابحث بالاسم أو الوصف..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters} className="gap-2">
                <X className="w-4 h-4" />
                مسح الفلاتر
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <MobileSelect
              value={selectedEntityType}
              onValueChange={setSelectedEntityType}
              placeholder="نوع الجهة"
              options={[
                { value: "all", label: "الكل" },
                { value: "developer", label: "مطورين عقاريين" },
                { value: "investor", label: "مستثمرين" },
              ]}
            />

            <MobileSelect
              value={selectedRegion}
              onValueChange={setSelectedRegion}
              placeholder="المنطقة"
              options={[
                { value: "all", label: "الكل" },
                ...REGIONS.map(region => ({ value: region, label: region })),
              ]}
            />

            <MobileSelect
              value={selectedProjectType}
              onValueChange={setSelectedProjectType}
              placeholder="نوع المشروع"
              options={[
                { value: "all", label: "الكل" },
                ...PROJECT_TYPES.map(type => ({ value: type, label: type })),
              ]}
            />

            <MobileSelect
              value={selectedInvestmentRange}
              onValueChange={setSelectedInvestmentRange}
              placeholder="حجم الاستثمار"
              options={[
                { value: "all", label: "الكل" },
                ...INVESTMENT_RANGES.map(range => ({ value: range, label: range })),
              ]}
            />
          </div>

          {hasActiveFilters && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Filter className="w-4 h-4" />
              <span>تم العثور على {filteredEntities.length} جهة</span>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredEntities.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">لا توجد نتائج</h3>
            <p className="text-muted-foreground">
              حاول تغيير معايير البحث أو الفلاتر
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEntities.map(entity => (
              <MarketEntityCard 
                key={entity.id} 
                entity={entity} 
                onViewDetails={setSelectedEntity}
              />
            ))}
          </div>
        )}
      </div>

      {selectedEntity && (
        <MarketEntityDetail 
          entity={selectedEntity} 
          onClose={() => setSelectedEntity(null)} 
        />
      )}
    </div>
  );
}