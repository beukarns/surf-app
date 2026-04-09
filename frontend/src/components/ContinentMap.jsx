import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import { useEffect, useState } from 'react';
import 'leaflet/dist/leaflet.css';

const continentColors = {
  'Africa': '#10b981',
  'Europe': '#3b82f6',
  'Asia': '#f59e0b',
  'North America': '#8b5cf6',
  'Central America': '#ec4899',
  'South America': '#14b8a6',
  'Australia & Pacific': '#ef4444',
  'Middle East': '#f97316'
};

const continentMapping = {
  'Africa': ['DZA', 'AGO', 'BEN', 'BWA', 'BFA', 'BDI', 'CMR', 'CPV', 'CAF', 'TCD', 'COM', 'COG', 'COD', 'CIV', 'DJI', 'EGY', 'GNQ', 'ERI', 'ETH', 'GAB', 'GMB', 'GHA', 'GIN', 'GNB', 'KEN', 'LSO', 'LBR', 'LBY', 'MDG', 'MWI', 'MLI', 'MRT', 'MUS', 'MAR', 'MOZ', 'NAM', 'NER', 'NGA', 'RWA', 'STP', 'SEN', 'SYC', 'SLE', 'SOM', 'ZAF', 'SSD', 'SDN', 'SWZ', 'TZA', 'TGO', 'TUN', 'UGA', 'ZMB', 'ZWE'],
  'Europe': ['ALB', 'AND', 'AUT', 'BLR', 'BEL', 'BIH', 'BGR', 'HRV', 'CYP', 'CZE', 'DNK', 'EST', 'FIN', 'FRA', 'DEU', 'GRC', 'HUN', 'ISL', 'IRL', 'ITA', 'XKX', 'LVA', 'LIE', 'LTU', 'LUX', 'MKD', 'MLT', 'MDA', 'MCO', 'MNE', 'NLD', 'NOR', 'POL', 'PRT', 'ROU', 'SMR', 'SRB', 'SVK', 'SVN', 'ESP', 'SWE', 'CHE', 'UKR', 'GBR', 'VAT'],
  'Asia': ['AFG', 'ARM', 'AZE', 'BHR', 'BGD', 'BTN', 'BRN', 'KHM', 'CHN', 'GEO', 'IND', 'IDN', 'IRN', 'IRQ', 'ISR', 'JPN', 'JOR', 'KAZ', 'KWT', 'KGZ', 'LAO', 'LBN', 'MYS', 'MDV', 'MNG', 'MMR', 'NPL', 'PRK', 'OMN', 'PAK', 'PSE', 'PHL', 'QAT', 'RUS', 'SAU', 'SGP', 'KOR', 'LKA', 'SYR', 'TWN', 'TJK', 'THA', 'TLS', 'TUR', 'TKM', 'ARE', 'UZB', 'VNM', 'YEM'],
  'North America': ['CAN', 'USA', 'GRL'],
  'Central America': ['BLZ', 'CRI', 'SLV', 'GTM', 'HND', 'MEX', 'NIC', 'PAN'],
  'South America': ['ARG', 'BOL', 'BRA', 'CHL', 'COL', 'ECU', 'GUF', 'GUY', 'PRY', 'PER', 'SUR', 'URY', 'VEN'],
  'Australia & Pacific': ['AUS', 'FJI', 'KIR', 'MHL', 'FSM', 'NRU', 'NZL', 'PLW', 'PNG', 'WSM', 'SLB', 'TON', 'TUV', 'VUT'],
  'Middle East': ['BHR', 'IRN', 'IRQ', 'ISR', 'JOR', 'KWT', 'LBN', 'OMN', 'PSE', 'QAT', 'SAU', 'SYR', 'TUR', 'ARE', 'YEM']
};

