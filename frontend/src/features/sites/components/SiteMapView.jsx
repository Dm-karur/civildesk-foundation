import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Search,
  Filter,
  Compass,
  Maximize2,
  Navigation,
  ExternalLink,
  Phone,
  MapPin,
  Building2,
  Briefcase,
  Layers,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Users,
  RotateCcw,
  SlidersHorizontal,
  X,
  Crosshair,
  Globe,
  Satellite,
  Mountain
} from 'lucide-react';

// Distance calculation using Haversine formula (meters / kilometers)
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371e3; // Earth's radius in meters
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLon = (lon2 - lon1) * rad;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceMeters = R * c;

  if (distanceMeters < 1000) {
    return `${Math.round(distanceMeters)} m`;
  }
  return `${(distanceMeters / 1000).toFixed(2)} km`;
}

// Configurable Free / Open-Source Tile Layers (Normal, Satellite, Hybrid, Topo)
const MAP_LAYERS = {
  streets: {
    id: 'streets',
    name: 'Normal Map',
    icon: 'map',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
    maxZoom: 19,
    subdomains: ['a', 'b', 'c'],
  },
  satellite: {
    id: 'satellite',
    name: 'Satellite View',
    icon: 'satellite',
    // High-resolution global satellite imagery provided by ESRI ArcGIS (Free & Open public tile service)
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    maxZoom: 19,
    subdomains: ['server'],
  },
  hybrid: {
    id: 'hybrid',
    name: 'Satellite + Roads',
    icon: 'layers',
    // ESRI Imagery with OpenStreetMap reference overlays
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    overlayUrl: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png',
    attribution: 'Tiles &copy; Esri & CARTO',
    maxZoom: 19,
    subdomains: ['a', 'b', 'c', 'd'],
  },
  terrain: {
    id: 'terrain',
    name: 'Terrain / Topo',
    icon: 'mountain',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, SRTM | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
    maxZoom: 17,
    subdomains: ['a', 'b', 'c'],
  },
};

const MAP_CONFIG = {
  defaultCenter: [11.0168, 76.9558], // Tamil Nadu / Coimbatore default
  defaultZoom: 11,
};

// Custom SVG Markers - Clean, commercial ERP standard
function createCustomMarkerIcon(type, isSelected = false) {
  let bgColor = '#2563EB'; // Site (Blue)
  let ringColor = 'rgba(37, 99, 235, 0.25)';
  let iconSvg = `<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>`; // Site layers/construction icon

  if (type === 'MAIN_BRANCH') {
    bgColor = '#10B981'; // Green
    ringColor = 'rgba(16, 185, 129, 0.3)';
    iconSvg = `<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>`; // HQ Building
  } else if (type === 'BRANCH') {
    bgColor = '#F59E0B'; // Yellow
    ringColor = 'rgba(245, 158, 11, 0.3)';
    iconSvg = `<rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><line x1="9" y1="22" x2="9" y2="22.01"/><line x1="15" y1="22" x2="15" y2="22.01"/><line x1="9" y1="6" x2="9" y2="6.01"/><line x1="15" y1="6" x2="15" y2="6.01"/><line x1="9" y1="10" x2="9" y2="10.01"/><line x1="15" y1="10" x2="15" y2="10.01"/><line x1="9" y1="14" x2="9" y2="14.01"/><line x1="15" y1="14" x2="15" y2="14.01"/><line x1="9" y1="18" x2="9" y2="18.01"/><line x1="15" y1="18" x2="15" y2="18.01"/>`; // Branch office
  }

  const markerSize = isSelected ? 42 : 36;
  const shadowFilter = isSelected ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.35))' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))';

  const html = `
    <div style="position: relative; width: ${markerSize}px; height: ${markerSize}px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: transform 0.2s ease;">
      <div style="position: absolute; inset: -4px; border-radius: 9999px; background: ${ringColor}; ${isSelected ? 'border: 2px solid ' + bgColor + ';' : ''}"></div>
      <div style="width: 100%; height: 100%; border-radius: 9999px; background: ${bgColor}; border: 2.5px solid #ffffff; display: flex; align-items: center; justify-content: center; filter: ${shadowFilter}; color: #ffffff;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          ${iconSvg}
        </svg>
      </div>
    </div>
  `;

  return L.divIcon({
    className: 'civil-custom-marker',
    html: html,
    iconSize: [markerSize, markerSize],
    iconAnchor: [markerSize / 2, markerSize / 2],
    popupAnchor: [0, -markerSize / 2],
  });
}

