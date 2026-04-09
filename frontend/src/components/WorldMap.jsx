import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import { useEffect, useState } from 'react';
import { feature } from 'topojson-client';
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

function WorldMap({ availableContinents, onContinentClick, hoveredContinent, onHover }) {
  const [geoData, setGeoData] = useState(null);

  useEffect(() => {
    // Charger les données géographiques directement en GeoJSON
    fetch('https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson')
      .then(res => res.json())
      .then(data => {
        console.log('GeoJSON chargé:', data);
        console.log('Exemple feature:', data.features[0]);
        console.log('Propriétés:', data.features[0].properties);
        setGeoData(data);
      })
      .catch(err => {
        console.error('Erreur chargement carte:', err);
      });
  }, []);

  const getContinentForCountry = (isoCode, countryName) => {
    // Gérer les cas spéciaux avec des codes ISO invalides
    if (countryName === 'France' || isoCode === 'FRA') return 'Europe';

    for (const [continent, codes] of Object.entries(continentMapping)) {
      if (codes.includes(isoCode)) {
        return continent;
      }
    }
    return null;
  };

  const style = (feature) => {
    const isoCode = feature.properties['ISO3166-1-Alpha-3'];
    const countryName = feature.properties.name;
    const continent = getContinentForCountry(isoCode, countryName);
    const isAvailable = continent && availableContinents.includes(continent);
    const isHovered = continent === hoveredContinent;

    return {
      fillColor: isAvailable ? continentColors[continent] : '#e5e7eb',
      weight: 1,
      opacity: 1,
      color: '#ffffff',
      fillOpacity: isHovered && isAvailable ? 0.8 : isAvailable ? 0.9 : 0.3
    };
  };

  const onEachFeature = (feature, layer) => {
    const isoCode = feature.properties['ISO3166-1-Alpha-3'];
    const countryName = feature.properties.name;
    const continent = getContinentForCountry(isoCode, countryName);
    const isAvailable = continent && availableContinents.includes(continent);

    if (isAvailable) {
      layer.on('mouseover', function() {
        this.getElement().style.cursor = 'pointer';
        onHover(continent);
      });

      layer.on('mouseout', function() {
        this.getElement().style.cursor = '';
        onHover(null);
      });

      layer.on('click', function(e) {
        console.log('🖱️ Click détecté sur:', feature.properties.name, '→', continent);
        e.originalEvent.stopPropagation();
        onContinentClick(continent);
      });
    }
  };

  if (!geoData) {
    return (
      <div style={{
        width: '100%',
        height: '400px',
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

  return (
    <div style={{
      width: '100%',
      height: '400px',
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
    }}>
      <MapContainer
        center={[20, 0]}
        zoom={1.3}
        minZoom={1.3}
        maxZoom={6}
        maxBounds={[[-90, -180], [90, 180]]}
        style={{ width: '100%', height: '100%' }}
        zoomControl={true}
        scrollWheelZoom={false}
      >
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
  );
}

export default WorldMap;
