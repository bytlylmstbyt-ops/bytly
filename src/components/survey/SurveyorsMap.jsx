import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { base44 } from '@/api/base44Client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  MapPin, Star, Navigation, Loader2, Ruler, Search, X,
  Layers, Compass, ArrowUp
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

// Fix default marker icon issue with webpack/vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

function svgToDataUri(svg) {
  return 'data:image/svg+xml,' + encodeURIComponent(svg.trim());
}

const surveyorIcon = new L.Icon({
  iconUrl: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 40" width="32" height="40">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#1a1a2e"/>
          <stop offset="100%" stop-color="#C9A66B"/>
        </linearGradient>
      </defs>
      <path d="M16 0C10.5 0 6 4.5 6 10c0 7.5 10 20 10 20s10-12.5 10-20C26 4.5 21.5 0 16 0z" fill="url(#g)"/>
      <circle cx="16" cy="10" r="5" fill="white" opacity="0.9"/>
      <circle cx="16" cy="10" r="2.5" fill="#C9A66B"/>
    </svg>
  `),
  iconSize: [32, 40],
  iconAnchor: [16, 40],
  popupAnchor: [0, -42],
});

const nearestIcon = new L.Icon({
  iconUrl: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 45" width="36" height="45">
      <defs>
        <linearGradient id="ng" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#C9A66B"/>
          <stop offset="100%" stop-color="#e74c3c"/>
        </linearGradient>
      </defs>
      <path d="M18 0C12 0 7 5 7 11c0 8 11 22 11 22s11-14 11-22C29 5 24 0 18 0z" fill="url(#ng)"/>
      <circle cx="18" cy="11" r="6" fill="white" opacity="0.95"/>
      <text x="18" y="14" text-anchor="middle" font-size="9" font-weight="bold" fill="#e74c3c">★</text>
    </svg>
  `),
  iconSize: [36, 45],
  iconAnchor: [18, 45],
  popupAnchor: [0, -47],
});

function formatSAR(n) { return (n || 0).toLocaleString('ar-SA') + ' ريال'; }

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Helper to fly the map to user location
function LocateButton() {
  const map = useMap();
  const [locating, setLocating] = useState(false);

  const flyToUser = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        map.flyTo([pos.coords.latitude, pos.coords.longitude], 14, { duration: 1.5 });
        setLocating(false);
      },
      () => setLocating(false)
    );
  };

  return (
    <button
      onClick={flyToUser}
      disabled={locating}
      className="absolute bottom-4 right-4 z-[1000] bg-white shadow-lg rounded-xl p-3 hover:bg-gray-50 transition-all"
      title="موقعي الحالي"
    >
      {locating ? <Loader2 className="w-5 h-5 animate-spin text-[#C9A66B]" /> : <Compass className="w-5 h-5 text-[#1a1a2e]" />}
    </button>
  );
}

/* ─── Surveyor List Sidebar ─── */
function SurveyorList({ surveyors, nearestId, selectedId, onSelect, userLocation, searchQuery, setSearchQuery }) {
  const sorted = [...surveyors].sort((a, b) => a.distance_km - b.distance_km);
  const filtered = searchQuery
    ? sorted.filter(s => s.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || s.city?.toLowerCase().includes(searchQuery.toLowerCase()))
    : sorted;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
      <div className="p-3 border-b border-gray-100">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="ابحث عن مساح..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pr-10 h-10 text-sm"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            <MapPin className="w-8 h-8 mx-auto mb-2 opacity-30" />
            لا يوجد مساحون في هذه المنطقة
          </div>
        ) : (
          filtered.map(s => (
            <button
              key={s.id}
              onClick={() => onSelect(s)}
              className={`w-full text-right p-3 flex items-start gap-3 hover:bg-gray-50 transition-colors border-b border-gray-50 ${
                selectedId === s.id ? 'bg-[#F5F0E8] border-r-4 border-r-[#C9A66B]' : ''
              } ${s.id === nearestId ? 'bg-green-50/50' : ''}`}
            >
              <Avatar className="w-10 h-10 shrink-0">
                <AvatarImage src={s.profile_image} />
                <AvatarFallback className="bg-gradient-to-br from-[#1a1a2e] to-[#C9A66B] text-white text-sm">
                  {s.full_name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium truncate">{s.full_name}</span>
                  {s.id === nearestId && (
                    <Badge className="bg-green-100 text-green-700 text-[10px] px-1.5 py-0 gap-0.5">
                      <Star className="w-2.5 h-2.5" /> الأقرب
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-gray-500 space-y-0.5 mt-0.5">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {s.city}
                    <span className="mx-1">·</span>
                    <Navigation className="w-3 h-3" /> {Math.round(s.distance_km * 10) / 10} كم
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    {s.rating?.toFixed(1) || '0.0'}
                    <span className="mx-1">·</span>
                    <Ruler className="w-3 h-3" /> {s.total_jobs || 0} مهمة
                  </div>
                </div>
              </div>
              <ArrowUp className="w-4 h-4 text-gray-300 mt-2 shrink-0" />
            </button>
          ))
        )}
      </div>
      {userLocation && (
        <div className="p-2 border-t border-gray-100 text-xs text-gray-400 text-center">
          📍 موقعك الحالي محدد على الخريطة
        </div>
      )}
    </div>
  );
}