// Coordonnées de zoom pour chaque continent [lat, lng, zoom]
const continentBounds = {
  'Africa': [[5, 20], 2.8],  // Réduit pour voir Madagascar et les îles
  'Europe': [[55, 15], 3.2],  // Zoom réduit pour voir Portugal, Islande
  'Asia': [[30, 95], 2],  // Zoom très réduit pour voir toute l'Asie de l'Inde au Japon et Indonésie
  'North America': [[50, -100], 2.8],  // Réduit pour voir Alaska et Groenland
  'Central America': [[15, -85], 4.5],  // Légèrement réduit
  'South America': [[-15, -60], 3.2],  // Réduit pour voir toute la région
  'Australia & Pacific': [[-15, 145], 3.2],  // Latitude et zoom ajustés pour les îles du Pacifique
  'Middle East': [[27, 45], 4.5]  // Légèrement réduit
};

// Mapping ISO3 vers nom de pays (pour afficher le nom)
const countryNames = {
  'FRA': 'France', 'ESP': 'Spain', 'PRT': 'Portugal', 'GBR': 'UK', 'IRL': 'Ireland',
  'DEU': 'Germany', 'ITA': 'Italy', 'NLD': 'Netherlands', 'BEL': 'Belgium', 'CHE': 'Switzerland',
  'AUT': 'Austria', 'NOR': 'Norway', 'SWE': 'Sweden', 'FIN': 'Finland', 'DNK': 'Denmark',
  'ISL': 'Iceland', 'POL': 'Poland', 'UKR': 'Ukraine', 'RUS': 'Russia', 'USA': 'United States',
  'CAN': 'Canada', 'MEX': 'Mexico', 'BRA': 'Brazil', 'ARG': 'Argentina', 'CHL': 'Chile',
  'PER': 'Peru', 'COL': 'Colombia', 'VEN': 'Venezuela', 'ECU': 'Ecuador', 'URY': 'Uruguay',
  'CRI': 'Costa Rica', 'PAN': 'Panama', 'NIC': 'Nicaragua', 'HND': 'Honduras', 'GTM': 'Guatemala',
  'SLV': 'El Salvador', 'BLZ': 'Belize', 'MAR': 'Morocco', 'DZA': 'Algeria', 'TUN': 'Tunisia',
  'EGY': 'Egypt', 'ZAF': 'South Africa', 'GHA': 'Ghana', 'SEN': 'Senegal', 'NGA': 'Nigeria',
  'KEN': 'Kenya', 'MDG': 'Madagascar', 'MOZ': 'Mozambique', 'NAM': 'Namibia', 'CHN': 'China',
  'JPN': 'Japan', 'IDN': 'Indonesia', 'THA': 'Thailand', 'VNM': 'Vietnam', 'MYS': 'Malaysia',
  'PHL': 'Philippines', 'IND': 'India', 'LKA': 'Sri Lanka', 'MDV': 'Maldives', 'SGP': 'Singapore',
  'TWN': 'Taiwan', 'KOR': 'South Korea', 'PRK': 'North Korea', 'PAK': 'Pakistan', 'BGD': 'Bangladesh',
  'MMR': 'Burma', 'KHM': 'Cambodia', 'BRN': 'Brunei', 'TLS': 'East Timor', 'AUS': 'Australia',
  'NZL': 'New Zealand', 'FJI': 'Fiji', 'TUR': 'Turkey', 'ISR': 'Israel', 'LBN': 'Lebanon',
  'SYR': 'Syria', 'IRN': 'Iran', 'SAU': 'Saudi Arabia', 'ARE': 'United Arab Emirates',
  'OMN': 'Oman', 'YEM': 'Yemen', 'QAT': 'Qatar', 'KWT': 'Kuwait'
};

// Composant pour gérer le zoom initial de la carte
function MapController({ continent }) {
  const map = useMap();

  useEffect(() => {
    if (continent && continentBounds[continent]) {
      const [center, zoom] = continentBounds[continent];
      map.setView(center, zoom);
    }
  }, [continent, map]);

  return null;
}

