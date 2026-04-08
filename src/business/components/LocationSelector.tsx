import { useState, useEffect, useRef } from 'react';
import { MapPin, Search, Navigation, AlertCircle, Loader2 } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTheme } from '@/app/context/ThemeContext';

interface LocationSelectorProps {
  onLocationSelected: (location: {
    lat: number;
    lng: number;
    address: string;
    city: string;
    pincode: string;
  }) => void;
  initialLat?: number;
  initialLng?: number;
  initialAddress?: string;
}

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
  address: {
    city?: string;
    postal_code?: string;
  };
}

export function LocationSelector({
  onLocationSelected,
  initialLat = 20.5937,
  initialLng = 78.9629,
  initialAddress = '',
}: LocationSelectorProps) {
  const { isDark } = useTheme();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const marker = useRef<L.Marker | null>(null);

  const [lat, setLat] = useState(initialLat);
  const [lng, setLng] = useState(initialLng);
  const [address, setAddress] = useState(initialAddress);
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'map' | 'search' | 'location'>('map');
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState('');

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const tileUrl = isDark
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

    map.current = L.map(mapContainer.current).setView([lat, lng], 13);

    L.tileLayer(tileUrl, {
      attribution: '© OpenStreetMap contributors © CARTO',
      maxZoom: 19,
    }).addTo(map.current);

    // Add custom marker
    const customIcon = L.divIcon({
      html: `<div style="background: #f97316; color: white; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-size: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">📍</div>`,
      iconSize: [40, 40],
      className: 'custom-marker',
    });

    marker.current = L.marker([lat, lng], { icon: customIcon, draggable: true }).addTo(map.current);

    // Update coordinates when marker is dragged
    marker.current.on('dragend', () => {
      if (marker.current) {
        const newLat = marker.current.getLatLng().lat;
        const newLng = marker.current.getLatLng().lng;
        setLat(newLat);
        setLng(newLng);
        reverseGeocode(newLat, newLng);
      }
    });

    // Update coordinates when map is clicked
    const onMapClick = (e: L.LeafletMouseEvent) => {
      const newLat = e.latlng.lat;
      const newLng = e.latlng.lng;
      setLat(newLat);
      setLng(newLng);
      if (marker.current) {
        marker.current.setLatLng([newLat, newLng]);
      }
      reverseGeocode(newLat, newLng);
    };

    map.current.on('click', onMapClick);

    return () => {
      if (map.current) {
        map.current.off('click', onMapClick);
        map.current.remove();
        map.current = null;
      }
    };
  }, [isDark]);

  // Update marker position when lat/lng change externally
  useEffect(() => {
    if (marker.current) {
      marker.current.setLatLng([lat, lng]);
    }
    if (map.current && Math.abs(lat - initialLat) < 0.1 && Math.abs(lng - initialLng) < 0.1) {
      // Only recenter if location changed significantly
      return;
    }
  }, [lat, lng]);

  // Reverse geocode coordinates to get address
  const reverseGeocode = async (latitude: number, longitude: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
        { headers: { 'User-Agent': 'RedeemRocket/1.0' } }
      );
      const data = await response.json();
      setAddress(data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
      setCity(data.address?.city || data.address?.town || '');
      setPincode(data.address?.postal_code || '');
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
    }
  };

  // Search for addresses
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setSearchLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=5&countrycodes=in`,
        { headers: { 'User-Agent': 'RedeemRocket/1.0' } }
      );
      const results = await response.json();
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Select from search results
  const handleSelectResult = (result: NominatimResult) => {
    const newLat = parseFloat(result.lat);
    const newLng = parseFloat(result.lon);
    setLat(newLat);
    setLng(newLng);
    setAddress(result.display_name);
    setCity(result.address?.city || result.address?.town || '');
    setPincode(result.address?.postal_code || '');
    setSearchResults([]);
    setActiveTab('map');

    if (map.current) {
      map.current.setView([newLat, newLng], 13);
    }
    if (marker.current) {
      marker.current.setLatLng([newLat, newLng]);
    }
  };

  // Get current location
  const handleGetCurrentLocation = () => {
    setGeoLoading(true);
    setGeoError('');

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLat = position.coords.latitude;
          const newLng = position.coords.longitude;
          setLat(newLat);
          setLng(newLng);

          if (map.current) {
            map.current.setView([newLat, newLng], 13);
          }
          if (marker.current) {
            marker.current.setLatLng([newLat, newLng]);
          }

          reverseGeocode(newLat, newLng);
          setActiveTab('map');
          setGeoLoading(false);
        },
        (error) => {
          setGeoError(`Location access denied: ${error.message}`);
          setGeoLoading(false);
        }
      );
    } else {
      setGeoError('Geolocation is not supported by your browser');
      setGeoLoading(false);
    }
  };

  // Confirm location
  const handleConfirm = () => {
    onLocationSelected({
      lat,
      lng,
      address,
      city,
      pincode,
    });
  };

  return (
    <div style={{ background: isDark ? '#0e1530' : '#ffffff', borderRadius: 12, padding: 20, border: `1px solid ${isDark ? '#1c2a55' : '#e8d8cc'}` }}>
      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: isDark ? '#e2e8f0' : '#18100a' }}>
        Select Business Location
      </h3>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, borderBottom: `1px solid ${isDark ? '#1c2a55' : '#e8d8cc'}` }}>
        <button
          onClick={() => setActiveTab('map')}
          style={{
            padding: '8px 12px',
            border: 'none',
            background: 'transparent',
            color: activeTab === 'map' ? '#f97316' : isDark ? '#94a3b8' : '#9a7860',
            borderBottom: activeTab === 'map' ? '2px solid #f97316' : 'none',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: activeTab === 'map' ? 600 : 400,
          }}
        >
          <MapPin style={{ display: 'inline-block', marginRight: 4, width: 16, height: 16 }} />
          Drop Pin
        </button>
        <button
          onClick={() => setActiveTab('search')}
          style={{
            padding: '8px 12px',
            border: 'none',
            background: 'transparent',
            color: activeTab === 'search' ? '#f97316' : isDark ? '#94a3b8' : '#9a7860',
            borderBottom: activeTab === 'search' ? '2px solid #f97316' : 'none',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: activeTab === 'search' ? 600 : 400,
          }}
        >
          <Search style={{ display: 'inline-block', marginRight: 4, width: 16, height: 16 }} />
          Search
        </button>
        <button
          onClick={() => setActiveTab('location')}
          style={{
            padding: '8px 12px',
            border: 'none',
            background: 'transparent',
            color: activeTab === 'location' ? '#f97316' : isDark ? '#94a3b8' : '#9a7860',
            borderBottom: activeTab === 'location' ? '2px solid #f97316' : 'none',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: activeTab === 'location' ? 600 : 400,
          }}
        >
          <Navigation style={{ display: 'inline-block', marginRight: 4, width: 16, height: 16 }} />
          My Location
        </button>
      </div>

      {/* Map Tab */}
      {activeTab === 'map' && (
        <div style={{ marginBottom: 16 }}>
          <div ref={mapContainer} style={{ height: 300, borderRadius: 8, overflow: 'hidden', marginBottom: 12 }} />
          <div style={{ fontSize: 12, color: isDark ? '#94a3b8' : '#9a7860' }}>
            Click or drag the pin to select location
          </div>
        </div>
      )}

      {/* Search Tab */}
      {activeTab === 'search' && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <input
              type="text"
              placeholder="Search for an address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              style={{
                flex: 1,
                padding: '10px 12px',
                borderRadius: 8,
                border: `1px solid ${isDark ? '#1c2a55' : '#e8d8cc'}`,
                background: isDark ? '#162040' : '#fdf6f0',
                color: isDark ? '#e2e8f0' : '#18100a',
                fontSize: 14,
              }}
            />
            <button
              onClick={handleSearch}
              disabled={searchLoading}
              style={{
                padding: '10px 16px',
                background: '#f97316',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                cursor: searchLoading ? 'not-allowed' : 'pointer',
                opacity: searchLoading ? 0.7 : 1,
              }}
            >
              {searchLoading ? <Loader2 style={{ width: 16, height: 16 }} /> : 'Search'}
            </button>
          </div>

          {searchResults.length > 0 && (
            <div style={{ maxHeight: 200, overflowY: 'auto' }}>
              {searchResults.map((result, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectResult(result)}
                  style={{
                    padding: '10px 12px',
                    borderBottom: `1px solid ${isDark ? '#1c2a55' : '#e8d8cc'}`,
                    cursor: 'pointer',
                    fontSize: 13,
                    color: isDark ? '#e2e8f0' : '#18100a',
                    background: 'transparent',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = isDark ? '#162040' : '#fdf6f0';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {result.display_name.split(',').slice(0, 3).join(', ')}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Current Location Tab */}
      {activeTab === 'location' && (
        <div style={{ marginBottom: 16, textAlign: 'center' }}>
          <button
            onClick={handleGetCurrentLocation}
            disabled={geoLoading}
            style={{
              padding: '12px 24px',
              background: '#f97316',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              cursor: geoLoading ? 'not-allowed' : 'pointer',
              fontSize: 14,
              fontWeight: 600,
              opacity: geoLoading ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              margin: '0 auto',
            }}
          >
            {geoLoading && <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} />}
            {geoLoading ? 'Getting Location...' : 'Use My Location'}
          </button>
          {geoError && (
            <div style={{ marginTop: 12, padding: 12, background: '#fee2e2', borderRadius: 8, display: 'flex', gap: 8 }}>
              <AlertCircle style={{ width: 16, height: 16, color: '#dc2626', flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: '#991b1b' }}>{geoError}</span>
            </div>
          )}
        </div>
      )}

      {/* Address Display */}
      <div style={{ marginBottom: 16, padding: 12, background: isDark ? '#162040' : '#fdf6f0', borderRadius: 8 }}>
        <div style={{ fontSize: 12, color: isDark ? '#94a3b8' : '#9a7860', marginBottom: 4 }}>
          Coordinates: {lat.toFixed(4)}, {lng.toFixed(4)}
        </div>
        <div style={{ fontSize: 13, color: isDark ? '#e2e8f0' : '#18100a', marginBottom: 8 }}>
          {address || 'No address found'}
        </div>
        {city && (
          <div style={{ fontSize: 12, color: isDark ? '#94a3b8' : '#9a7860' }}>
            City: {city} {pincode && `| Pincode: ${pincode}`}
          </div>
        )}
      </div>

      {/* Confirm Button */}
      <button
        onClick={handleConfirm}
        style={{
          width: '100%',
          padding: '12px 16px',
          background: '#f97316',
          color: 'white',
          border: 'none',
          borderRadius: 8,
          cursor: 'pointer',
          fontSize: 14,
          fontWeight: 600,
        }}
      >
        Confirm Location
      </button>
    </div>
  );
}
