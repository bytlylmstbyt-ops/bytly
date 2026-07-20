import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { MapPin, Loader2, Navigation, CheckCircle2, Compass } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const DEFAULT_CENTER = { lat: 24.7136, lng: 46.6753 }; // Riyadh

export default function LocationPicker({ initialLat, initialLng, initialRadius, onSave, onCancel }) {
  const [lat, setLat] = useState(initialLat || DEFAULT_CENTER.lat);
  const [lng, setLng] = useState(initialLng || DEFAULT_CENTER.lng);
  const [radius, setRadius] = useState(initialRadius || 50);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const circleRef = useRef(null);
  const mapDivRef = useRef(null);

  // Load Google Maps script using API key fetched from backend
  useEffect(() => {
    if (window.google?.maps) { setMapLoaded(true); return; }

    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => setMapLoaded(true));
      if (window.google?.maps) setMapLoaded(true);
      return;
    }

    let cancelled = false;
    base44.functions.invoke('getGoogleMapsApiKey')
      .then(({ api_key }) => {
        if (cancelled || !api_key) return;
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${api_key}&language=ar&region=SA`;
        script.async = true;
        script.defer = true;
        script.onload = () => setMapLoaded(true);
        document.head.appendChild(script);
      })
      .catch((err) => console.error('Failed to load Google Maps API key:', err));

    return () => { cancelled = true; };
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapLoaded || !mapDivRef.current || mapRef.current) return;

    const center = { lat, lng };

    const map = new window.google.maps.Map(mapDivRef.current, {
      center,
      zoom: 12,
      mapTypeControl: false,
      fullscreenControl: false,
      streetViewControl: false,
      styles: [
        { featureType: 'poi', stylers: [{ visibility: 'off' }] },
        { featureType: 'transit', stylers: [{ visibility: 'off' }] }
      ]
    });

    const marker = new window.google.maps.Marker({
      position: center,
      map,
      draggable: true,
      animation: window.google.maps.Animation.DROP,
      icon: {
        url: 'data:image/svg+xml,' + encodeURIComponent(
          `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
            <circle cx="20" cy="16" r="16" fill="#C9A66B" opacity="0.3"/>
            <circle cx="20" cy="16" r="10" fill="#C9A66B" opacity="0.5"/>
            <path d="M20 40c-6-8-13-14-13-22a13 13 0 1126 0c0 8-7 14-13 22z" fill="#6B5D4F"/>
            <circle cx="20" cy="16" r="5" fill="white"/>
          </svg>`
        ),
        scaledSize: new window.google.maps.Size(40, 40),
        anchor: new window.google.maps.Point(20, 40)
      }
    });

    const circle = new window.google.maps.Circle({
      map,
      center,
      radius: radius * 1000,
      fillColor: '#C9A66B',
      fillOpacity: 0.12,
      strokeColor: '#C9A66B',
      strokeWeight: 2,
      strokeOpacity: 0.6,
      editable: false
    });

    // Update position on drag
    marker.addListener('dragend', () => {
      const pos = marker.getPosition();
      const newLat = pos.lat();
      const newLng = pos.lng();
      setLat(newLat);
      setLng(newLng);
      circle.setCenter(pos);
    });

    mapRef.current = map;
    markerRef.current = marker;
    circleRef.current = circle;

    // Add click listener for map
    map.addListener('click', (e) => {
      const pos = e.latLng;
      setLat(pos.lat());
      setLng(pos.lng());
      marker.setPosition(pos);
      circle.setCenter(pos);
    });
  }, [mapLoaded]);

  // Update circle when radius changes
  useEffect(() => {
    if (circleRef.current) {
      circleRef.current.setRadius(radius * 1000);
    }
  }, [radius]);

  // Detect current location
  const detectLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newLat = pos.coords.latitude;
        const newLng = pos.coords.longitude;
        setLat(newLat);
        setLng(newLng);
        if (markerRef.current) {
          const position = new window.google.maps.LatLng(newLat, newLng);
          markerRef.current.setPosition(position);
          circleRef.current.setCenter(position);
          mapRef.current?.panTo(position);
        }
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave({ latitude: lat, longitude: lng, geofencing_radius_km: radius });
    setSaving(false);
  };

  const radiusMarks = [5, 10, 25, 50, 100, 200, 500];
  const nearestMark = radiusMarks.reduce((prev, curr) =>
    Math.abs(curr - radius) < Math.abs(prev - radius) ? curr : prev
  );

  return (
    <div className="space-y-4" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Compass className="w-5 h-5 text-[#C9A66B]" />
          <h3 className="font-bold text-[#4A3F35]">تحديد النطاق الجغرافي</h3>
        </div>
        {lat !== DEFAULT_CENTER.lat && (
          <Badge className="bg-green-100 text-green-700 gap-1">
            <CheckCircle2 className="w-3 h-3" /> تم التحديد
          </Badge>
        )}
      </div>

      <p className="text-sm text-gray-500">
        حدد موقع مكتبك على الخريطة واختر نطاق التغطية الجغرافي. سيساعد هذا العملاء في معرفة مدى قربك من مواقع مشاريعهم.
      </p>

      {/* Map */}
      <div className="relative rounded-xl overflow-hidden border-2 border-[#C9A66B]/30 shadow-lg">
        {!mapLoaded ? (
          <div className="h-[350px] bg-gray-100 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#C9A66B]" />
          </div>
        ) : (
          <div ref={mapDivRef} className="h-[350px] w-full" />
        )}

        {/* Locate me button */}
        <Button
          size="sm"
          variant="outline"
          onClick={detectLocation}
          disabled={locating}
          className="absolute top-3 left-3 bg-white shadow-md gap-1.5 text-xs z-10"
        >
          <Navigation className={`w-3.5 h-3.5 ${locating ? 'animate-pulse' : ''}`} />
          {locating ? 'جارٍ التحديد...' : 'موقعي الحالي'}
        </Button>

        {/* Center marker hint */}
        <div className="absolute bottom-3 right-3 bg-white/90 px-3 py-1.5 rounded-lg text-xs shadow-md z-10">
          <MapPin className="w-3 h-3 inline-block text-[#C9A66B]" /> اسحب العلامة أو اضغط على الخريطة
        </div>
      </div>

      {/* Coordinates display */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500">خط العرض</p>
          <p className="text-sm font-mono font-bold text-[#4A3F35]">{lat.toFixed(6)}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500">خط الطول</p>
          <p className="text-sm font-mono font-bold text-[#4A3F35]">{lng.toFixed(6)}</p>
        </div>
      </div>

      {/* Radius Slider */}
      <div className="bg-[#F5F0E8] border border-[#C9A66B]/20 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-[#4A3F35]">نطاق التغطية</p>
          <Badge className="bg-[#C9A66B] text-white">{radius} كم</Badge>
        </div>
        <Slider
          value={[radius]}
          onValueChange={([val]) => setRadius(val)}
          min={1}
          max={500}
          step={1}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-400">
          {radiusMarks.map(m => (
            <button
              key={m}
              onClick={() => setRadius(m)}
              className={`px-1.5 py-0.5 rounded transition-colors ${Math.abs(radius - m) < 2 ? 'text-[#C9A66B] font-bold' : 'hover:text-gray-600'}`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700 flex items-start gap-2">
        <Compass className="w-4 h-4 mt-0.5 shrink-0" />
        <div>
          <p className="font-medium">كيف يعمل النطاق الجغرافي؟</p>
          <p className="text-xs mt-1 text-blue-600">
            سيظهر ملفك للعملاء الذين تقع مشاريعهم ضمن نطاق {radius} كم من موقعك. توسيع النطاق يزيد فرص ظهورك، وتضييقه يساعدك في التركيز على منطقتك.
          </p>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-2">
        {onCancel && (
          <Button variant="outline" onClick={onCancel} className="flex-1">
            إلغاء
          </Button>
        )}
        <Button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 bg-[#4A3F35] hover:bg-[#3A2F25] text-white gap-2"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
          حفظ الموقع والنطاق
        </Button>
      </div>
    </div>
  );
}