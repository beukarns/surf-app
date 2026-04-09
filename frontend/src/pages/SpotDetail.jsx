import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { spotsAPI, ratingsAPI, sessionsAPI, favoritesAPI, mediaAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon, shadowUrl: iconShadow,
  iconSize: [25, 41], iconAnchor: [12, 41],
  popupAnchor: [1, -34], shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const QUALITY_COLORS = {
  'World Class': '#8b5cf6', 'Totally Epic': '#8b5cf6',
  'Regional Classic': '#10b981', 'Normal': '#f59e0b',
  'Sloppy': '#fb923c', 'Choss': '#ef4444',
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

const TAB_STYLE = (active) => ({
  background: 'none', border: 'none',
  padding: '10px 18px', fontSize: '14px', fontWeight: 700,
  color: active ? '#00b4d8' : '#8a9bb0',
  borderBottom: active ? '2px solid #00b4d8' : '2px solid transparent',
  marginBottom: '-2px', cursor: 'pointer', borderRadius: 0, width: 'auto',
  transition: 'all 0.2s',
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
  const [regionSpots, setRegionSpots] = useState([]);
  const [activeTab, setActiveTab] = useState('wave');
  const [media, setMedia] = useState([]);
  const [mediaUploading, setMediaUploading] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [youtubeTitle, setYoutubeTitle] = useState('');
  const [mediaError, setMediaError] = useState('');
  const [sessionData, setSessionData] = useState({
    date: new Date().toISOString().split('T')[0],
    time: '', rating: 3, wave_height: '', wind_direction: '', tide: '', notes: ''
  });
  const [sessionSuccess, setSessionSuccess] = useState(false);
  const navigate = useNavigate();
  const { spotId } = useParams();
  const { user } = useAuth();

  useEffect(() => {
    setActiveTab('wave');
    loadSpot();
    loadRatings();
    loadMedia();
    if (user) loadFavoriteStatus();
  }, [spotId]);

  const loadSpot = async () => {
    try {
      const response = await spotsAPI.getSpotDetail(spotId);
      const s = response.data;
      setSpot(s);
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
      const r = await ratingsAPI.getSpotRatings(spotId);
      setRatingStats(r.data);
    } catch {}
  };

  const loadMedia = async () => {
    try {
      const r = await mediaAPI.getSpotMedia(spotId);
      setMedia(r.data);
    } catch {}
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setMediaUploading(true);
    setMediaError('');
    try {
      await mediaAPI.uploadFile(spotId, file, null);
      await loadMedia();
    } catch (err) {
      setMediaError(err.response?.data?.detail || 'Erreur lors de l\'upload');
    } finally {
      setMediaUploading(false);
      e.target.value = '';
    }
  };

  const handleAddYoutube = async (e) => {
    e.preventDefault();
    if (!youtubeUrl) return;
    setMediaUploading(true);
    setMediaError('');
    try {
      await mediaAPI.addYoutube(spotId, youtubeUrl, youtubeTitle || null);
      await loadMedia();
      setYoutubeUrl('');
      setYoutubeTitle('');
    } catch (err) {
      setMediaError(err.response?.data?.detail || 'URL YouTube invalide');
    } finally {
      setMediaUploading(false);
    }
  };

  const handleDeleteMedia = async (mediaId) => {
    try {
      await mediaAPI.deleteMedia(mediaId);
      setMedia(prev => prev.filter(m => m.id !== mediaId));
    } catch {}
  };

  const loadFavoriteStatus = async () => {
    try {
      const r = await favoritesAPI.getMyFavoriteIds();
      setIsFavorite(r.data.includes(parseInt(spotId)));
    } catch {}
  };

  const handleToggleFavorite = async () => {
    if (!user) { navigate('/login'); return; }
    setFavLoading(true);
    try {
      const r = await favoritesAPI.toggleFavorite(spotId);
      setIsFavorite(r.data.favorited);
    } catch {} finally { setFavLoading(false); }
  };

  const handleRating = async (rating) => {
    try {
      await ratingsAPI.createOrUpdateRating(spotId, rating);
      await loadRatings();
      setRatingSuccess(true);
      setTimeout(() => setRatingSuccess(false), 2000);
    } catch { setError('Erreur lors de l\'enregistrement de la note'); }
  };

  const handleSessionSubmit = async (e) => {
    e.preventDefault();
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
      setSessionData({ date: new Date().toISOString().split('T')[0], time: '', rating: 3, wave_height: '', wind_direction: '', tide: '', notes: '' });
      setTimeout(() => setSessionSuccess(false), 3000);
    } catch { setError('Erreur lors de l\'enregistrement de la session'); }
  };

  if (loading) return <div className="loading">Chargement...</div>;
  if (error && !spot) return <div className="error">{error}</div>;
  if (!spot) return <div className="error">Spot non trouvé</div>;

  // Helpers
  const expScore = spot.experience_needed_score ? parseFloat(spot.experience_needed_score) : null;
  const level = expScore === null ? null : expScore > 0.7 ? 'Expert' : expScore > 0.4 ? 'Intermédiaire' : 'Débutant';
  const levelColor = level === 'Expert' ? '#ef4444' : level === 'Intermédiaire' ? '#f59e0b' : '#10b981';
  const qualityColor = QUALITY_COLORS[spot.wave_quality] || '#9ca3af';

  const InfoItem = ({ label, value }) => {
    if (!value) return null;
    return (
      <div className="info-item">
        <div className="info-label">{label}</div>
        <div className="info-value">{value}</div>
      </div>
    );
  };

  const ScoreBar = ({ label, value, invert = false }) => {
    if (!value) return null;
    const pct = parseFloat(value);
    const displayPct = invert ? 1 - pct : pct;
    const color = `hsl(${displayPct * 120}, 65%, 45%)`;
    return (
      <div style={{ marginBottom: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#0e4d6e' }}>{label}</span>
          <span style={{ fontSize: '13px', fontWeight: 700, color }}>{(pct * 100).toFixed(0)}%</span>
        </div>
        <div style={{ height: '8px', background: '#e2ecf5', borderRadius: '10px', overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${pct * 100}%`,
            background: color, borderRadius: '10px',
            transition: 'width 0.6s ease'
          }} />
        </div>
      </div>
    );
  };

  return (
    <div className="container" style={{ maxWidth: '900px' }}>
      {/* Header nav */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <button onClick={() => navigate(-1)} className="btn-ghost">← Retour</button>
        <button
          onClick={handleToggleFavorite}
          disabled={favLoading}
          style={{
            background: isFavorite ? '#fee2e2' : 'rgba(255,255,255,0.15)',
            border: isFavorite ? '1.5px solid #fca5a5' : '1.5px solid rgba(255,255,255,0.3)',
            color: isFavorite ? '#ef4444' : 'white',
            borderRadius: '10px', padding: '8px 18px', cursor: 'pointer',
            fontWeight: 700, fontSize: '15px', transition: 'all 0.2s',
            display: 'flex', alignItems: 'center', gap: '6px'
          }}
        >
          {isFavorite ? '❤️ Favori' : '🤍 Ajouter aux favoris'}
        </button>
      </div>

      <div className="card">
        {/* Titre + breadcrumb */}
        <div style={{ marginBottom: '20px' }}>
          <h1 style={{ marginBottom: '8px', marginTop: 0 }}>{spot.name || spot.region}</h1>
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexWrap: 'wrap' }}>
            {[
              { label: spot.continent, path: `/countries/${encodeURIComponent(spot.continent)}` },
              { label: spot.country, path: `/regions/${encodeURIComponent(spot.continent)}/${encodeURIComponent(spot.country)}` },
              { label: spot.region, path: `/spots/${encodeURIComponent(spot.continent)}/${encodeURIComponent(spot.country)}/${encodeURIComponent(spot.region)}` },
            ].filter(b => b.label).map((b, i, arr) => (
              <span key={b.path} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span
                  onClick={() => navigate(b.path)}
                  style={{ color: '#00b4d8', fontSize: '14px', cursor: 'pointer', fontWeight: 600 }}
                  onMouseEnter={e => e.target.style.textDecoration = 'underline'}
                  onMouseLeave={e => e.target.style.textDecoration = 'none'}
                >{b.label}</span>
                {i < arr.length - 1 && <span style={{ color: '#c8dff0' }}>›</span>}
              </span>
            ))}
          </div>
        </div>

        {/* ── CARTE RÉSUMÉ ── */}
        <div style={{
          background: 'linear-gradient(135deg, #f0f6fc, #e8f4fd)',
          border: '1.5px solid #d6e8f5',
          borderRadius: '14px',
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          alignItems: 'center'
        }}>
          {spot.wave_quality && (
            <span style={{ background: qualityColor, color: 'white', padding: '5px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 700 }}>
              {spot.wave_quality}
            </span>
          )}
          {level && (
            <span style={{ background: levelColor, color: 'white', padding: '5px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 700 }}>
              {level}
            </span>
          )}
          {spot.type && (
            <span style={{ background: '#e0f2fe', color: '#0077b6', padding: '5px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 700 }}>
              {spot.type}
            </span>
          )}
          {(spot.swell_min || spot.swell_max) && (
            <span style={{ background: '#f0fdf4', color: '#166534', padding: '5px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 700 }}>
              🌊 {spot.swell_min || '?'}–{spot.swell_max || '?'}m
            </span>
          )}
          {spot.bottom && (
            <span style={{ background: '#fef9c3', color: '#854d0e', padding: '5px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 700 }}>
              {spot.bottom}
            </span>
          )}
          {ratingStats.total_votes > 0 && (
            <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px', color: '#0e4d6e', fontWeight: 700 }}>
              <span style={{ color: '#f59e0b', fontSize: '18px' }}>★</span>
              {ratingStats.average_rating.toFixed(1)}
              <span style={{ color: '#8a9bb0', fontSize: '12px', fontWeight: 400 }}>({ratingStats.total_votes} votes)</span>
            </span>
          )}
        </div>

        {error && <div className="error">{error}</div>}

        {/* Carte Leaflet */}
        {spot.latitude && spot.longitude && (
          <div style={{ marginBottom: '24px' }}>
            <div style={{ width: '100%', height: '320px', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,119,182,0.12)' }}>
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
                <Marker position={[parseFloat(spot.latitude), parseFloat(spot.longitude)]} icon={makeMarkerIcon('#0077b6', 34)} zIndexOffset={1000}>
                  <Popup><strong>{spot.name || spot.region}</strong><br /><span style={{ fontSize: '12px', color: '#666' }}>Spot actuel</span></Popup>
                </Marker>
                {regionSpots.filter(rs => rs.latitude && rs.longitude).map(rs => (
                  <Marker key={rs.id} position={[parseFloat(rs.latitude), parseFloat(rs.longitude)]} icon={makeMarkerIcon(QUALITY_COLORS[rs.wave_quality] || '#9ca3af', 22)}>
                    <Tooltip direction="top" offset={[0, -26]} opacity={0.9}>
                      <strong>{rs.name || rs.region}</strong>{rs.wave_quality && ` — ${rs.wave_quality}`}
                    </Tooltip>
                    <Popup>
                      <strong>{rs.name || rs.region}</strong>
                      {rs.wave_quality && <div style={{ fontSize: '12px', marginTop: '4px' }}>{rs.wave_quality}</div>}
                      <button onClick={() => navigate(`/spot/${rs.id}`)} style={{ marginTop: '8px', padding: '5px 10px', background: '#00b4d8', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', width: '100%' }}>
                        Voir ce spot →
                      </button>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
            {/* GPS */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', padding: '10px 14px', background: '#f0f6fc', borderRadius: '10px', border: '1.5px solid #d6e8f5' }}>
              <span style={{ fontFamily: 'monospace', fontSize: '13px', color: '#0e4d6e', fontWeight: 600 }}>
                📍 {spot.latitude}, {spot.longitude}
              </span>
              <button onClick={() => { navigator.clipboard.writeText(`${spot.latitude}, ${spot.longitude}`); setCopySuccess(true); setTimeout(() => setCopySuccess(false), 2000); }} className="btn-secondary" style={{ fontSize: '12px', padding: '6px 12px' }}>
                {copySuccess ? '✓ Copié !' : '📋 Copier'}
              </button>
            </div>

          </div>
        )}

        {/* ── ONGLETS ── */}
        <div style={{ borderBottom: '2px solid #e2ecf5', marginBottom: '24px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          <button style={TAB_STYLE(activeTab === 'wave')} onClick={() => setActiveTab('wave')}>🌊 Vague</button>
          <button style={TAB_STYLE(activeTab === 'access')} onClick={() => setActiveTab('access')}>📍 Accès</button>
          <button style={TAB_STYLE(activeTab === 'media')} onClick={() => setActiveTab('media')}>
            🎬 Médias {media.length > 0 && `(${media.length})`}
          </button>
          <button style={TAB_STYLE(activeTab === 'sessions')} onClick={() => setActiveTab('sessions')}>📝 Sessions</button>
        </div>

        {/* ── TAB : VAGUE ── */}
        {activeTab === 'wave' && (
          <div>
            <h3 style={{ color: '#0e4d6e', marginTop: 0, marginBottom: '14px' }}>Caractéristiques</h3>
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

            {(spot.wave_quality_score || spot.frequency_score || spot.experience_needed_score) && (
              <div style={{ marginTop: '24px', padding: '20px', background: '#f8fbff', borderRadius: '12px', border: '1.5px solid #e2ecf5' }}>
                <h3 style={{ color: '#0e4d6e', marginTop: 0, marginBottom: '16px' }}>Scores</h3>
                <ScoreBar label="Qualité des vagues" value={spot.wave_quality_score} />
                <ScoreBar label="Fréquence des bonnes conditions" value={spot.frequency_score} />
                <ScoreBar label="Niveau requis" value={spot.experience_needed_score} />
              </div>
            )}

            <h3 style={{ color: '#0e4d6e', marginTop: '24px', marginBottom: '14px' }}>Conditions optimales</h3>
            <div className="info-grid">
              <InfoItem label="Houle idéale" value={spot.good_swell_direction} />
              <InfoItem label="Vent idéal" value={spot.good_wind_direction} />
              <InfoItem label="Taille de houle" value={spot.swell_size} />
              {spot.swell_min && <InfoItem label="Houle min (m)" value={spot.swell_min} />}
              {spot.swell_max && <InfoItem label="Houle max (m)" value={spot.swell_max} />}
              <InfoItem label="Marée" value={spot.best_tide_position} />
              <InfoItem label="Mouvement marée" value={spot.best_tide_movement} />
            </div>

            {spot.description && (
              <div style={{ marginTop: '24px', padding: '16px', background: '#f8fbff', borderRadius: '12px', border: '1.5px solid #e2ecf5', color: '#4a6580', fontSize: '14px', lineHeight: 1.7 }}>
                {spot.description}
                {spot.description_2 && <><br /><br />{spot.description_2}</>}
              </div>
            )}

            {spot.webcam_url && (
              <div style={{ marginTop: '16px' }}>
                <a href={spot.webcam_url} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                  📹 Voir la webcam
                </a>
              </div>
            )}
          </div>
        )}

        {/* ── TAB : ACCÈS ── */}
        {activeTab === 'access' && (
          <div>
            <h3 style={{ color: '#0e4d6e', marginTop: 0, marginBottom: '14px' }}>Accès au spot</h3>
            <div className="info-grid">
              <InfoItem label="Facile à trouver" value={spot.easy_to_find} />
              <InfoItem label="Accès public" value={spot.public_access} />
              <InfoItem label="Accès spécial" value={spot.special_access} />
            </div>

            <h3 style={{ color: '#0e4d6e', marginTop: '24px', marginBottom: '14px' }}>Fréquentation</h3>
            <div className="info-grid">
              <InfoItem label="Crowd semaine" value={spot.week_crowd} />
              <InfoItem label="Crowd week-end" value={spot.weekend_crowd} />
              <InfoItem label="Niveau requis" value={spot.experience} />
            </div>
          </div>
        )}

        {/* ── TAB : SESSIONS ── */}
        {activeTab === 'sessions' && (
          <div>
            {/* Notation */}
            <div style={{ padding: '24px', background: 'linear-gradient(135deg, #f0f6fc, #e8f4fd)', borderRadius: '14px', border: '1.5px solid #d6e8f5', marginBottom: '24px' }}>
              <h3 style={{ marginTop: 0, marginBottom: '16px', textAlign: 'center', color: '#0e4d6e' }}>Notez ce spot</h3>

              {ratingSuccess && (
                <div style={{ padding: '10px 16px', background: '#d1fae5', color: '#065f46', borderRadius: '10px', marginBottom: '14px', fontWeight: 700, textAlign: 'center' }}>
                  ✓ Merci pour votre note !
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '40px', fontWeight: 800, color: '#0e4d6e', lineHeight: 1 }}>{ratingStats.average_rating.toFixed(1)}</div>
                  <div style={{ fontSize: '12px', color: '#8a9bb0', marginTop: '4px' }}>{ratingStats.total_votes} {ratingStats.total_votes > 1 ? 'votes' : 'vote'}</div>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {[1, 2, 3, 4, 5].map(star => {
                    const isActive = hoveredStar > 0 ? star <= hoveredStar : star <= (ratingStats.user_rating || 0);
                    return (
                      <div key={star} onMouseEnter={() => setHoveredStar(star)} onMouseLeave={() => setHoveredStar(0)} onClick={() => handleRating(star)}
                        style={{ cursor: 'pointer', fontSize: '38px', color: isActive ? '#f59e0b' : '#d6e8f5', transition: 'all 0.15s', transform: hoveredStar === star ? 'scale(1.25)' : 'scale(1)', userSelect: 'none' }}>★</div>
                    );
                  })}
                </div>
              </div>

              {ratingStats.user_rating && (
                <div style={{ textAlign: 'center', fontSize: '13px', color: '#8a9bb0', marginTop: '10px' }}>
                  Votre note : {ratingStats.user_rating} étoile{ratingStats.user_rating > 1 ? 's' : ''}
                </div>
              )}
            </div>

            {/* Formulaire session */}
            <h3 style={{ color: '#0e4d6e', marginTop: 0, marginBottom: '16px' }}>Enregistrer une session</h3>

            {sessionSuccess && (
              <div style={{ padding: '12px 16px', background: '#d1fae5', color: '#065f46', borderRadius: '10px', marginBottom: '16px', fontWeight: 700, textAlign: 'center' }}>
                ✓ Session enregistrée !
              </div>
            )}

            <form onSubmit={handleSessionSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: '#0e4d6e', fontSize: '13px' }}>Date *</label>
                  <input type="date" name="date" value={sessionData.date} onChange={e => setSessionData(p => ({ ...p, date: e.target.value }))} required
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #c8dff0', fontSize: '14px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: '#0e4d6e', fontSize: '13px' }}>Heure</label>
                  <input type="time" name="time" value={sessionData.time} onChange={e => setSessionData(p => ({ ...p, time: e.target.value }))}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #c8dff0', fontSize: '14px' }} />
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: '#0e4d6e', fontSize: '13px' }}>Note de la session *</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[1, 2, 3, 4, 5].map(v => (
                    <button key={v} type="button" onClick={() => setSessionData(p => ({ ...p, rating: v }))}
                      style={{ flex: 1, padding: '10px', background: sessionData.rating === v ? '#00b4d8' : '#f0f6fc', color: sessionData.rating === v ? 'white' : '#0e4d6e', border: sessionData.rating === v ? '2px solid #00b4d8' : '2px solid #d6e8f5', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '15px', transition: 'all 0.15s' }}>
                      {v}★
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: '#0e4d6e', fontSize: '13px' }}>Vagues (m)</label>
                  <input type="number" step="0.1" value={sessionData.wave_height} onChange={e => setSessionData(p => ({ ...p, wave_height: e.target.value }))} placeholder="1.5"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #c8dff0', fontSize: '14px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: '#0e4d6e', fontSize: '13px' }}>Vent</label>
                  <input type="text" value={sessionData.wind_direction} onChange={e => setSessionData(p => ({ ...p, wind_direction: e.target.value }))} placeholder="N, NE..."
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #c8dff0', fontSize: '14px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: '#0e4d6e', fontSize: '13px' }}>Marée</label>
                  <select value={sessionData.tide} onChange={e => setSessionData(p => ({ ...p, tide: e.target.value }))}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #c8dff0', fontSize: '14px', background: 'white' }}>
                    <option value="">--</option>
                    <option value="Basse">Basse</option>
                    <option value="Mi-marée">Mi-marée</option>
                    <option value="Haute">Haute</option>
                    <option value="Montante">Montante</option>
                    <option value="Descendante">Descendante</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: '#0e4d6e', fontSize: '13px' }}>Notes</label>
                <textarea value={sessionData.notes} onChange={e => setSessionData(p => ({ ...p, notes: e.target.value }))} rows="3"
                  placeholder="Conditions, observations..."
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #c8dff0', fontSize: '14px', resize: 'vertical' }} />
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%' }}>
                Enregistrer la session
              </button>
            </form>
          </div>
        )}
        {/* ── TAB : MÉDIAS ── */}
        {activeTab === 'media' && (
          <div>
            {mediaError && (
              <div style={{ padding: '10px 14px', background: '#fee2e2', color: '#991b1b', borderRadius: '10px', marginBottom: '16px', fontSize: '14px' }}>
                {mediaError}
              </div>
            )}

            {/* Upload photo/vidéo */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
              <label style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: '8px', padding: '20px', borderRadius: '14px',
                border: '2px dashed #c8dff0', cursor: 'pointer', background: '#f8fbff',
                transition: 'all 0.2s', textAlign: 'center'
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#00b4d8'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#c8dff0'}
              >
                <span style={{ fontSize: '32px' }}>📷</span>
                <span style={{ fontWeight: 700, color: '#0e4d6e', fontSize: '14px' }}>Ajouter une photo</span>
                <span style={{ fontSize: '12px', color: '#8a9bb0' }}>JPG, PNG, WebP · max 10 MB</span>
                <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} disabled={mediaUploading} />
              </label>

              <label style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: '8px', padding: '20px', borderRadius: '14px',
                border: '2px dashed #c8dff0', cursor: 'pointer', background: '#f8fbff',
                transition: 'all 0.2s', textAlign: 'center'
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#00b4d8'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#c8dff0'}
              >
                <span style={{ fontSize: '32px' }}>🎥</span>
                <span style={{ fontWeight: 700, color: '#0e4d6e', fontSize: '14px' }}>Ajouter une vidéo</span>
                <span style={{ fontSize: '12px', color: '#8a9bb0' }}>MP4, WebM, MOV · max 100 MB</span>
                <input type="file" accept="video/*" onChange={handleFileUpload} style={{ display: 'none' }} disabled={mediaUploading} />
              </label>
            </div>

            {mediaUploading && (
              <div style={{ textAlign: 'center', padding: '12px', color: '#00b4d8', fontWeight: 600, marginBottom: '16px' }}>
                ⏳ Upload en cours...
              </div>
            )}

            {/* Lien YouTube */}
            <form onSubmit={handleAddYoutube} style={{ background: '#f8fbff', borderRadius: '14px', padding: '18px', marginBottom: '24px', border: '1.5px solid #e2ecf5' }}>
              <div style={{ fontWeight: 700, color: '#0e4d6e', marginBottom: '12px', fontSize: '14px' }}>
                📺 Ajouter un lien YouTube
              </div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={youtubeUrl}
                  onChange={e => setYoutubeUrl(e.target.value)}
                  style={{ flex: '1 1 250px', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #c8dff0', fontSize: '14px' }}
                />
                <input
                  type="text"
                  placeholder="Titre (optionnel)"
                  value={youtubeTitle}
                  onChange={e => setYoutubeTitle(e.target.value)}
                  style={{ flex: '1 1 150px', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #c8dff0', fontSize: '14px' }}
                />
                <button type="submit" className="btn-primary" disabled={!youtubeUrl || mediaUploading} style={{ flexShrink: 0 }}>
                  Ajouter
                </button>
              </div>
            </form>

            {/* Galerie */}
            {media.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#8a9bb0' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>🏄</div>
                <p style={{ margin: 0 }}>Aucun média pour ce spot encore.<br />Sois le premier à en ajouter !</p>
              </div>
            ) : (
              <div>
                {/* Photos */}
                {media.filter(m => m.media_type === 'photo').length > 0 && (
                  <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ color: '#0e4d6e', marginTop: 0, marginBottom: '12px' }}>Photos</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px' }}>
                      {media.filter(m => m.media_type === 'photo').map(m => (
                        <div key={m.id} style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', aspectRatio: '4/3', background: '#e2ecf5' }}>
                          <img src={m.url} alt={m.title || 'Photo'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          {m.user_id === user?.id && (
                            <button
                              onClick={() => handleDeleteMedia(m.id)}
                              style={{ position: 'absolute', top: '6px', right: '6px', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: '26px', height: '26px', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >✕</button>
                          )}
                          {m.title && (
                            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.6))', padding: '8px', color: 'white', fontSize: '11px', fontWeight: 600 }}>
                              {m.title}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Vidéos */}
                {media.filter(m => m.media_type === 'video').length > 0 && (
                  <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ color: '#0e4d6e', marginTop: 0, marginBottom: '12px' }}>Vidéos</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {media.filter(m => m.media_type === 'video').map(m => (
                        <div key={m.id} style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', background: '#000' }}>
                          <video controls style={{ width: '100%', maxHeight: '360px', display: 'block' }}>
                            <source src={m.url} />
                          </video>
                          {m.user_id === user?.id && (
                            <button
                              onClick={() => handleDeleteMedia(m.id)}
                              style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', fontSize: '14px' }}
                            >✕</button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* YouTube */}
                {media.filter(m => m.media_type === 'youtube').length > 0 && (
                  <div>
                    <h3 style={{ color: '#0e4d6e', marginTop: 0, marginBottom: '12px' }}>YouTube</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {media.filter(m => m.media_type === 'youtube').map(m => (
                        <div key={m.id} style={{ borderRadius: '12px', overflow: 'hidden', position: 'relative' }}>
                          {m.title && <div style={{ padding: '8px 12px', background: '#f0f6fc', fontWeight: 600, color: '#0e4d6e', fontSize: '14px' }}>{m.title}</div>}
                          <div style={{ position: 'relative', paddingBottom: '56.25%', background: '#000' }}>
                            <iframe
                              src={m.url}
                              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          </div>
                          {m.user_id === user?.id && (
                            <button
                              onClick={() => handleDeleteMedia(m.id)}
                              style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}
                            >✕ Supprimer</button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── ENCART ACCÈS — toujours visible ── */}
        {(spot.access_info || spot.distance || spot.walk) && (
          <div style={{
            marginTop: '24px',
            padding: '18px 20px',
            background: '#f8fbff',
            borderRadius: '14px',
            border: '1.5px solid #d6e8f5',
          }}>
            <div style={{ fontWeight: 700, color: '#0e4d6e', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
              📍 Accès
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {spot.distance && (
                <div style={{ fontSize: '14px', color: '#4a6580' }}>
                  <span style={{ fontWeight: 600, color: '#0e4d6e' }}>Distance : </span>{spot.distance}
                </div>
              )}
              {spot.walk && (
                <div style={{ fontSize: '14px', color: '#4a6580' }}>
                  <span style={{ fontWeight: 600, color: '#0e4d6e' }}>Marche : </span>{spot.walk}
                </div>
              )}
              {spot.access_info && (
                <div style={{ fontSize: '14px', color: '#4a6580', marginTop: spot.distance || spot.walk ? '4px' : 0 }}>
                  {spot.access_info}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SpotDetail;
