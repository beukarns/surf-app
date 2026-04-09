import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { spotsAPI, ratingsAPI, sessionsAPI, favoritesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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

const QUALITY_COLORS = {
  'World Class': '#8b5cf6',
  'Totally Epic': '#8b5cf6',
  'Regional Classic': '#10b981',
  'Normal': '#f59e0b',
  'Sloppy': '#fb923c',
  'Choss': '#ef4444',
};

const makeMarkerIcon = (color, size = 26) => L.divIcon({
  className: 'custom-marker-icon',
  html: `<svg width="${size}" height="${Math.round(size * 1.4)}" viewBox="0 0 30 42" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 0C6.716 0 0 6.716 0 15c0 11.25 15 27 15 27s15-15.75 15-27C30 6.716 23.284 0 15 0z"
          fill="${color}" stroke="#ffffff" stroke-width="2"/>
    <circle cx="15" cy="15" r="5" fill="#ffffff"/>
  </svg>`,
  iconSize: [size, Math.round(size * 1.4)],
  iconAnchor: [size / 2, Math.round(size * 1.4)],
  popupAnchor: [0, -Math.round(size * 1.4)]
});

function SpotDetail() {
  const [spot, setSpot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [ratingStats, setRatingStats] = useState({ average_rating: 0, total_votes: 0, user_rating: null });
  const [hoveredStar, setHoveredStar] = useState(0);
  const [ratingSuccess, setRatingSuccess] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [sessionData, setSessionData] = useState({
    date: new Date().toISOString().split('T')[0],
    time: '',
    rating: 3,
    wave_height: '',
    wind_direction: '',
    tide: '',
    notes: ''
  });
  const [sessionSuccess, setSessionSuccess] = useState(false);
  const [regionSpots, setRegionSpots] = useState([]);
  const navigate = useNavigate();
  const { spotId } = useParams();
  const { user } = useAuth();

  useEffect(() => {
    loadSpot();
    loadRatings();
    if (user) loadFavoriteStatus();
  }, [spotId]);

  const loadSpot = async () => {
    try {
      const response = await spotsAPI.getSpotDetail(spotId);
      const s = response.data;
      setSpot(s);
      // Charger les autres spots de la même région
      if (s.continent && s.country && s.region) {
        spotsAPI.getSpotsByRegion(s.continent, s.country, s.region)
          .then(r => setRegionSpots(r.data.filter(rs => rs.id !== s.id)))
          .catch(() => {});
      }
    } catch (err) {
      setError('Erreur lors du chargement du spot');
    } finally {
      setLoading(false);
    }
  };

  const loadRatings = async () => {
    try {
      const response = await ratingsAPI.getSpotRatings(spotId);
      setRatingStats(response.data);
    } catch (err) {
      console.error('Erreur lors du chargement des notes');
    }
  };

  const loadFavoriteStatus = async () => {
    try {
      const response = await favoritesAPI.getMyFavoriteIds();
      setIsFavorite(response.data.includes(parseInt(spotId)));
    } catch (err) {
      // silently ignore
    }
  };

  const handleToggleFavorite = async () => {
    if (!user) { navigate('/login'); return; }
    setFavLoading(true);
    try {
      const response = await favoritesAPI.toggleFavorite(spotId);
      setIsFavorite(response.data.favorited);
    } catch (err) {
      console.error('Erreur favoris');
    } finally {
      setFavLoading(false);
    }
  };

  const handleRating = async (rating) => {
    try {
      await ratingsAPI.createOrUpdateRating(spotId, rating);
      await loadRatings();
      setRatingSuccess(true);
      setTimeout(() => setRatingSuccess(false), 2000);
    } catch (err) {
      setError('Erreur lors de l\'enregistrement de la note');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  const handleSessionChange = (e) => {
    const { name, value } = e.target;
    setSessionData(prev => ({ ...prev, [name]: value }));
  };

  const handleSessionSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await sessionsAPI.createSession({
        spot_id: parseInt(spotId),
        date: sessionData.date,
        time: sessionData.time || null,
        rating: parseInt(sessionData.rating),
        wave_height: sessionData.wave_height ? parseFloat(sessionData.wave_height) : null,
        wind_direction: sessionData.wind_direction || null,
        tide: sessionData.tide || null,
        notes: sessionData.notes || null
      });

      setSessionSuccess(true);
      setSessionData({
        date: new Date().toISOString().split('T')[0],
        time: '',
        rating: 3,
        wave_height: '',
        wind_direction: '',
        tide: '',
        notes: ''
      });

      setTimeout(() => {
        setSessionSuccess(false);
        setShowSessionForm(false);
      }, 3000);
    } catch (err) {
      setError('Erreur lors de l\'enregistrement de la session');
    }
  };

  if (loading) return <div className="loading">Chargement...</div>;
  if (error && !spot) return <div className="error">{error}</div>;
  if (!spot) return <div className="error">Spot non trouvé</div>;

  const InfoItem = ({ label, value }) => {
    if (!value) return null;
    return (
      <div className="info-item">
        <div className="info-label">{label}</div>
        <div className="info-value">{value}</div>
      </div>
    );
  };

  const ScoreCircle = ({ label, value }) => {
    if (!value) return null;
    const pct = parseFloat(value);
    const color = `hsl(${pct * 120}, 70%, 45%)`;
    const r = 40;
    const circumference = 2 * Math.PI * r;
    return (
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '12px', color: '#0e4d6e' }}>
          {label}
        </div>
        <div style={{ position: 'relative', margin: '0 auto', width: '100px', height: '100px' }}>
          <svg width="100" height="100" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="50" cy="50" r={r} fill="none" stroke="#e2ecf5" strokeWidth="12" />
            <circle
              cx="50" cy="50" r={r}
              fill="none"
              stroke={color}
              strokeWidth="12"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - pct)}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.5s ease' }}
            />
          </svg>
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '18px', fontWeight: 700, color: '#0e4d6e'
          }}>
            {(pct * 100).toFixed(0)}%
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container" style={{ maxWidth: '900px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <button onClick={() => navigate(-1)} className="btn-ghost">← Retour</button>
        <button
          onClick={handleToggleFavorite}
          disabled={favLoading}
          style={{
            background: isFavorite ? '#fee2e2' : 'rgba(255,255,255,0.15)',
            border: isFavorite ? '1.5px solid #fca5a5' : '1.5px solid rgba(255,255,255,0.3)',
            color: isFavorite ? '#ef4444' : 'white',
            borderRadius: '10px',
            padding: '8px 18px',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '15px',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          {isFavorite ? '❤️ Favori' : '🤍 Ajouter aux favoris'}
        </button>
      </div>

      <div className="card">
        {/* Titre */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ marginBottom: '8px', marginTop: 0 }}>{spot.name || spot.region}</h1>
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span
              onClick={() => navigate(`/countries/${encodeURIComponent(spot.continent)}`)}
              style={{ color: '#00b4d8', fontSize: '14px', cursor: 'pointer', fontWeight: 600 }}
              onMouseEnter={e => e.target.style.textDecoration = 'underline'}
              onMouseLeave={e => e.target.style.textDecoration = 'none'}
            >{spot.continent}</span>
            <span style={{ color: '#c8dff0' }}>›</span>
            <span
              onClick={() => navigate(`/regions/${encodeURIComponent(spot.continent)}/${encodeURIComponent(spot.country)}`)}
              style={{ color: '#00b4d8', fontSize: '14px', cursor: 'pointer', fontWeight: 600 }}
              onMouseEnter={e => e.target.style.textDecoration = 'underline'}
              onMouseLeave={e => e.target.style.textDecoration = 'none'}
            >{spot.country}</span>
            <span style={{ color: '#c8dff0' }}>›</span>
            <span
              onClick={() => navigate(`/spots/${encodeURIComponent(spot.continent)}/${encodeURIComponent(spot.country)}/${encodeURIComponent(spot.region)}`)}
              style={{ color: '#00b4d8', fontSize: '14px', cursor: 'pointer', fontWeight: 600 }}
              onMouseEnter={e => e.target.style.textDecoration = 'underline'}
              onMouseLeave={e => e.target.style.textDecoration = 'none'}
            >{spot.region}</span>
          </div>
        </div>

        {error && <div className="error">{error}</div>}

        {/* Carte du spot */}
        {spot.latitude && spot.longitude && (
          <>
            <div style={{
              width: '100%',
              height: '360px',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(0,119,182,0.15)',
              marginBottom: '16px'
            }}>
              <MapContainer
                center={[parseFloat(spot.latitude), parseFloat(spot.longitude)]}
                zoom={13}
                style={{ width: '100%', height: '100%' }}
                scrollWheelZoom={true}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {/* Spot actuel — marker bleu mis en avant */}
                <Marker
                  position={[parseFloat(spot.latitude), parseFloat(spot.longitude)]}
                  icon={makeMarkerIcon('#0077b6', 34)}
                  zIndexOffset={1000}
                >
                  <Popup><strong>{spot.name || spot.region}</strong><br/><span style={{fontSize:'12px',color:'#666'}}>Spot actuel</span></Popup>
                </Marker>
                {/* Autres spots de la même région */}
                {regionSpots.filter(rs => rs.latitude && rs.longitude).map(rs => (
                  <Marker
                    key={rs.id}
                    position={[parseFloat(rs.latitude), parseFloat(rs.longitude)]}
                    icon={makeMarkerIcon(QUALITY_COLORS[rs.wave_quality] || '#9ca3af', 24)}
                  >
                    <Tooltip direction="top" offset={[0, -28]} opacity={0.9}>
                      <strong>{rs.name || rs.region}</strong>
                      {rs.wave_quality && <span> — {rs.wave_quality}</span>}
                    </Tooltip>
                    <Popup>
                      <strong>{rs.name || rs.region}</strong>
                      {rs.wave_quality && <div style={{fontSize:'12px',marginTop:'4px'}}>{rs.wave_quality}</div>}
                      <button
                        onClick={() => navigate(`/spot/${rs.id}`)}
                        style={{marginTop:'8px',padding:'5px 10px',background:'#00b4d8',color:'white',border:'none',borderRadius:'6px',cursor:'pointer',fontSize:'12px',width:'100%'}}
                      >
                        Voir ce spot →
                      </button>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>

            {/* Coordonnées GPS */}
            <div style={{
              background: '#f0f6fc',
              padding: '14px 18px',
              borderRadius: '12px',
              marginBottom: '28px',
              border: '1.5px solid #d6e8f5',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <div>
                <div style={{ fontSize: '12px', color: '#8a9bb0', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Coordonnées GPS
                </div>
                <div style={{ fontSize: '15px', fontWeight: 700, fontFamily: 'monospace', color: '#0e4d6e' }}>
                  {spot.latitude}, {spot.longitude}
                </div>
              </div>
              <button onClick={() => copyToClipboard(`${spot.latitude}, ${spot.longitude}`)} className="btn-secondary" style={{ fontSize: '13px' }}>
                {copySuccess ? '✓ Copié !' : '📋 Copier'}
              </button>
            </div>
          </>
        )}

        {/* Caractéristiques */}
        <h2 style={{ marginBottom: '14px', marginTop: 0 }}>Caractéristiques de la vague</h2>
        <div className="info-grid">
          <InfoItem label="Type" value={spot.type} />
          <InfoItem label="Direction" value={spot.direction} />
          <InfoItem label="Fond" value={spot.bottom} />
          <InfoItem label="Puissance" value={spot.power} />
          <InfoItem label="Qualité" value={spot.wave_quality} />
          <InfoItem label="Fréquence" value={spot.frequency} />
          <InfoItem label="Longueur normale" value={spot.normal_length} />
          <InfoItem label="Longueur good day" value={spot.good_day_length} />
        </div>

        {/* Scores */}
        {(spot.wave_quality_score || spot.frequency_score || spot.experience_needed_score) && (
          <>
            <h2 style={{ marginTop: '28px', marginBottom: '20px' }}>Scores</h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '24px',
              padding: '8px 0'
            }}>
              <ScoreCircle label="Qualité" value={spot.wave_quality_score} />
              <ScoreCircle label="Fréquence" value={spot.frequency_score} />
              <ScoreCircle label="Niveau requis" value={spot.experience_needed_score} />
            </div>
          </>
        )}

        {/* Conditions optimales */}
        <h2 style={{ marginTop: '28px', marginBottom: '14px' }}>Conditions optimales</h2>
        <div className="info-grid">
          <InfoItem label="Houle idéale" value={spot.good_swell_direction} />
          <InfoItem label="Vent idéal" value={spot.good_wind_direction} />
          <InfoItem label="Taille de houle" value={spot.swell_size} />
          {spot.swell_min && <InfoItem label="Houle min (m)" value={spot.swell_min} />}
          {spot.swell_max && <InfoItem label="Houle max (m)" value={spot.swell_max} />}
          <InfoItem label="Marée" value={spot.best_tide_position} />
          <InfoItem label="Mouvement marée" value={spot.best_tide_movement} />
        </div>

        {/* Accès */}
        <h2 style={{ marginTop: '28px', marginBottom: '14px' }}>Accès et fréquentation</h2>
        <div className="info-grid">
          <InfoItem label="Distance" value={spot.distance} />
          <InfoItem label="Temps de marche" value={spot.walk} />
          <InfoItem label="Facile à trouver" value={spot.easy_to_find} />
          <InfoItem label="Accès public" value={spot.public_access} />
          <InfoItem label="Accès spécial" value={spot.special_access} />
          <InfoItem label="Crowd semaine" value={spot.week_crowd} />
          <InfoItem label="Crowd week-end" value={spot.weekend_crowd} />
          <InfoItem label="Niveau requis" value={spot.experience} />
        </div>

        {spot.access_info && (
          <>
            <h2 style={{ marginTop: '28px', marginBottom: '14px' }}>Infos d'accès</h2>
            <div className="info-item">
              <div className="info-value">{spot.access_info}</div>
            </div>
          </>
        )}

        {spot.description && (
          <>
            <h2 style={{ marginTop: '28px', marginBottom: '14px' }}>Description</h2>
            <div className="info-item">
              <div className="info-value">{spot.description}</div>
            </div>
          </>
        )}

        {spot.description_2 && (
          <div className="info-item" style={{ marginTop: '10px' }}>
            <div className="info-value">{spot.description_2}</div>
          </div>
        )}

        {spot.webcam_url && (
          <>
            <h2 style={{ marginTop: '28px', marginBottom: '14px' }}>Webcam</h2>
            <div className="info-item">
              <a href={spot.webcam_url} target="_blank" rel="noopener noreferrer" style={{ color: '#00b4d8', textDecoration: 'none', fontWeight: 600 }}>
                {spot.webcam_url}
              </a>
            </div>
          </>
        )}

        {/* Section notation */}
        <div style={{
          marginTop: '32px',
          padding: '28px',
          background: 'linear-gradient(135deg, #f0f6fc, #e8f4fd)',
          borderRadius: '16px',
          border: '1.5px solid #d6e8f5'
        }}>
          <h2 style={{ marginTop: 0, marginBottom: '20px', textAlign: 'center', color: '#0e4d6e' }}>Notez ce spot</h2>

          {ratingSuccess && (
            <div style={{
              padding: '12px 16px',
              background: '#d1fae5',
              color: '#065f46',
              borderRadius: '10px',
              marginBottom: '16px',
              fontWeight: 700,
              textAlign: 'center'
            }}>
              ✓ Merci pour votre note !
            </div>
          )}

          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '24px',
            marginBottom: '20px',
            flexWrap: 'wrap'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '36px', fontWeight: 800, color: '#0e4d6e', lineHeight: 1 }}>
                {ratingStats.average_rating.toFixed(1)}
              </div>
              <div style={{ fontSize: '13px', color: '#8a9bb0', marginTop: '4px' }}>
                {ratingStats.total_votes} {ratingStats.total_votes > 1 ? 'votes' : 'vote'}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              {[1, 2, 3, 4, 5].map((star) => {
                const isActive = hoveredStar > 0 ? star <= hoveredStar : star <= (ratingStats.user_rating || 0);
                return (
                  <div
                    key={star}
                    onMouseEnter={() => setHoveredStar(star)}
                    onMouseLeave={() => setHoveredStar(0)}
                    onClick={() => handleRating(star)}
                    style={{
                      cursor: 'pointer',
                      fontSize: '36px',
                      color: isActive ? '#f59e0b' : '#d6e8f5',
                      transition: 'all 0.15s ease',
                      transform: hoveredStar === star ? 'scale(1.25)' : 'scale(1)',
                      userSelect: 'none'
                    }}
                  >
                    ★
                  </div>
                );
              })}
            </div>
          </div>

          {ratingStats.user_rating && (
            <div style={{ textAlign: 'center', fontSize: '13px', color: '#8a9bb0', marginBottom: '16px' }}>
              Votre note : {ratingStats.user_rating} étoile{ratingStats.user_rating > 1 ? 's' : ''}
            </div>
          )}

          <div style={{ textAlign: 'center', borderTop: '1.5px solid #d6e8f5', paddingTop: '20px' }}>
            <button
              onClick={() => setShowSessionForm(!showSessionForm)}
              className="btn-primary"
              style={{ minWidth: '200px' }}
            >
              {showSessionForm ? '✕ Fermer' : '📝 Ajouter une session'}
            </button>
          </div>
        </div>

        {/* Formulaire de session */}
        {showSessionForm && (
          <div style={{
            marginTop: '24px',
            padding: '28px',
            background: 'white',
            borderRadius: '16px',
            border: '2px solid #00b4d8'
          }}>
            <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#0e4d6e' }}>Enregistrer une session de surf</h2>

            {sessionSuccess && (
              <div style={{
                padding: '12px 16px',
                background: '#d1fae5',
                color: '#065f46',
                borderRadius: '10px',
                marginBottom: '16px',
                fontWeight: 700,
                textAlign: 'center'
              }}>
                ✓ Session enregistrée avec succès !
              </div>
            )}

            <form onSubmit={handleSessionSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: '#0e4d6e', fontSize: '14px' }}>
                    Date *
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={sessionData.date}
                    onChange={handleSessionChange}
                    required
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #c8dff0', fontSize: '14px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: '#0e4d6e', fontSize: '14px' }}>
                    Heure
                  </label>
                  <input
                    type="time"
                    name="time"
                    value={sessionData.time}
                    onChange={handleSessionChange}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #c8dff0', fontSize: '14px' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: '#0e4d6e', fontSize: '14px' }}>
                  Note de la session *
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setSessionData(prev => ({ ...prev, rating: value }))}
                      style={{
                        flex: 1,
                        padding: '10px',
                        background: sessionData.rating === value ? '#00b4d8' : '#f0f6fc',
                        color: sessionData.rating === value ? 'white' : '#0e4d6e',
                        border: sessionData.rating === value ? '2px solid #00b4d8' : '2px solid #d6e8f5',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: '15px',
                        transition: 'all 0.15s'
                      }}
                    >
                      {value}★
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: '#0e4d6e', fontSize: '14px' }}>
                    Hauteur vagues (m)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    name="wave_height"
                    value={sessionData.wave_height}
                    onChange={handleSessionChange}
                    placeholder="1.5"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #c8dff0', fontSize: '14px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: '#0e4d6e', fontSize: '14px' }}>
                    Direction vent
                  </label>
                  <input
                    type="text"
                    name="wind_direction"
                    value={sessionData.wind_direction}
                    onChange={handleSessionChange}
                    placeholder="N, NE, SW..."
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #c8dff0', fontSize: '14px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: '#0e4d6e', fontSize: '14px' }}>
                    Marée
                  </label>
                  <select
                    name="tide"
                    value={sessionData.tide}
                    onChange={handleSessionChange}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #c8dff0', fontSize: '14px', background: 'white' }}
                  >
                    <option value="">-- Sélectionner --</option>
                    <option value="Basse">Basse</option>
                    <option value="Mi-marée">Mi-marée</option>
                    <option value="Haute">Haute</option>
                    <option value="Montante">Montante</option>
                    <option value="Descendante">Descendante</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: '#0e4d6e', fontSize: '14px' }}>
                  Notes / Commentaires
                </label>
                <textarea
                  name="notes"
                  value={sessionData.notes}
                  onChange={handleSessionChange}
                  rows="4"
                  placeholder="Décrivez votre session, les conditions, vos observations..."
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1.5px solid #c8dff0',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%' }}>
                Enregistrer la session
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default SpotDetail;
