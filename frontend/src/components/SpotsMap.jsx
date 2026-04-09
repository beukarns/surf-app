import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap } from 'react-leaflet';
import { useEffect, useState, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix pour les icônes de marker par défaut de Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Fonction pour créer des icônes colorées selon la qualité
const getMarkerIcon = (quality) => {
  const colorMap = {
    'World Class': '#9333ea',        // Violet (arc-en-ciel simulé)
    'Totally Epic': '#9333ea',       // Violet
    'Regional Classic': '#10b981',   // Vert
    'Normal': '#fbbf24',             // Jaune
    'Sloppy': '#fb923c',             // Orange
    'Choss': '#ef4444'               // Rouge
  };

  const color = colorMap[quality] || '#9ca3af';

  // Pour World Class et Totally Epic, utiliser un dégradé arc-en-ciel
  const isRainbow = quality === 'World Class' || quality === 'Totally Epic';

  // Créer un marqueur personnalisé avec SVG
  const markerHtml = isRainbow ? `
    <svg width="30" height="42" viewBox="0 0 30 42" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="rainbow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#ef4444;stop-opacity:1" />
          <stop offset="20%" style="stop-color:#f97316;stop-opacity:1" />
          <stop offset="40%" style="stop-color:#fbbf24;stop-opacity:1" />
          <stop offset="60%" style="stop-color:#10b981;stop-opacity:1" />
          <stop offset="80%" style="stop-color:#3b82f6;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#8b5cf6;stop-opacity:1" />
        </linearGradient>
      </defs>
      <path d="M15 0C6.716 0 0 6.716 0 15c0 11.25 15 27 15 27s15-15.75 15-27C30 6.716 23.284 0 15 0z"
            fill="url(#rainbow)"
            stroke="#ffffff"
            stroke-width="2"/>
      <circle cx="15" cy="15" r="5" fill="#ffffff"/>
    </svg>
  ` : `
    <svg width="30" height="42" viewBox="0 0 30 42" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 0C6.716 0 0 6.716 0 15c0 11.25 15 27 15 27s15-15.75 15-27C30 6.716 23.284 0 15 0z"
            fill="${color}"
            stroke="#ffffff"
            stroke-width="2"/>
      <circle cx="15" cy="15" r="5" fill="#ffffff"/>
    </svg>
  `;

  return L.divIcon({
    className: 'custom-marker-icon',
    html: markerHtml,
    iconSize: [30, 42],
    iconAnchor: [15, 42],
    popupAnchor: [0, -42]
  });
};

// Composant pour ajuster automatiquement les bounds de la carte
function FitBounds({ spots }) {
  const map = useMap();

  useEffect(() => {
    if (spots.length > 0) {
      // Créer un tableau de coordonnées [lat, lng]
      const coordinates = spots.map(spot => [
        parseFloat(spot.latitude),
        parseFloat(spot.longitude)
      ]);

      // Créer les bounds à partir des coordonnées
      const bounds = L.latLngBounds(coordinates);

      // Ajuster la carte pour afficher tous les markers avec un padding
      map.fitBounds(bounds, {
        padding: [50, 50], // Ajoute 50px de marge autour des markers
        maxZoom: 14 // Limite le zoom maximum pour éviter d'être trop proche
      });
    }
  }, [spots, map]);

  return null;
}

function SpotsMap({ spots, onSpotClick }) {
  const spotsWithCoordinates = spots.filter(spot => spot.latitude && spot.longitude);

  // Calcul du centre par défaut (sera remplacé par fitBounds)
  const defaultCenter = spotsWithCoordinates.length > 0
    ? [
        spotsWithCoordinates.reduce((sum, s) => sum + parseFloat(s.latitude), 0) / spotsWithCoordinates.length,
        spotsWithCoordinates.reduce((sum, s) => sum + parseFloat(s.longitude), 0) / spotsWithCoordinates.length
      ]
    : [46.5, -2.0];

  if (spotsWithCoordinates.length === 0) {
    return (
      <div style={{
        width: '100%',
        height: '400px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f3f4f6',
        borderRadius: '12px',
        color: '#6b7280'
      }}>
        Aucun spot avec coordonnées GPS disponible
      </div>
    );
  }

  return (
    <div style={{
      width: '100%',
      height: '400px',
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      marginBottom: '30px'
    }}>
      <MapContainer
        center={defaultCenter}
        zoom={10}
        style={{ width: '100%', height: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* Composant pour ajuster automatiquement le zoom */}
        <FitBounds spots={spotsWithCoordinates} />

        {spotsWithCoordinates.map((spot) => (
          <Marker
            key={spot.id}
            position={[parseFloat(spot.latitude), parseFloat(spot.longitude)]}
            icon={getMarkerIcon(spot.wave_quality)}
            eventHandlers={{
              click: () => {
                if (onSpotClick) {
                  onSpotClick(spot.id);
                }
              }
            }}
          >
            {/* Tooltip au survol */}
            <Tooltip direction="top" offset={[0, -35]} opacity={0.9}>
              <strong>{spot.name || spot.region}</strong>
            </Tooltip>

            <Popup>
              <div style={{ minWidth: '200px' }}>
                <strong style={{ fontSize: '16px', display: 'block', marginBottom: '8px' }}>
                  {spot.name || spot.region}
                </strong>

                {spot.wave_quality && (
                  <div style={{
                    background: (() => {
                      const qualityMap = {
                        'World Class': 'linear-gradient(90deg, #ef4444, #f97316, #fbbf24, #10b981, #3b82f6, #8b5cf6)',
                        'Totally Epic': 'linear-gradient(90deg, #ef4444, #f97316, #fbbf24, #10b981, #3b82f6, #8b5cf6)',
                        'Regional Classic': '#10b981',
                        'Normal': '#fbbf24',
                        'Sloppy': '#fb923c',
                        'Choss': '#ef4444'
                      };
                      return qualityMap[spot.wave_quality] || '#9ca3af';
                    })(),
                    color: 'white',
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    display: 'inline-block',
                    marginBottom: '8px'
                  }}>
                    {spot.wave_quality}
                  </div>
                )}

                <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
                  {spot.type && <div>Type: {spot.type}</div>}
                  {(spot.swell_min || spot.swell_max) && (
                    <div>Houle: {spot.swell_min || '?'}m - {spot.swell_max || '?'}m</div>
                  )}
                  {spot.experience_needed_score && (
                    <div>
                      Niveau: {spot.experience_needed_score > 0.7 ? 'Expert' : spot.experience_needed_score > 0.4 ? 'Intermédiaire' : 'Tous niveaux'}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => onSpotClick && onSpotClick(spot.id)}
                  style={{
                    marginTop: '10px',
                    padding: '6px 12px',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    width: '100%'
                  }}
                >
                  Voir les détails
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

export default SpotsMap;