// User Current Location Marker (Pulse Dot)
function createUserLocationIcon() {
  const html = `
    <div style="position: relative; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center;">
      <div style="position: absolute; width: 36px; height: 36px; border-radius: 50%; background: rgba(59, 130, 246, 0.25); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
      <div style="width: 16px; height: 16px; border-radius: 50%; background: #2563EB; border: 3px solid #FFFFFF; box-shadow: 0 0 8px rgba(37,99,235,0.6);"></div>
    </div>
  `;
  return L.divIcon({
    className: 'civil-user-location-marker',
    html: html,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

export function SiteMapView({ locations = [], isLoading = false, onRefresh }) {
  const navigate = useNavigate();
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersGroupRef = useRef(null);
  const circlesGroupRef = useRef(null);
  const userMarkerRef = useRef(null);

  // Map Layer State: streets (Normal), satellite (Satellite View), hybrid (Satellite + Roads), terrain (Terrain)
  const [currentLayer, setCurrentLayer] = useState('streets');
  const tileLayerRef = useRef(null);
  const overlayLayerRef = useRef(null);

  // States
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL'); // ALL, SITE, BRANCH, MAIN_BRANCH
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [engineerFilter, setEngineerFilter] = useState('ALL');
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [userLocation, setUserLocation] = useState(null); // { lat, lng }
  const [locationError, setLocationError] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Split view on desktop

  // Extract unique engineers & statuses for dropdown filter
  const engineersList = useMemo(() => {
    const set = new Map();
    locations.forEach((loc) => {
      if (loc.site_engineer_id && loc.site_engineer_name) {
        set.set(loc.site_engineer_id, loc.site_engineer_name);
      }
    });
    return Array.from(set.entries()).map(([id, name]) => ({ id, name }));
  }, [locations]);

  const statusesList = useMemo(() => {
    const set = new Set();
    locations.forEach((loc) => {
      if (loc.status_name) set.add(loc.status_name);
    });
    return Array.from(set);
  }, [locations]);

  // Filtered locations
  const filteredLocations = useMemo(() => {
    return locations.filter((loc) => {
      // Type Filter
      if (typeFilter !== 'ALL') {
        if (typeFilter === 'SITE' && loc.location_type !== 'SITE') return false;
        if (typeFilter === 'BRANCH' && (loc.location_type !== 'BRANCH' || loc.is_head_office)) return false;
        if (typeFilter === 'MAIN_BRANCH' && loc.location_type !== 'MAIN_BRANCH') return false;
      }

      // Status Filter
      if (statusFilter !== 'ALL' && loc.status_name !== statusFilter) {
        return false;
      }

      // Site Engineer Filter (Sites only)
      if (engineerFilter !== 'ALL') {
        if (loc.location_type !== 'SITE') return false;
        if (String(loc.site_engineer_id) !== String(engineerFilter)) return false;
      }

      // Search Query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        const matchName = (loc.name || '').toLowerCase().includes(q);
        const matchCode = (loc.code || '').toLowerCase().includes(q);
        const matchClient = (loc.client_name || loc.client || '').toLowerCase().includes(q);
        const matchAddress = (loc.address || '').toLowerCase().includes(q);
        const matchCity = (loc.city || '').toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchClient && !matchAddress && !matchCity) {
          return false;
        }
      }

      return true;
    });
  }, [locations, typeFilter, statusFilter, engineerFilter, searchQuery]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: MAP_CONFIG.defaultCenter,
        zoom: MAP_CONFIG.defaultZoom,
        zoomControl: false,
      });

      // Add Zoom Control on Top-Right
      L.control.zoom({ position: 'topright' }).addTo(map);

      // Add Initial Tile Layer (Normal / Streets)
      const initialLayerConfig = MAP_LAYERS.streets;
      const tileLayer = L.tileLayer(initialLayerConfig.url, {
        attribution: initialLayerConfig.attribution,
        maxZoom: initialLayerConfig.maxZoom,
        subdomains: initialLayerConfig.subdomains,
      }).addTo(map);
      tileLayerRef.current = tileLayer;

      markersGroupRef.current = L.featureGroup().addTo(map);
      circlesGroupRef.current = L.featureGroup().addTo(map);

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Effect: Switch Tile Layers (Normal, Satellite, Hybrid, Terrain)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const layerConfig = MAP_LAYERS[currentLayer] || MAP_LAYERS.streets;

    // Remove previous base tile layer
    if (tileLayerRef.current) {
      tileLayerRef.current.remove();
      tileLayerRef.current = null;
    }

    // Remove previous overlay layer (if any)
    if (overlayLayerRef.current) {
      overlayLayerRef.current.remove();
      overlayLayerRef.current = null;
    }

    // Add new base tile layer
    const newTileLayer = L.tileLayer(layerConfig.url, {
      attribution: layerConfig.attribution,
      maxZoom: layerConfig.maxZoom,
      subdomains: layerConfig.subdomains,
    }).addTo(map);
    tileLayerRef.current = newTileLayer;

    // Bring base tile layer to back so markers & circles remain on top
    if (newTileLayer.bringToBack) {
      newTileLayer.bringToBack();
    }

    // If hybrid view, add road/label overlay on top of satellite
    if (layerConfig.overlayUrl) {
      const overlayLayer = L.tileLayer(layerConfig.overlayUrl, {
        attribution: layerConfig.attribution,
        maxZoom: layerConfig.maxZoom,
        subdomains: layerConfig.subdomains,
        pane: 'overlayPane',
      }).addTo(map);
      overlayLayerRef.current = overlayLayer;
    }
  }, [currentLayer]);

  // Update Markers and Radius Circles whenever filtered locations or selection changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !markersGroupRef.current || !circlesGroupRef.current) return;

    markersGroupRef.current.clearLayers();
    circlesGroupRef.current.clearLayers();

    const bounds = L.latLngBounds([]);

    filteredLocations.forEach((loc) => {
      if (!loc.latitude || !loc.longitude) return;

      const latLng = [Number(loc.latitude), Number(loc.longitude)];
      bounds.extend(latLng);

      const isSelected = selectedLocation && selectedLocation.id === loc.id;
      const markerIcon = createCustomMarkerIcon(loc.location_type, isSelected);

      // Marker
      const marker = L.marker(latLng, { icon: markerIcon });
      marker.on('click', () => {
        setSelectedLocation(loc);
        map.setView(latLng, Math.max(map.getZoom(), 15), { animate: true });
      });

      // Tooltip on Hover
      marker.bindTooltip(`<strong>${loc.name}</strong><br/><span style="font-size:11px;color:#64748B;">${loc.type_label} • ${loc.code}</span>`, {
        direction: 'top',
        offset: [0, -18],
        opacity: 0.95,
      });

      markersGroupRef.current.addLayer(marker);

      // Operating Radius Geofence Circle
      if (loc.radius && Number(loc.radius) > 0) {
        const radiusNum = Number(loc.radius);
        let circleColor = '#2563EB'; // Site
        if (loc.location_type === 'MAIN_BRANCH') circleColor = '#10B981';
        else if (loc.location_type === 'BRANCH') circleColor = '#F59E0B';

        const circle = L.circle(latLng, {
          radius: radiusNum,
          color: circleColor,
          weight: isSelected ? 2 : 1.2,
          opacity: isSelected ? 0.9 : 0.6,
          fillColor: circleColor,
          fillOpacity: isSelected ? 0.14 : 0.07,
          dashArray: loc.location_type === 'SITE' ? '4, 4' : null,
        });

        circle.bindTooltip(`Geofence Radius: ${radiusNum}m`, { sticky: true, className: 'civil-radius-tooltip' });
        circlesGroupRef.current.addLayer(circle);
      }
    });

    // Auto fit bounds if visible markers exist and user hasn't selected an individual site
    if (bounds.isValid() && !selectedLocation) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [filteredLocations, selectedLocation]);

  // Fit All Locations
  const handleFitAll = () => {
    const map = mapInstanceRef.current;
    if (!map || filteredLocations.length === 0) return;

    const bounds = L.latLngBounds([]);
    filteredLocations.forEach((loc) => {
      if (loc.latitude && loc.longitude) {
        bounds.extend([Number(loc.latitude), Number(loc.longitude)]);
      }
    });

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      setSelectedLocation(null);
    }
  };

  // Request & Center Current GPS Location
  const handleMyLocation = () => {
    setLocationError(null);
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });

        const map = mapInstanceRef.current;
        if (map) {
          if (userMarkerRef.current) {
            userMarkerRef.current.remove();
          }

          const uMarker = L.marker([latitude, longitude], {
            icon: createUserLocationIcon(),
            zIndexOffset: 1000,
          }).addTo(map);

          uMarker.bindTooltip('<strong>You are here</strong>', { permanent: false, direction: 'top' });
          userMarkerRef.current = uMarker;

          map.setView([latitude, longitude], 15, { animate: true });
        }
      },
      (error) => {
        let msg = 'Unable to retrieve your location.';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Location permission was denied. Please allow location access in your browser settings.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = 'Location information is unavailable.';
        } else if (error.code === error.TIMEOUT) {
          msg = 'The request to get user location timed out.';
        }
        setLocationError(msg);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Select location from sidebar list
  const handleSelectLocation = (loc) => {
    setSelectedLocation(loc);
    const map = mapInstanceRef.current;
    if (map && loc.latitude && loc.longitude) {
      map.setView([Number(loc.latitude), Number(loc.longitude)], 16, { animate: true });
    }
  };

  // Directions Link
  const getDirectionsUrl = (lat, lng) => {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  };

  return (
    <div className="relative flex flex-col w-full h-[78vh] min-h-[620px] bg-surface rounded-xl border border-border shadow-xs overflow-hidden">
      {/* 1. MAP HEADER BAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-surface border-b border-border z-10">
        {/* Left Title & Subtitle */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-text-primary">Site Map</h2>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-surface-muted text-text-secondary border border-border">
                {filteredLocations.length} Locations
              </span>
            </div>
            <p className="text-xs text-text-muted">
              All company locations, branches, and construction sites
            </p>
          </div>
        </div>

        {/* Center Search Input */}
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-placeholder" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search sites, branches, client, code, address..."
            className="w-full pl-9 pr-8 py-1.5 bg-surface-subtle border border-border rounded-lg text-xs text-text-primary placeholder:text-text-placeholder focus:outline-none focus:border-primary focus:bg-surface transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Right Map Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Layer View Switcher (Normal, Satellite, Hybrid, Terrain) */}
          <div className="relative inline-flex items-center p-0.5 bg-surface-subtle border border-border rounded-lg h-8">
            <button
              type="button"
              onClick={() => setCurrentLayer('streets')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded transition-all h-7 ${
                currentLayer === 'streets'
                  ? 'bg-surface text-primary shadow-xs border border-border/80'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
              title="Normal OpenStreetMap View"
            >
              <Globe className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Normal</span>
            </button>
            <button
              type="button"
              onClick={() => setCurrentLayer('satellite')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded transition-all h-7 ${
                currentLayer === 'satellite'
                  ? 'bg-surface text-primary shadow-xs border border-border/80'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
              title="High-Resolution Satellite Imagery"
            >
              <Satellite className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Satellite</span>
            </button>
            <button
              type="button"
              onClick={() => setCurrentLayer('hybrid')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded transition-all h-7 ${
                currentLayer === 'hybrid'
                  ? 'bg-surface text-primary shadow-xs border border-border/80'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
              title="Satellite View with Road & Location Overlays"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Hybrid</span>
            </button>
            <button
              type="button"
              onClick={() => setCurrentLayer('terrain')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded transition-all h-7 ${
                currentLayer === 'terrain'
                  ? 'bg-surface text-primary shadow-xs border border-border/80'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
              title="Topographic & Elevation Contour View"
            >
              <Mountain className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Terrain</span>
            </button>
          </div>

          <button
            onClick={handleFitAll}
            title="Fit all visible locations in view"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-subtle hover:bg-surface-muted text-text-secondary hover:text-text-primary text-xs font-medium rounded-lg border border-border transition-colors shadow-2xs h-8"
          >
            <Maximize2 className="w-3.5 h-3.5 text-text-muted" />
            <span className="hidden sm:inline">Fit All</span>
          </button>

          <button
            onClick={handleMyLocation}
            title="Locate my position (Device GPS)"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold rounded-lg border border-primary/20 transition-colors shadow-2xs h-8"
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>My Location</span>
          </button>

          {/* Toggle Split-Screen Sidebar button */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="hidden lg:inline-flex items-center gap-1 px-2.5 py-1.5 bg-surface-subtle hover:bg-surface-muted text-text-secondary text-xs rounded-lg border border-border transition-colors h-8"
            title={isSidebarOpen ? 'Collapse list panel' : 'Expand list panel'}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{isSidebarOpen ? 'Hide List' : 'Show List'}</span>
          </button>
        </div>
      </div>

      {/* 2. FILTER & PILL CONTROLS BAR */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 px-4 py-2 bg-surface-subtle/80 border-b border-border text-xs z-10">
        {/* Type Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          <span className="text-text-muted font-medium mr-1 text-[11px] uppercase tracking-wider">Type:</span>
          {[
            { key: 'ALL', label: 'All Locations' },
            { key: 'SITE', label: 'Sites (Blue)' },
            { key: 'BRANCH', label: 'Branches (Yellow)' },
            { key: 'MAIN_BRANCH', label: 'Main Branch (Green)' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setTypeFilter(tab.key)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                typeFilter === tab.key
                  ? 'bg-primary text-white shadow-2xs'
                  : 'bg-surface text-text-secondary hover:text-text-primary border border-border/80'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Dropdowns: Status & Site Engineer */}
        <div className="flex items-center gap-2">
          {statusesList.length > 0 && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2 py-1 bg-surface border border-border rounded-md text-xs text-text-secondary focus:outline-none focus:border-primary"
            >
              <option value="ALL">All Statuses</option>
              {statusesList.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          )}

          {engineersList.length > 0 && (
            <select
              value={engineerFilter}
              onChange={(e) => setEngineerFilter(e.target.value)}
              className="px-2 py-1 bg-surface border border-border rounded-md text-xs text-text-secondary focus:outline-none focus:border-primary max-w-[150px] truncate"
            >
              <option value="ALL">All Engineers</option>
              {engineersList.map((eng) => (
                <option key={eng.id} value={eng.id}>
                  {eng.name}
                </option>
              ))}
            </select>
          )}

          {(typeFilter !== 'ALL' || statusFilter !== 'ALL' || engineerFilter !== 'ALL' || searchQuery) && (
            <button
              onClick={() => {
                setTypeFilter('ALL');
                setStatusFilter('ALL');
                setEngineerFilter('ALL');
                setSearchQuery('');
              }}
              className="inline-flex items-center gap-1 text-text-muted hover:text-primary transition-colors text-[11px] font-medium ml-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Geolocation Notice / Error Banner if any */}
      {locationError && (
        <div className="px-4 py-2 bg-amber-50 text-amber-900 border-b border-amber-200 text-xs flex items-center justify-between z-20">
          <span>{locationError}</span>
          <button onClick={() => setLocationError(null)} className="text-amber-700 hover:text-amber-900 font-bold ml-2">
            ×
          </button>
        </div>
      )}

      {/* 3. MAIN WORKSPACE: SIDEBAR + MAP */}
      <div className="relative flex-1 flex overflow-hidden">
        {/* Optional Desktop Split Sidebar */}
        {isSidebarOpen && (
          <div className="w-80 border-r border-border bg-surface flex flex-col z-10 shrink-0 hidden md:flex">
            <div className="p-3 border-b border-border bg-surface-subtle/50 flex items-center justify-between">
              <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Directory ({filteredLocations.length})
              </span>
              <span className="text-[11px] text-text-muted">Click to center</span>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-border/60">
              {filteredLocations.length === 0 ? (
                <div className="p-6 text-center text-text-muted text-xs">
                  No matching locations found. Try adjusting filters.
                </div>
              ) : (
                filteredLocations.map((loc) => {
                  const isSelected = selectedLocation?.id === loc.id;
                  const distance = userLocation
                    ? calculateHaversineDistance(userLocation.lat, userLocation.lng, loc.latitude, loc.longitude)
                    : null;

                  return (
                    <div
                      key={loc.id}
                      onClick={() => handleSelectLocation(loc)}
                      className={`p-3 text-xs cursor-pointer transition-colors ${
                        isSelected ? 'bg-primary/5 border-l-4 border-l-primary' : 'hover:bg-surface-subtle'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-1.5 font-semibold text-text-primary truncate">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: loc.color || '#2563EB' }}
                          />
                          <span className="truncate">{loc.name}</span>
                        </div>
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-surface-muted text-text-secondary shrink-0 border border-border">
                          {loc.code}
                        </span>
                      </div>

                      <div className="text-[11px] text-text-muted mb-1 truncate">
                        {loc.location_type === 'SITE'
                          ? `Client: ${loc.client_name || loc.client || 'Direct'}`
                          : loc.branch_type || loc.type_label}
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-text-muted">
                        <span className="flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 text-text-placeholder shrink-0" />
                          <span className="truncate">{loc.city || loc.address || 'Tamil Nadu'}</span>
                        </span>
                        {distance && (
                          <span className="text-primary font-medium text-[10px] bg-primary/10 px-1.5 py-0.5 rounded">
                            {distance}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* MAP CANVAS CONTAINER */}
        <div className="relative flex-1 h-full w-full">
          <div ref={mapContainerRef} className="w-full h-full z-0" />

          {/* 4. FLOATING PROFESSIONAL LEGEND (Bottom-Left) */}
          <div className="absolute bottom-4 left-4 bg-surface/95 backdrop-blur-xs border border-border p-3 rounded-lg shadow-md z-[1000] text-xs pointer-events-auto max-w-[210px]">
            <div className="text-[11px] font-bold text-text-primary uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Map Legend</span>
            </div>
            <div className="space-y-1.5 text-text-secondary text-[11px]">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#10B981] border border-white shadow-2xs" />
                <span className="font-medium text-text-primary">Main Branch (HO)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#F59E0B] border border-white shadow-2xs" />
                <span className="font-medium text-text-primary">Branch Office</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#2563EB] border border-white shadow-2xs" />
                <span className="font-medium text-text-primary">Construction Site</span>
              </div>
              <div className="flex items-center gap-2 pt-1 border-t border-border/60">
                <span className="w-3 h-3 rounded-full border-2 border-dashed border-[#2563EB] bg-[#2563EB]/15" />
                <span>Operating Radius / Geofence</span>
              </div>
            </div>
          </div>

          {/* 5. POPUP / SELECTED LOCATION DETAIL CARD (Top-Right / Floating) */}
          {selectedLocation && (
            <div className="absolute top-4 right-4 w-84 max-w-[calc(100vw-32px)] bg-surface border border-border rounded-xl shadow-xl z-[1000] p-4 text-xs animate-in fade-in zoom-in-95 duration-150">
              {/* Card Header */}
              <div className="flex items-start justify-between gap-2 pb-2.5 mb-2.5 border-b border-border">
                <div className="flex items-start gap-2">
                  <div
                    className="w-3 h-3 rounded-full mt-1 shrink-0"
                    style={{ backgroundColor: selectedLocation.color || '#2563EB' }}
                  />
                  <div>
                    <h3 className="font-bold text-sm text-text-primary leading-tight">
                      {selectedLocation.name}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="px-1.5 py-0.2 rounded bg-surface-muted text-[10px] font-semibold text-text-secondary border border-border">
                        {selectedLocation.code}
                      </span>
                      <span className="text-text-muted text-[11px] font-medium">
                        {selectedLocation.type_label}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedLocation(null)}
                  className="text-text-muted hover:text-text-primary p-1 rounded-md hover:bg-surface-subtle"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Card Body by Location Type */}
              <div className="space-y-2 text-text-secondary text-xs">
                {/* Distance if User Position known */}
                {userLocation && (
                  <div className="p-2 rounded-lg bg-primary/5 border border-primary/15 flex items-center justify-between text-primary">
                    <span className="text-[11px] font-medium">Distance from you:</span>
                    <span className="font-bold text-xs">
                      {calculateHaversineDistance(
                        userLocation.lat,
                        userLocation.lng,
                        selectedLocation.latitude,
                        selectedLocation.longitude
                      )}
                    </span>
                  </div>
                )}

                {/* Construction Site Details */}
                {selectedLocation.location_type === 'SITE' && (
                  <>
                    <div className="grid grid-cols-2 gap-2 py-1">
                      <div>
                        <div className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">
                          Client
                        </div>
                        <div className="font-semibold text-text-primary truncate">
                          {selectedLocation.client_name || selectedLocation.client || 'Direct'}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">
                          Status
                        </div>
                        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          {selectedLocation.status_name || 'Active'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 py-1 border-t border-border/50">
                      <div>
                        <div className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">
                          Site Engineer
                        </div>
                        <div className="font-medium text-text-primary truncate">
                          {selectedLocation.site_engineer_name || selectedLocation.site_engineer || 'Unassigned'}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">
                          Today's Attendance
                        </div>
                        <div className="font-bold text-text-primary">
                          {selectedLocation.today_attendance || 0} Workers
                        </div>
                      </div>
                    </div>

                    <div className="py-1 border-t border-border/50">
                      <div className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">
                        Address & Geofence
                      </div>
                      <div className="text-text-secondary text-[11px] truncate">
                        {selectedLocation.address || 'Address registered in system'}
                      </div>
                      {selectedLocation.radius && (
                        <div className="text-[11px] text-primary font-medium mt-0.5">
                          Operating Radius: {selectedLocation.radius} m
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Branch or Main Branch Details */}
                {selectedLocation.location_type !== 'SITE' && (
                  <>
                    <div className="grid grid-cols-2 gap-2 py-1">
                      <div>
                        <div className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">
                          Branch Type
                        </div>
                        <div className="font-semibold text-text-primary">
                          {selectedLocation.branch_type || selectedLocation.type_label}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">
                          Status
                        </div>
                        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Active
                        </span>
                      </div>
                    </div>

                    <div className="py-1 border-t border-border/50">
                      <div className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">
                        Address
                      </div>
                      <div className="text-text-secondary text-[11px]">
                        {selectedLocation.address || 'Main Office, Tamil Nadu'}
                      </div>
                    </div>

                    {selectedLocation.phone && (
                      <div className="flex items-center gap-1.5 text-[11px] text-text-muted">
                        <Phone className="w-3.5 h-3.5 text-text-placeholder" />
                        <span>{selectedLocation.phone}</span>
                      </div>
                    )}

                    {selectedLocation.radius && (
                      <div className="text-[11px] text-amber-700 font-medium pt-1 border-t border-border/50">
                        Operating Radius: {selectedLocation.radius} m
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-border">
                {selectedLocation.location_type === 'SITE' ? (
                  <button
                    onClick={() => navigate(`/sites/${selectedLocation.site_id || selectedLocation.entity_id}`)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-3 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg text-xs transition-colors shadow-2xs"
                  >
                    <span>Open Site</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={() => navigate('/branches')}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-3 bg-secondary hover:bg-secondary/90 text-white font-semibold rounded-lg text-xs transition-colors shadow-2xs"
                  >
                    <span>Open Branch</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}

                <a
                  href={getDirectionsUrl(selectedLocation.latitude, selectedLocation.longitude)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-1 py-1.5 px-2.5 bg-surface-subtle hover:bg-surface-muted text-text-secondary hover:text-text-primary font-medium rounded-lg text-xs border border-border transition-colors"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Directions</span>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
