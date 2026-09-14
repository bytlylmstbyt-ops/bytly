import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Mail, Phone, Globe, Building2, MapPin, TrendingUp, Linkedin, Twitter, Instagram } from "lucide-react";

export default function MarketEntityDetail({ entity, onClose }) {
  if (!entity) return null;

  const entityTypeLabels = {
    developer: "مطور عقاري",
    investor: "مستثمر"
  };

  const entityTypeColors = {
    developer: "bg-blue-100 text-blue-800",
    investor: "bg-green-100 text-green-800"
  };

  return (
    <Dialog open={!!entity} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-8 h-8 text-slate-600" />
              </div>
              <div>
                <DialogTitle className="text-2xl">{entity.name}</DialogTitle>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={entityTypeColors[entity.entity_type]}>
                    {entityTypeLabels[entity.entity_type]}
                  </Badge>
                  {entity.is_verified && (
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      ✓ موثوق
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* معلومات التواصل */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {entity.email && (
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <Mail className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">البريد الإلكتروني</p>
                  <a href={`mailto:${entity.email}`} className="text-sm font-medium hover:text-blue-600">
                    {entity.email}
                  </a>
                </div>
              </div>
            )}
            {entity.phone && (
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <Phone className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">رقم الهاتف</p>
                  <a href={`tel:${entity.phone}`} className="text-sm font-medium hover:text-blue-600">
                    {entity.phone}
                  </a>
                </div>
              </div>
            )}
          </div>

          {entity.contact_person && (
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <Building2 className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">شخص التواصل</p>
                <p className="text-sm font-medium">{entity.contact_person}</p>
              </div>
            </div>
          )}

          {/* الموقع والمنطقة */}
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <MapPin className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">المنطقة</p>
              <p className="text-sm font-medium">{entity.region}</p>
            </div>
          </div>

          {/* أنواع المشاريع */}
          {entity.project_types?.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-3">أنواع المشاريع</h3>
              <div className="flex flex-wrap gap-2">
                {entity.project_types.map((type, idx) => (
                  <Badge key={idx} variant="outline">
                    {type}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* نطاق الاستثمار */}
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <TrendingUp className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">نطاق الاستثمار</p>
              <p className="text-sm font-medium">{entity.investment_range}</p>
            </div>
          </div>

          {/* المشاريع المنجزة */}
          {entity.completed_projects > 0 && (
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <Building2 className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">المشاريع المنجزة</p>
                <p className="text-sm font-medium">{entity.completed_projects} مشروع</p>
              </div>
            </div>
          )}

          {/* النبذة */}
          {entity.description && (
            <div>
              <h3 className="text-sm font-semibold mb-2">نبذة عن الجهة</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {entity.description}
              </p>
            </div>
          )}

          {/* الموقع الإلكتروني */}
          {entity.website && (
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <Globe className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">الموقع الإلكتروني</p>
                <a href={entity.website} target="_blank" rel="noopener noreferrer" 
                   className="text-sm font-medium text-blue-600 hover:underline">
                  {entity.website}
                </a>
              </div>
            </div>
          )}

          {/* روابط التواصل الاجتماعي */}
          {(entity.social_links?.linkedin || entity.social_links?.twitter || entity.social_links?.instagram) && (
            <div>
              <h3 className="text-sm font-semibold mb-3">التواصل الاجتماعي</h3>
              <div className="flex gap-2">
                {entity.social_links?.linkedin && (
                  <a href={entity.social_links.linkedin} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="gap-2">
                      <Linkedin className="w-4 h-4" />
                      LinkedIn
                    </Button>
                  </a>
                )}
                {entity.social_links?.twitter && (
                  <a href={entity.social_links.twitter} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="gap-2">
                      <Twitter className="w-4 h-4" />
                      Twitter
                    </Button>
                  </a>
                )}
                {entity.social_links?.instagram && (
                  <a href={entity.social_links.instagram} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="gap-2">
                      <Instagram className="w-4 h-4" />
                      Instagram
                    </Button>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* أزرار الإجراءات */}
          <div className="flex gap-3 pt-4 border-t">
            {entity.email && (
              <a href={`mailto:${entity.email}`} className="flex-1">
                <Button className="w-full gap-2">
                  <Mail className="w-4 h-4" />
                  تواصل عبر البريد
                </Button>
              </a>
            )}
            {entity.phone && (
              <a href={`tel:${entity.phone}`} className="flex-1">
                <Button variant="outline" className="w-full gap-2">
                  <Phone className="w-4 h-4" />
                  اتصال هاتفي
                </Button>
              </a>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}