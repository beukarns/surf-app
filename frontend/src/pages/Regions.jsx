import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { spotsAPI } from '../services/api';
import SpotsMap from '../components/SpotsMap';

const QUALITY_COLORS = {
  'World Class': '#8b5cf6',
  'Totally Epic': '#8b5cf6',
  'Regional Classic': '#10b981',
  'Normal': '#f59e0b',
  'Sloppy': '#fb923c',
  'Choss': '#ef4444',
};

function Regions() {
  const [spots, setSpots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openRegions, setOpenRegions] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { continent, country } = useParams();

  useEffect(() => {
    loadSpots();
  }, [continent, country]);

  const loadSpots = async () => {
    try {
      const response = await spotsAPI.getSpotsByCountry(continent, country);
      setSpots(response.data);
      // Ouvrir toutes les régions par défaut si peu nombreuses
      const regions = [...new Set(response.data.map(s => s.region))];
      const initial = {};
      regions.forEach((r, i) => { initial[r] = i < 5; }); // ouvrir les 5 premières
      setOpenRegions(initial);
    } catch (err) {
      setError('Erreur lors du chargement des spots');
    } finally {
      setLoading(false);
    }
  };

  // Grouper par région
  const grouped = useMemo(() => {
    const filtered = searchQuery
      ? spots.filter(s => (s.name || s.region || '').toLowerCase().includes(searchQuery.toLowerCase()))
      : spots;

    const map = {};
    filtered.forEach(spot => {
      const r = spot.region || 'Sans région';
      if (!map[r]) map[r] = [];
      map[r].push(spot);
    });

    // Trier les régions par nombre de spots décroissant
    return Object.entries(map).sort((a, b) => b[1].length - a[1].length);
  }, [spots, searchQuery]);

  const allSpots = useMemo(() => spots, [spots]);
  const totalSpots = spots.length;
  const totalRegions = [...new Set(spots.map(s => s.region))].length;

  const toggleRegion = (region) => {
    setOpenRegions(prev => ({ ...prev, [region]: !prev[region] }));
  };

  const toggleAll = (open) => {
    const next = {};
    grouped.forEach(([r]) => { next[r] = open; });
    setOpenRegions(next);
  };

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div className="container" style={{ maxWidth: '900px' }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <button onClick={() => navigate(`/countries/${encodeURIComponent(continent)}`)} className="btn-ghost">
          ← Retour
        </button>
        <span style={{ color: 'white', fontWeight: 600, fontSize: '16px' }}>
          {continent} › {country}
        </span>
      </div>

      <div className="card">
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ marginTop: 0, marginBottom: '6px' }}>{country}</h1>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <span style={{ background: '#e0f2fe', color: '#0077b6', padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 700 }}>
              🌊 {totalSpots} spots
            </span>
            <span style={{ background: '#f0fdf4', color: '#166534', padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 700 }}>
              📍 {totalRegions} régions
            </span>
          </div>
        </div>

        {error && <div className="error">{error}</div>}

        {/* Carte de tous les spots */}
        {allSpots.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <SpotsMap
              spots={allSpots}
              onSpotClick={(spotId) => navigate(`/spot/${spotId}`)}
            />
          </div>
        )}

        {/* Barre recherche + contrôles */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="🔍 Rechercher un spot..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: '1 1 200px',
              padding: '9px 14px',
              borderRadius: '8px',
              border: '1.5px solid #c8dff0',
              fontSize: '14px',
              color: '#0e4d6e',
              outline: 'none'
            }}
          />
          <button
            onClick={() => toggleAll(true)}
            className="btn-ghost"
            style={{ fontSize: '13px', padding: '8px 14px' }}
          >
            Tout ouvrir
          </button>
          <button
            onClick={() => toggleAll(false)}
            className="btn-ghost"
            style={{ fontSize: '13px', padding: '8px 14px' }}
          >
            Tout fermer
          </button>
        </div>

        {/* Régions en accordéon */}
        {grouped.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#8a9bb0' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🌊</div>
            <p>Aucun spot ne correspond à votre recherche</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {grouped.map(([region, regionSpots]) => {
              const isOpen = openRegions[region];
              const bestSpot = regionSpots[0];
              const qualities = [...new Set(regionSpots.map(s => s.wave_quality).filter(Boolean))];
              const hasWorldClass = qualities.some(q => q === 'World Class' || q === 'Totally Epic');

              return (
                <div
                  key={region}
                  style={{
                    border: '1.5px solid #d6e8f5',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    transition: 'all 0.2s'
                  }}
                >
                  {/* En-tête région — cliquable */}
                  <div
                    onClick={() => toggleRegion(region)}
                    style={{
                      padding: '14px 18px',
                      background: isOpen ? 'linear-gradient(135deg, #e0f2fe, #f0f9ff)' : '#f8fbff',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '12px',
                      userSelect: 'none',
                      transition: 'background 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                      <span style={{
                        fontSize: '18px',
                        transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s',
                        color: '#00b4d8',
                        flexShrink: 0
                      }}>›</span>
                      <div>
                        <div style={{ fontWeight: 700, color: '#0e4d6e', fontSize: '15px' }}>
                          {region}
                          {hasWorldClass && (
                            <span style={{ marginLeft: '8px', fontSize: '11px', background: '#8b5cf6', color: 'white', padding: '2px 8px', borderRadius: '10px', verticalAlign: 'middle' }}>
                              ★ World Class
                            </span>
                          )}
                        </div>
                        {!isOpen && qualities.length > 0 && (
                          <div style={{ fontSize: '12px', color: '#8a9bb0', marginTop: '2px' }}>
                            {qualities.slice(0, 3).join(' • ')}
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      <span style={{
                        background: '#e0f2fe',
                        color: '#0077b6',
                        padding: '3px 10px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 700
                      }}>
                        {regionSpots.length} spot{regionSpots.length > 1 ? 's' : ''}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/spots/${encodeURIComponent(continent)}/${encodeURIComponent(country)}/${encodeURIComponent(region)}`);
                        }}
                        className="btn-secondary"
                        style={{ fontSize: '12px', padding: '5px 12px' }}
                      >
                        Voir tout →
                      </button>
                    </div>
                  </div>

                  {/* Liste des spots */}
                  {isOpen && (
                    <div style={{ background: 'white' }}>
                      {regionSpots.map((spot, idx) => {
                        const score = spot.experience_needed_score ? parseFloat(spot.experience_needed_score) : null;
                        const level = score === null ? null : score > 0.7 ? 'Expert' : score > 0.4 ? 'Intermédiaire' : 'Débutant';
                        const levelColor = level === 'Expert' ? '#ef4444' : level === 'Intermédiaire' ? '#f59e0b' : '#10b981';

                        return (
                          <div
                            key={spot.id}
                            onClick={() => navigate(`/spot/${spot.id}`)}
                            style={{
                              padding: '12px 18px',
                              borderTop: idx === 0 ? '1.5px solid #e2ecf5' : '1px solid #f0f6fc',
                              cursor: 'pointer',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              gap: '12px',
                              transition: 'background 0.15s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = '#f8fbff'}
                            onMouseLeave={e => e.currentTarget.style.background = 'white'}
                          >
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 600, color: '#0e4d6e', fontSize: '14px' }}>
                                {spot.name || spot.region}
                              </div>
                              {(spot.type || spot.swell_min || spot.swell_max) && (
                                <div style={{ fontSize: '12px', color: '#8a9bb0', marginTop: '2px' }}>
                                  {[
                                    spot.type,
                                    (spot.swell_min || spot.swell_max) ? `Houle: ${spot.swell_min || '?'}–${spot.swell_max || '?'}m` : null
                                  ].filter(Boolean).join(' • ')}
                                </div>
                              )}
                            </div>
                            <div style={{ display: 'flex', gap: '5px', flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                              {level && (
                                <span style={{
                                  background: levelColor, color: 'white',
                                  padding: '2px 8px', borderRadius: '20px',
                                  fontSize: '11px', fontWeight: 700
                                }}>
                                  {level}
                                </span>
                              )}
                              {spot.wave_quality && (
                                <span style={{
                                  background: QUALITY_COLORS[spot.wave_quality] || '#9ca3af',
                                  color: 'white',
                                  padding: '2px 8px', borderRadius: '20px',
                                  fontSize: '11px', fontWeight: 700
                                }}>
                                  {spot.wave_quality}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Regions;