function ContinentMap({ continent, availableCountries, onCountryClick }) {
  const [geoData, setGeoData] = useState(null);
  const [hoveredCountry, setHoveredCountry] = useState(null);

  useEffect(() => {
    // Charger les données géographiques
    fetch('https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson')
      .then(res => res.json())
      .then(data => {
        setGeoData(data);
      })
      .catch(err => {
        console.error('Erreur chargement carte:', err);
      });
  }, []);

  const getContinentForCountry = (isoCode, countryName) => {
    // Gérer les cas spéciaux
    if (countryName === 'France' || isoCode === 'FRA') return 'Europe';

    for (const [cont, codes] of Object.entries(continentMapping)) {
      if (codes.includes(isoCode)) {
        return cont;
      }
    }
    return null;
  };

  const getCountryNameFromISO = (isoCode, geoName) => {
    return countryNames[isoCode] || geoName;
  };

  const style = (feature) => {
    const isoCode = feature.properties['ISO3166-1-Alpha-3'];
    const countryName = feature.properties.name;
    const featureContinent = getContinentForCountry(isoCode, countryName);

    // Vérifier si ce pays appartient au continent actuel
    const belongsToContinent = featureContinent === continent;

    if (!belongsToContinent) {
      // Pays d'autres continents: gris très clair
      return {
        fillColor: '#f5f5f5',
        weight: 0.5,
        opacity: 0.3,
        color: '#cccccc',
        fillOpacity: 0.2
      };
    }

    // Pays du continent actuel
    const displayName = getCountryNameFromISO(isoCode, countryName);
    const isAvailable = availableCountries.includes(displayName);
    const isHovered = hoveredCountry === displayName;

    return {
      fillColor: isAvailable ? continentColors[continent] : '#e5e7eb',
      weight: 1,
      opacity: 1,
      color: '#ffffff',
      fillOpacity: isHovered && isAvailable ? 0.8 : isAvailable ? 0.9 : 0.4
    };
  };

  const onEachFeature = (feature, layer) => {
    const isoCode = feature.properties['ISO3166-1-Alpha-3'];
    const countryName = feature.properties.name;
    const featureContinent = getContinentForCountry(isoCode, countryName);

    // Seulement pour les pays du continent actuel
    if (featureContinent === continent) {
      const displayName = getCountryNameFromISO(isoCode, countryName);
      const isAvailable = availableCountries.includes(displayName);

      if (isAvailable) {
        layer.on('mouseover', function() {
          this.getElement().style.cursor = 'pointer';
          setHoveredCountry(displayName);
        });

        layer.on('mouseout', function() {
          this.getElement().style.cursor = '';
          setHoveredCountry(null);
        });

        layer.on('click', function(e) {
          console.log('🗺️ Pays cliqué:', displayName);
          e.originalEvent.stopPropagation();
          onCountryClick(displayName);
        });
      }
    }
  };

  if (!geoData) {
    return (
      <div style={{
        width: '100%',
        height: '500px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#e0f2fe',
        borderRadius: '12px'
      }}>
        <div>Chargement de la carte...</div>
      </div>
    );
  }

  const [center, zoom] = continentBounds[continent] || [[20, 0], 2];

  return (
    <div style={{ position: 'relative' }}>
      {/* Affichage du pays survolé */}
      {hoveredCountry && (
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          zIndex: 1000,
          padding: '10px 20px',
          background: 'rgba(255,255,255,0.95)',
          borderRadius: '8px',
          fontWeight: 'bold',
          color: '#1e40af',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}>
          {hoveredCountry}
        </div>
      )}

      <div style={{
        width: '100%',
        height: '500px',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <MapContainer
          center={center}
          zoom={zoom}
          minZoom={2}
          maxZoom={8}
          style={{ width: '100%', height: '100%' }}
          zoomControl={true}
          scrollWheelZoom={true}
        >
          <MapController continent={continent} />
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
          <GeoJSON
            key={JSON.stringify(geoData)}
            data={geoData}
            style={style}
            onEachFeature={onEachFeature}
          />
        </MapContainer>
      </div>
    </div>
  );
}

export default ContinentMap;
