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
    if (feat === hovered) return 'rgba(196,146,42,0.88)';
    return getCountryColor(String(feat.id));
  }, [hovered, getCountryColor]);

  const getLabel = useCallback((feat) => {
    const info = getCountryInfo(feat.id);
    return `<div style="background:rgba(250,246,239,0.97);color:#2c1a0e;padding:5px 12px;border-radius:8px;font-size:13px;font-family:'Crimson Text',Georgia,serif;border:1.5px solid #d4c4a8;box-shadow:0 2px 8px rgba(44,26,14,0.12);pointer-events:none">${info.name}</div>`;
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 32, height: 32, border: '3px solid rgba(123,110,176,0.3)', borderTopColor: '#7b6eb0', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 8px' }} />
          <p style={{ color: '#a89070', fontSize: 12, margin: 0 }}>Loading globe…</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
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
      globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
      atmosphereColor="rgba(180,160,220,0.5)"
      atmosphereAltitude={0.18}
      polygonsData={polygonsData}
      polygonAltitude={d => d === hovered ? 0.08 : 0.03}
      polygonCapColor={getCapColor}
      polygonSideColor={() => 'rgba(123,110,176,0.15)'}
      polygonStrokeColor={() => 'rgba(255,255,255,0.18)'}
      polygonLabel={getLabel}
      onPolygonHover={handleHover}
      onPolygonClick={handleClick}
    />
  );
}
