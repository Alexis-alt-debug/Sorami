import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useTravel } from '../context/TravelContext';
import { getCountryInfo } from '../data/countryNames';

export default function GlobeView({ onCountryClick, size }) {
  const globeRef = useRef();
  const [countries, setCountries] = useState({ features: [] });
  const [hovered, setHovered] = useState(null);
  const [GlobeComponent, setGlobeComponent] = useState(null);
  const { getCountryColor, countryStatuses, profile } = useTravel();

  // Load react-globe.gl dynamically (avoids SSR issues)
  useEffect(() => {
    import('react-globe.gl').then(mod => setGlobeComponent(() => mod.default));
  }, []);

  // Load world country polygons once
  useEffect(() => {
    Promise.all([
      fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json').then(r => r.json()),
      import('topojson-client'),
    ]).then(([topoData, { feature }]) => {
      setCountries(feature(topoData, topoData.objects.countries));
    }).catch(console.error);
  }, []);

  // Set up camera & auto-rotate once globe and data are ready
  useEffect(() => {
    if (!globeRef.current || countries.features.length === 0) return;
    globeRef.current.controls().autoRotate = true;
    globeRef.current.controls().autoRotateSpeed = 0.3;
    globeRef.current.pointOfView({ altitude: 2.2 });
  }, [GlobeComponent, countries.features.length]);

  // Re-create the polygon data array whenever statuses or home country change.
  // globe.gl calls polygonCapColor() for every polygon when polygonsData changes,
  // so this is the reliable way to force a color refresh without breaking interactions.
  const polygonsData = useMemo(
    () => countries.features.length ? [...countries.features] : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [countries.features, countryStatuses, profile?.homeCountry, profile?.homeCountryColor]
  );

  const getCapColor = useCallback((feat) => {
    if (feat === hovered) return 'rgba(6,182,212,0.9)';
    return getCountryColor(String(feat.id));
  }, [hovered, getCountryColor]);

  const getLabel = useCallback((feat) => {
    const info = getCountryInfo(feat.id);
    return `<div style="background:rgba(15,23,42,0.95);color:#e2e8f0;padding:5px 10px;border-radius:8px;font-size:13px;font-family:system-ui;border:1px solid #334155;pointer-events:none">${info.name}</div>`;
  }, []);

  const handleHover = useCallback((feat) => {
    setHovered(feat);
    document.body.style.cursor = feat ? 'pointer' : 'default';
  }, []);

  const handleClick = useCallback((feat) => {
    if (!feat) return;
    if (globeRef.current) {
      globeRef.current.controls().autoRotate = false;
    }
    onCountryClick?.(feat);
  }, [onCountryClick]);

  if (!GlobeComponent) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-violet-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-slate-500 text-xs">Loading globe...</p>
        </div>
      </div>
    );
  }

  return (
    <GlobeComponent
      ref={globeRef}
      width={size}
      height={size}
      backgroundColor="rgba(0,0,0,0)"
      globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
      atmosphereColor="rgba(6,182,212,0.25)"
      atmosphereAltitude={0.15}
      polygonsData={polygonsData}
      polygonAltitude={d => d === hovered ? 0.08 : 0.03}
      polygonCapColor={getCapColor}
      polygonSideColor={() => 'rgba(6,182,212,0.08)'}
      polygonStrokeColor={() => 'rgba(255,255,255,0.12)'}
      polygonLabel={getLabel}
      onPolygonHover={handleHover}
      onPolygonClick={handleClick}
    />
  );
}