/* ─── Map Popup Content ─── */
function SurveyorPopup({ surveyor }) {
  return (
    <div className="w-56 text-right" dir="rtl">
      <div className="flex items-center gap-2 mb-2">
        <Avatar className="w-10 h-10">
          <AvatarImage src={surveyor.profile_image} />
          <AvatarFallback className="bg-gradient-to-br from-[#1a1a2e] to-[#C9A66B] text-white">
            {surveyor.full_name?.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-bold text-sm text-[#1a1a2e]">{surveyor.full_name}</p>
          <p className="text-xs text-gray-500">{surveyor.city}</p>
        </div>
      </div>
      <div className="text-xs space-y-1 mb-2">
        <div className="flex items-center justify-between">
          <span className="text-gray-500">التقييم</span>
          <span className="flex items-center gap-0.5 font-medium">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            {surveyor.rating?.toFixed(1) || '0.0'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-500">المسافة</span>
          <span className="font-medium">{Math.round(surveyor.distance_km * 10) / 10} كم</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-500">المهام</span>
          <span className="font-medium">{surveyor.total_jobs || 0}</span>
        </div>
        {surveyor.license_number && (
          <div className="flex items-center justify-between">
            <span className="text-gray-500">الرخصة</span>
            <span className="font-medium text-[10px]">{surveyor.license_number}</span>
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <Link to={createPageUrl("EngineerProfile") + `?id=${surveyor.id}`} className="flex-1">
          <Button size="sm" className="w-full bg-[#1a1a2e] hover:bg-[#2a2a3e] text-white text-xs">
            الملف الكامل
          </Button>
        </Link>
      </div>
    </div>
  );
}

/* ─── Main Map Component ─── */
export default function SurveyorsMap({ onClose }) {
  const [surveyors, setSurveyors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [nearestId, setNearestId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
    detectLocation();
  }, []);

  const detectLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      pos => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {} // silently fail
    );
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const profiles = await base44.entities.SurveyorProfile.filter({ status: 'approved', is_available: true }, '', 100);
      const enriched = profiles
        .filter(s => s.latitude != null && s.longitude != null)
        .map(s => ({
          ...s,
          distance_km: 0
        }));

      // Sort by distance if user location available
      if (userLocation) {
        enriched.forEach(s => {
          s.distance_km = haversineKm(userLocation.lat, userLocation.lng, s.latitude, s.longitude);
        });
        enriched.sort((a, b) => a.distance_km - b.distance_km);
        if (enriched.length > 0) setNearestId(enriched[0].id);
      }

      setSurveyors(enriched);
    } catch (e) {
      setError('تعذر تحميل بيانات المساحين');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Re-compute distances when user location changes
  useEffect(() => {
    if (!userLocation || surveyors.length === 0) return;
    const updated = surveyors.map(s => ({
      ...s,
      distance_km: haversineKm(userLocation.lat, userLocation.lng, s.latitude, s.longitude)
    }));
    updated.sort((a, b) => a.distance_km - b.distance_km);
    setSurveyors(updated);
    if (updated.length > 0) setNearestId(updated[0].id);
  }, [userLocation]);

  const handleSelect = (surveyor) => {
    setSelectedId(surveyor.id);
    // Find the marker element to simulate a click — simpler approach: just scroll in sidebar
  };

  const defaultCenter = userLocation
    ? [userLocation.lat, userLocation.lng]
    : [24.7136, 46.6753]; // Riyadh

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" dir="rtl">
        <Loader2 className="w-8 h-8 animate-spin text-[#C9A66B]" />
      </div>
    );
  }

  return (
    <div className="relative" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-[#C9A66B]" />
          <h2 className="text-lg font-bold text-[#1a1a2e]">خريطة المساحين المتاحين</h2>
          {userLocation && (
            <Badge variant="outline" className="gap-1 text-xs">
              <Navigation className="w-3 h-3" /> موقعك محدد
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">{surveyors.length} مساح</span>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} className="gap-1">
              <X className="w-4 h-4" /> إغلاق
            </Button>
          )}
        </div>
      </div>

      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

      {surveyors.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <MapPin className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">لا يوجد مساحون مسجلون بمواقع جغرافية</p>
          <p className="text-sm mt-1">سيظهر المساحون هنا بعد تسجيل مواقعهم</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Sidebar */}
          <div className="lg:col-span-1 h-[500px] lg:h-[600px]">
            <SurveyorList
              surveyors={surveyors}
              nearestId={nearestId}
              selectedId={selectedId}
              onSelect={handleSelect}
              userLocation={userLocation}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />
          </div>

          {/* Map */}
          <div className="lg:col-span-3 h-[500px] lg:h-[600px] rounded-xl overflow-hidden border border-gray-200 shadow-sm relative">
            <MapContainer
              center={defaultCenter}
              zoom={12}
              className="w-full h-full z-0"
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* User location marker */}
              {userLocation && (
                <Marker
                  position={[userLocation.lat, userLocation.lng]}
                  icon={new L.Icon({
                    iconUrl: svgToDataUri(`
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="20" height="20">
                        <circle cx="10" cy="10" r="8" fill="#3B82F6" stroke="white" stroke-width="3" opacity="0.9"/>
                        <circle cx="10" cy="10" r="3" fill="white"/>
                      </svg>
                    `),
                    iconSize: [20, 20],
                    iconAnchor: [10, 10],
                  })}
                >
                  <Popup>
                    <div className="text-sm font-medium text-center">📍 موقعك الحالي</div>
                  </Popup>
                </Marker>
              )}

              {/* Surveyor markers */}
              {surveyors.map(s => (
                <Marker
                  key={s.id}
                  position={[s.latitude, s.longitude]}
                  icon={s.id === nearestId ? nearestIcon : surveyorIcon}
                  eventHandlers={{
                    click: () => setSelectedId(s.id),
                  }}
                >
                  <Popup>
                    <SurveyorPopup surveyor={s} />
                  </Popup>
                </Marker>
              ))}

              <LocateButton />
            </MapContainer>

            {/* Distance Legend */}
            <div className="absolute top-3 left-3 z-[1000] bg-white/90 backdrop-blur rounded-lg px-3 py-2 shadow text-xs space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-br from-[#1a1a2e] to-[#C9A66B]" />
                <span>مساح متاح</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-br from-[#C9A66B] to-[#e74c3c]" />
                <span>الأقرب لك</span>
              </div>
              {userLocation && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span>موقعك</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      {surveyors.length > 0 && userLocation && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
          <Card className="border-[#C9A66B]/20">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <Navigation className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">أقرب مساح</p>
                <p className="font-bold text-sm text-[#1a1a2e]">
                  {surveyors[0]?.full_name || '—'}
                </p>
                <p className="text-xs text-gray-400">{Math.round(surveyors[0]?.distance_km * 10) / 10} كم</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-[#C9A66B]/20">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="bg-amber-100 p-2 rounded-lg">
                <Star className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">الأعلى تقييماً قريب منك</p>
                <p className="font-bold text-sm text-[#1a1a2e]">
                  {[...surveyors].sort((a, b) => (b.rating || 0) - (a.rating || 0))[0]?.full_name || '—'}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-[#C9A66B]/20">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Layers className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">المساحون في نطاق 50 كم</p>
                <p className="font-bold text-sm text-[#1a1a2e]">
                  {surveyors.filter(s => s.distance_km <= 50).length} مساح
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}