import React, { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import { Badge } from "@/components/ui/badge";
import { MapPin, Navigation, Building2, Ruler, DollarSign, Eye, Clock } from "lucide-react";

// Fix default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Custom marker icons by status
const statusColors = {
  pending: "#eab308",
  broadcasted: "#3b82f6",
  accepted: "#22c55e",
  in_progress: "#6366f1",
  submitted: "#a855f7",
  approved: "#10b981",
  disbursed: "#14b8a6",
  cancelled: "#ef4444",
};

const statusLabels = {
  pending: "قيد الانتظار",
  broadcasted: "متاح",
  accepted: "تم القبول",
  in_progress: "قيد التنفيذ",
  submitted: "تم التسليم",
  approved: "تم الاعتماد",
  disbursed: "تم الصرف",
  cancelled: "ملغي",
};

function createCustomIcon(status) {
  const color = statusColors[status] || "#64748b";
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="background:${color};width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;"><span style="transform:rotate(45deg);color:white;font-size:12px;">📍</span></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  });
}

function formatSAR(n) {
  return (n || 0).toLocaleString("ar-SA") + " ريال";
}

export default function SurveyInteractiveMap({ requests = [], surveyorLocation = null, surveyorRadius = null, onSelectRequest }) {
  const [selectedId, setSelectedId] = useState(null);

  // Filter requests that have coordinates
  const geoRequests = requests.filter(r => r.latitude && r.longitude);

  // Calculate map center
  let center = [24.7136, 46.6753]; // Default: Riyadh
  if (geoRequests.length > 0) {
    const avgLat = geoRequests.reduce((sum, r) => sum + parseFloat(r.latitude), 0) / geoRequests.length;
    const avgLng = geoRequests.reduce((sum, r) => sum + parseFloat(r.longitude), 0) / geoRequests.length;
    center = [avgLat, avgLng];
  } else if (surveyorLocation?.lat && surveyorLocation?.lng) {
    center = [parseFloat(surveyorLocation.lat), parseFloat(surveyorLocation.lng)];
  }

  const handleSelect = (request) => {
    setSelectedId(request.id);
    if (onSelectRequest) onSelectRequest(request);
  };

  if (geoRequests.length === 0 && !surveyorLocation) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 text-center text-slate-400" dir="rtl">
        <MapPin className="w-10 h-10 mx-auto mb-2 opacity-30" />
        <p className="text-sm font-medium">لا توجد مواقع مساحية متاحة</p>
        <p className="text-xs mt-1">ستظهر المواقع على الخريطة بمجرد توفر بيانات الإحداثيات</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-slate-50">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-[#C9A66B]" />
          <span className="text-sm font-bold text-[#4A3F35]">الخريطة التفاعلية</span>
          <Badge variant="outline" className="text-xs">{geoRequests.length} موقع</Badge>
        </div>
        {/* Legend */}
        <div className="hidden sm:flex items-center gap-2">
          {Object.entries(statusColors).slice(0, 5).map(([status, color]) => (
            <div key={status} className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
              <span className="text-xs text-slate-500">{statusLabels[status]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Map */}
      <div className="h-80 sm:h-96 relative">
        <MapContainer center={center} zoom={11} className="w-full h-full z-0" scrollWheelZoom={false}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors'
          />

          {/* Surveyor location + radius */}
          {surveyorLocation?.lat && surveyorLocation?.lng && (
            <>
              <Marker
                position={[parseFloat(surveyorLocation.lat), parseFloat(surveyorLocation.lng)]}
                icon={L.divIcon({
                  className: "surveyor-marker",
                  html: `<div style="background:#4A3F35;width:32px;height:32px;border-radius:50%;border:3px solid #C9A66B;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:white;font-size:14px;">🗺️</div>`,
                  iconSize: [32, 32],
                  iconAnchor: [16, 16],
                })}
              >
                <Popup>
                  <div dir="rtl" className="text-sm">
                    <p className="font-bold">موقعك الحالي</p>
                    <p className="text-xs text-slate-500">نطاق التغطية: {surveyorRadius || 50} كم</p>
                  </div>
                </Popup>
              </Marker>
              {surveyorRadius && (
                <Circle
                  center={[parseFloat(surveyorLocation.lat), parseFloat(surveyorLocation.lng)]}
                  radius={(surveyorRadius || 50) * 1000}
                  pathOptions={{ color: "#C9A66B", fillColor: "#C9A66B", fillOpacity: 0.05, weight: 1.5, dashArray: "5, 5" }}
                />
              )}
            </>
          )}

          {/* Request markers */}
          {geoRequests.map(req => (
            <Marker
              key={req.id}
              position={[parseFloat(req.latitude), parseFloat(req.longitude)]}
              icon={createCustomIcon(req.status)}
              eventHandlers={{ click: () => handleSelect(req) }}
            >
              <Popup>
                <div dir="rtl" className="text-sm min-w-[200px] space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <Badge className={`text-xs border-0`} style={{ background: statusColors[req.status] || "#64748b", color: "white" }}>
                      {statusLabels[req.status] || req.status}
                    </Badge>
                  </div>
                  {req.address && (
                    <p className="flex items-start gap-1 text-xs text-slate-600">
                      <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
                      {req.address}
                    </p>
                  )}
                  <p className="flex items-center gap-1 text-xs text-slate-600">
                    <Ruler className="w-3 h-3" />
                    المساحة: {req.property_area_sqm} م²
                  </p>
                  {req.total_charged != null && (
                    <p className="flex items-center gap-1 text-xs text-slate-600">
                      <DollarSign className="w-3 h-3" />
                      {formatSAR(req.total_charged)}
                    </p>
                  )}
                  {req.payout_amount != null && (
                    <p className="flex items-center gap-1 text-xs text-[#C9A66B] font-medium">
                      <DollarSign className="w-3 h-3" />
                      أتعاب المساح: {formatSAR(req.payout_amount)}
                    </p>
                  )}
                  {req.distance_km != null && (
                    <p className="flex items-center gap-1 text-xs text-blue-600">
                      <Navigation className="w-3 h-3" />
                      المسافة: {req.distance_km} كم
                    </p>
                  )}
                  <p className="flex items-center gap-1 text-xs text-slate-400 pt-1 border-t">
                    <Clock className="w-3 h-3" />
                    {new Date(req.created_date).toLocaleDateString("ar-SA")}
                  </p>
                  {onSelectRequest && (
                    <button
                      onClick={() => handleSelect(req)}
                      className="w-full mt-1 text-xs bg-[#4A3F35] text-white rounded px-2 py-1 hover:bg-[#3A2F25] transition-colors flex items-center justify-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      عرض التفاصيل
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Stats footer */}
      <div className="flex items-center justify-between p-3 border-t bg-slate-50 text-xs">
        <div className="flex items-center gap-1 text-slate-500">
          <Building2 className="w-3.5 h-3.5" />
          <span>{geoRequests.filter(r => r.property_status === "existing_building").length} مبنى قائم</span>
          <span className="mx-1">|</span>
          <span>{geoRequests.filter(r => r.property_status === "vacant_land").length} أرض فضاء</span>
        </div>
        {selectedId && (
          <Badge className="bg-[#4A3F35] text-white text-xs">تم تحديد موقع</Badge>
        )}
      </div>
    </div>
  );
}