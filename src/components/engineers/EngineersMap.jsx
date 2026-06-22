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
  MapPin, Star, Navigation, Loader2, Search, X,
  Layers, Compass, ArrowUp, CheckCircle, Briefcase, Award
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

const engineerIcon = new L.Icon({
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
      <path d="M14 8h4v4h-4z" fill="#C9A66B" transform="rotate(45 16 10)"/>
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

const verifiedIcon = new L.Icon({
  iconUrl: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 40" width="32" height="40">
      <defs>
        <linearGradient id="vg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#2563eb"/>
          <stop offset="100%" stop-color="#1d4ed8"/>
        </linearGradient>
      </defs>
      <path d="M16 0C10.5 0 6 4.5 6 10c0 7.5 10 20 10 20s10-12.5 10-20C26 4.5 21.5 0 16 0z" fill="url(#vg)"/>
      <circle cx="16" cy="10" r="5" fill="white" opacity="0.9"/>
      <path d="M13.5 10l2 2 3.5-3.5" stroke="#2563eb" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `),
  iconSize: [32, 40],
  iconAnchor: [16, 40],
  popupAnchor: [0, -42],
});

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getEngineerIcon(engineer, nearestId) {
  if (engineer.id === nearestId) return nearestIcon;
  if (engineer.is_verified) return verifiedIcon;
  return engineerIcon;
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

/* ─── Engineer List Sidebar ─── */
function EngineerList({ engineers, nearestId, selectedId, onSelect, userLocation, searchQuery, setSearchQuery }) {
  const sorted = [...engineers].sort((a, b) => (a.distance_km ?? 9999) - (b.distance_km ?? 9999));
  const filtered = searchQuery
    ? sorted.filter(e => e.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || e.city?.toLowerCase().includes(searchQuery.toLowerCase()) || e.specialization?.toLowerCase().includes(searchQuery.toLowerCase()))
    : sorted;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
      <div className="p-3 border-b border-gray-100">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="ابحث عن مهندس..."
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
            لا يوجد مهندسون في هذه المنطقة
          </div>
        ) : (
          filtered.map(e => (
            <button
              key={e.id}
              onClick={() => onSelect(e)}
              className={`w-full text-right p-3 flex items-start gap-3 hover:bg-gray-50 transition-colors border-b border-gray-50 ${
                selectedId === e.id ? 'bg-[#F5F0E8] border-r-4 border-r-[#C9A66B]' : ''
              } ${e.id === nearestId ? 'bg-green-50/50' : ''}`}
            >
              <Avatar className="w-10 h-10 shrink-0">
                <AvatarImage src={e.profile_image} />
                <AvatarFallback className="bg-gradient-to-br from-[#1a1a2e] to-[#C9A66B] text-white text-sm">
                  {e.full_name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-sm font-medium truncate">{e.full_name}</span>
                  {e.is_verified && (
                    <CheckCircle className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  )}
                  {e.id === nearestId && (
                    <Badge className="bg-green-100 text-green-700 text-[10px] px-1.5 py-0 gap-0.5">
                      <Star className="w-2.5 h-2.5" /> الأقرب
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-gray-500 space-y-0.5 mt-0.5">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {e.city}
                    {userLocation && e.distance_km != null && (
                      <>
                        <span className="mx-1">·</span>
                        <Navigation className="w-3 h-3" /> {Math.round(e.distance_km * 10) / 10} كم
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    {e.rating?.toFixed(1) || '0.0'}
                    <span className="mx-1">·</span>
                    <Briefcase className="w-3 h-3" /> {e.completed_projects || 0} مشروع
                  </div>
                  <p className="truncate text-gray-400">{e.specialization}</p>
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
function EngineerPopup({ engineer }) {
  return (
    <div className="w-56 text-right" dir="rtl">
      <div className="flex items-center gap-2 mb-2">
        <Avatar className="w-10 h-10">
          <AvatarImage src={engineer.profile_image} />
          <AvatarFallback className="bg-gradient-to-br from-[#1a1a2e] to-[#C9A66B] text-white">
            {engineer.full_name?.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-bold text-sm text-[#1a1a2e]">{engineer.full_name}</p>
          <p className="text-xs text-gray-500">{engineer.specialization}</p>
        </div>
      </div>
      <div className="text-xs space-y-1 mb-2">
        <div className="flex items-center justify-between">
          <span className="text-gray-500">المدينة</span>
          <span className="font-medium flex items-center gap-0.5">
            <MapPin className="w-3 h-3" /> {engineer.city}
          </span>
        </div>
        {engineer.distance_km != null && (
          <div className="flex items-center justify-between">
            <span className="text-gray-500">المسافة منك</span>
            <span className="font-medium">{Math.round(engineer.distance_km * 10) / 10} كم</span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-gray-500">التقييم</span>
          <span className="flex items-center gap-0.5 font-medium">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            {engineer.rating?.toFixed(1) || '0.0'} ({engineer.total_reviews || 0})
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-500">المشاريع المنجزة</span>
          <span className="font-medium">{engineer.completed_projects || 0}</span>
        </div>
        {engineer.years_experience > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-gray-500">سنوات الخبرة</span>
            <span className="font-medium">{engineer.years_experience}</span>
          </div>
        )}
        {engineer.is_verified && (
          <div className="flex items-center gap-1 text-blue-600 text-[11px] font-medium">
            <CheckCircle className="w-3 h-3" /> مهندس معتمد وموثق
          </div>
        )}
      </div>
      <Link to={createPageUrl("EngineerProfile") + `?id=${engineer.id}`}>
        <Button size="sm" className="w-full bg-[#1a1a2e] hover:bg-[#2a2a3e] text-white text-xs">
          عرض الملف الكامل
        </Button>
      </Link>
    </div>
  );
}

/* ─── Main Map Component ─── */
export default function EngineersMap({ onClose, engineers: propEngineers }) {
  const [engineers, setEngineers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [nearestId, setNearestId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (propEngineers && propEngineers.length >= 0) {
      // Use engineers passed from parent (already filtered)
      const enriched = propEngineers
        .filter(e => e.latitude != null && e.longitude != null)
        .map(e => ({ ...e, distance_km: 0 }));
      setEngineers(enriched);
      setLoading(false);
    } else {
      loadData();
    }
    detectLocation();
  }, []);

  // Re-load when prop engineers change (e.g., filters applied)
  useEffect(() => {
    if (propEngineers) {
      const enriched = propEngineers
        .filter(e => e.latitude != null && e.longitude != null)
        .map(e => {
          let distance_km = e.distance_km || 0;
          if (userLocation) {
            distance_km = haversineKm(userLocation.lat, userLocation.lng, e.latitude, e.longitude);
          }
          return { ...e, distance_km };
        });
      if (userLocation) {
        enriched.sort((a, b) => a.distance_km - b.distance_km);
        if (enriched.length > 0) setNearestId(enriched[0].id);
      }
      setEngineers(enriched);
    }
  }, [propEngineers]);

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
      const profiles = await base44.entities.Engineer.filter({ status: 'approved' }, '-rating', 100);
      const enriched = profiles
        .filter(e => e.latitude != null && e.longitude != null)
        .map(e => ({ ...e, distance_km: 0 }));
      setEngineers(enriched);
    } catch (e) {
      setError('تعذر تحميل بيانات المهندسين');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Re-compute distances when user location changes
  useEffect(() => {
    if (!userLocation || engineers.length === 0) return;
    const updated = engineers.map(e => ({
      ...e,
      distance_km: haversineKm(userLocation.lat, userLocation.lng, e.latitude, e.longitude)
    }));
    updated.sort((a, b) => a.distance_km - b.distance_km);
    setEngineers(updated);
    if (updated.length > 0) setNearestId(updated[0].id);
  }, [userLocation]);

  const handleSelect = (engineer) => {
    setSelectedId(engineer.id);
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
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-[#C9A66B]" />
          <h2 className="text-lg font-bold text-[#1a1a2e]">خريطة المهندسين حسب الموقع</h2>
          {userLocation && (
            <Badge variant="outline" className="gap-1 text-xs">
              <Navigation className="w-3 h-3" /> موقعك محدد
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">{engineers.length} مهندس</span>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} className="gap-1">
              <X className="w-4 h-4" /> إغلاق
            </Button>
          )}
        </div>
      </div>

      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

      {engineers.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <MapPin className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">لا يوجد مهندسون مسجلون بمواقع جغرافية</p>
          <p className="text-sm mt-1">سيظهر المهندسون هنا بعد تحديد مواقعهم من إعدادات الحساب</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Sidebar */}
          <div className="lg:col-span-1 h-[500px] lg:h-[600px]">
            <EngineerList
              engineers={engineers}
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

              {/* Engineer markers */}
              {engineers.map(e => (
                <Marker
                  key={e.id}
                  position={[e.latitude, e.longitude]}
                  icon={getEngineerIcon(e, nearestId)}
                  eventHandlers={{
                    click: () => setSelectedId(e.id),
                  }}
                >
                  <Popup>
                    <EngineerPopup engineer={e} />
                  </Popup>
                </Marker>
              ))}

              <LocateButton />
            </MapContainer>

            {/* Distance Legend */}
            <div className="absolute top-3 left-3 z-[1000] bg-white/90 backdrop-blur rounded-lg px-3 py-2 shadow text-xs space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-br from-[#1a1a2e] to-[#C9A66B]" />
                <span>مهندس</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-br from-blue-600 to-blue-700" />
                <span>مهندس معتمد</span>
              </div>
              {nearestId && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-br from-[#C9A66B] to-[#e74c3c]" />
                  <span>الأقرب لك</span>
                </div>
              )}
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
      {engineers.length > 0 && userLocation && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
          <Card className="border-[#C9A66B]/20">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <Navigation className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">أقرب مهندس</p>
                <p className="font-bold text-sm text-[#1a1a2e]">
                  {engineers[0]?.full_name || '—'}
                </p>
                <p className="text-xs text-gray-400">{Math.round(engineers[0]?.distance_km * 10) / 10} كم</p>
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
                  {[...engineers].sort((a, b) => (b.rating || 0) - (a.rating || 0))[0]?.full_name || '—'}
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
                <p className="text-xs text-gray-500">المهندسون في نطاق 50 كم</p>
                <p className="font-bold text-sm text-[#1a1a2e]">
                  {engineers.filter(e => e.distance_km <= 50).length} مهندس
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}