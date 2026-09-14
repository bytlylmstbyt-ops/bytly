import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Search, X, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AdvancedSearch({ type = "engineers", onSearch, onReset }) {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState({
    query: "",
    specialization: "all",
    category: "all",
    location: "",
    minRating: 0,
    status: "all",
    minBudget: "",
    maxBudget: ""
  });

  const handleSearch = () => {
    onSearch(filters);
  };

  const handleReset = () => {
    const defaultFilters = {
      query: "",
      specialization: "all",
      category: "all",
      location: "",
      minRating: 0,
      status: "all",
      minBudget: "",
      maxBudget: ""
    };
    setFilters(defaultFilters);
    onReset();
  };

  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'query') return false;
    if (key === 'specialization' || key === 'category' || key === 'status') return value !== 'all';
    if (key === 'minRating') return value > 0;
    return value !== "";
  }).length;

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            placeholder={type === "engineers" ? "ابحث عن مهندسين..." : "ابحث عن مشاريع..."}
            value={filters.query}
            onChange={(e) => setFilters({ ...filters, query: e.target.value })}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="pr-10"
          />
        </div>
        <Button
          variant={isOpen ? "default" : "outline"}
          onClick={() => setIsOpen(!isOpen)}
          className="gap-2"
        >
          <Filter className="w-4 h-4" />
          تصفية
          {activeFiltersCount > 0 && (
            <Badge className="bg-white text-[#6B5D4F]">{activeFiltersCount}</Badge>
          )}
        </Button>
        <Button onClick={handleSearch} className="bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B]">
          بحث
        </Button>
      </div>

      {/* Advanced Filters */}
      {isOpen && (
        <Card className="border-[#C9A66B]/20">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {type === "engineers" && (
                <>
                  <div>
                    <Label>التخصص</Label>
                    <Select
                      value={filters.specialization}
                      onValueChange={(value) => setFilters({ ...filters, specialization: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">جميع التخصصات</SelectItem>
                        <SelectItem value="interior">تصميم داخلي</SelectItem>
                        <SelectItem value="architecture">معماري</SelectItem>
                        <SelectItem value="painter">رسام</SelectItem>
                        <SelectItem value="civil">مدني</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>المدينة</Label>
                    <Input
                      placeholder="أدخل المدينة"
                      value={filters.location}
                      onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label>التقييم الأدنى: {filters.minRating}</Label>
                    <Slider
                      value={[filters.minRating]}
                      onValueChange={([value]) => setFilters({ ...filters, minRating: value })}
                      max={5}
                      step={0.5}
                      className="mt-2"
                    />
                  </div>
                </>
              )}

              {type === "projects" && (
                <>
                  <div>
                    <Label>التصنيف</Label>
                    <Select
                      value={filters.category}
                      onValueChange={(value) => setFilters({ ...filters, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">جميع التصنيفات</SelectItem>
                        <SelectItem value="interior">تصميم داخلي</SelectItem>
                        <SelectItem value="architecture">معماري</SelectItem>
                        <SelectItem value="painting">رسم</SelectItem>
                        <SelectItem value="landscape">تنسيق حدائق</SelectItem>
                        <SelectItem value="furniture">أثاث</SelectItem>
                        <SelectItem value="lighting">إضاءة</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>حالة المشروع</Label>
                    <Select
                      value={filters.status}
                      onValueChange={(value) => setFilters({ ...filters, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">جميع الحالات</SelectItem>
                        <SelectItem value="open">مفتوح</SelectItem>
                        <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
                        <SelectItem value="completed">مكتمل</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>الموقع</Label>
                    <Input
                      placeholder="أدخل الموقع"
                      value={filters.location}
                      onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label>الميزانية الدنيا</Label>
                    <Input
                      type="number"
                      placeholder="من"
                      value={filters.minBudget}
                      onChange={(e) => setFilters({ ...filters, minBudget: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label>الميزانية القصوى</Label>
                    <Input
                      type="number"
                      placeholder="إلى"
                      value={filters.maxBudget}
                      onChange={(e) => setFilters({ ...filters, maxBudget: e.target.value })}
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-2 mt-4">
              <Button onClick={handleReset} variant="outline" size="sm">
                <X className="w-4 h-4 ml-2" />
                إعادة تعيين
              </Button>
              <Button onClick={handleSearch} size="sm" className="bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B]">
                تطبيق التصفية
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}