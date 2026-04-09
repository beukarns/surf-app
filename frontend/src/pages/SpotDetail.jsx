import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { spotsAPI, ratingsAPI, sessionsAPI } from '../services/api';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
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

function SpotDetail() {
  const [spot, setSpot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [ratingStats, setRatingStats] = useState({ average_rating: 0, total_votes: 0, user_rating: null });
  const [hoveredStar, setHoveredStar] = useState(0);
  const [ratingSuccess, setRatingSuccess] = useState(false);
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
  const navigate = useNavigate();
  const { spotId } = useParams();

  useEffect(() => {
    loadSpot();
    loadRatings();
  }, [spotId]);

  const loadSpot = async () => {
    try {
      const response = await spotsAPI.getSpotDetail(spotId);
      setSpot(response.data);
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
    setSessionData(prev => ({
      ...prev,
      [name]: value
    }));
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
  if (error) return <div className="error">{error}</div>;
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

  return (
    <div className="container" style={{ maxWidth: '1200px' }}>
      <div className="card">
        <button onClick={() => navigate(-1)} className="back-button">
          ← Retour
        </button>

        <div style={{ marginBottom: '30px' }}>
          <h1 style={{ marginBottom: '10px' }}>{spot.name || spot.region}</h1>
          <div style={{ color: '#666', fontSize: '16px' }}>
            {spot.continent} • {spot.country} • {spot.region}
          </div>
        </div>

        {/* Carte du spot */}
        {spot.latitude && spot.longitude && (
          <>
            <div style={{
              width: '100%',
              height: '400px',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              marginBottom: '20px'
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
                <Marker position={[parseFloat(spot.latitude), parseFloat(spot.longitude)]}>
                  <Popup>
                    <strong>{spot.name || spot.region}</strong>
                  </Popup>
                </Marker>
              </MapContainer>
            </div>

            {/* Coordonnées GPS cliquables */}
            <div style={{
              background: '#f9fafb',
              padding: '15px',
              borderRadius: '12px',
              marginBottom: '30px',
              border: '2px solid #e5e7eb'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '10px'
              }}>
                <div>
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>
                    Coordonnées GPS
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', fontFamily: 'monospace' }}>
                    {spot.latitude}, {spot.longitude}
                  </div>
                </div>
                <button
                  onClick={() => copyToClipboard(`${spot.latitude}, ${spot.longitude}`)}
                  style={{
                    padding: '10px 20px',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}
                >
                  {copySuccess ? '✓ Copié !' : '📋 Copier'}
                </button>
              </div>
            </div>
          </>
        )}

        <h2 style={{ marginBottom: '15px' }}>Caractéristiques de la vague</h2>
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
          <>
            <h2 style={{ marginTop: '30px', marginBottom: '20px' }}>Scores</h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '30px',
              padding: '10px 0'
            }}>
              {spot.wave_quality_score && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '12px', color: '#374151' }}>
                    Qualité
                  </div>
                  <div style={{ position: 'relative', margin: '0 auto', width: '100px', height: '100px' }}>
                    <svg width="100" height="100" style={{ transform: 'rotate(-90deg)' }}>
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth="12"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke={`hsl(${parseFloat(spot.wave_quality_score) * 120}, 70%, 50%)`}
                        strokeWidth="12"
                        strokeDasharray={`${2 * Math.PI * 40}`}
                        strokeDashoffset={`${2 * Math.PI * 40 * (1 - parseFloat(spot.wave_quality_score))}`}
                        strokeLinecap="round"
                        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                      />
                    </svg>
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      fontSize: '20px',
                      fontWeight: 'bold',
                      color: '#1f2937'
                    }}>
                      {(parseFloat(spot.wave_quality_score) * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
              )}

              {spot.frequency_score && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '12px', color: '#374151' }}>
                    Fréquence
                  </div>
                  <div style={{ position: 'relative', margin: '0 auto', width: '100px', height: '100px' }}>
                    <svg width="100" height="100" style={{ transform: 'rotate(-90deg)' }}>
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth="12"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke={`hsl(${parseFloat(spot.frequency_score) * 120}, 70%, 50%)`}
                        strokeWidth="12"
                        strokeDasharray={`${2 * Math.PI * 40}`}
                        strokeDashoffset={`${2 * Math.PI * 40 * (1 - parseFloat(spot.frequency_score))}`}
                        strokeLinecap="round"
                        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                      />
                    </svg>
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      fontSize: '20px',
                      fontWeight: 'bold',
                      color: '#1f2937'
                    }}>
                      {(parseFloat(spot.frequency_score) * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
              )}

              {spot.experience_needed_score && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '12px', color: '#374151' }}>
                    Niveau requis
                  </div>
                  <div style={{ position: 'relative', margin: '0 auto', width: '100px', height: '100px' }}>
                    <svg width="100" height="100" style={{ transform: 'rotate(-90deg)' }}>
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth="12"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke={`hsl(${parseFloat(spot.experience_needed_score) * 120}, 70%, 50%)`}
                        strokeWidth="12"
                        strokeDasharray={`${2 * Math.PI * 40}`}
                        strokeDashoffset={`${2 * Math.PI * 40 * (1 - parseFloat(spot.experience_needed_score))}`}
                        strokeLinecap="round"
                        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                      />
                    </svg>
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      fontSize: '20px',
                      fontWeight: 'bold',
                      color: '#1f2937'
                    }}>
                      {(parseFloat(spot.experience_needed_score) * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        <h2 style={{ marginTop: '30px', marginBottom: '15px' }}>Conditions optimales</h2>
        <div className="info-grid">
          <InfoItem label="Houle idéale" value={spot.good_swell_direction} />
          <InfoItem label="Vent idéal" value={spot.good_wind_direction} />
          <InfoItem label="Taille de houle" value={spot.swell_size} />
          {spot.swell_min && (
            <InfoItem label="Houle min (m)" value={spot.swell_min} />
          )}
          {spot.swell_max && (
            <InfoItem label="Houle max (m)" value={spot.swell_max} />
          )}
          <InfoItem label="Marée" value={spot.best_tide_position} />
          <InfoItem label="Mouvement marée" value={spot.best_tide_movement} />
        </div>

        <h2 style={{ marginTop: '30px', marginBottom: '15px' }}>Accès et fréquentation</h2>
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
            <h2 style={{ marginTop: '30px', marginBottom: '15px' }}>Infos d'accès</h2>
            <div className="info-item">
              <div className="info-value">{spot.access_info}</div>
            </div>
          </>
        )}

        {spot.description && (
          <>
            <h2 style={{ marginTop: '30px', marginBottom: '15px' }}>Description</h2>
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
            <h2 style={{ marginTop: '30px', marginBottom: '15px' }}>Webcam</h2>
            <div className="info-item">
              <a
                href={spot.webcam_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#667eea', textDecoration: 'none' }}
              >
                {spot.webcam_url}
              </a>
            </div>
          </>
        )}

        {/* Section notation */}
        <div style={{
          marginTop: '40px',
          padding: '30px',
          background: '#f9fafb',
          borderRadius: '12px',
          border: '2px solid #e5e7eb'
        }}>
          <h2 style={{ marginTop: 0, marginBottom: '20px', textAlign: 'center' }}>Notez ce spot</h2>

          {ratingSuccess && (
            <div style={{
              padding: '12px',
              background: '#d1fae5',
              color: '#065f46',
              borderRadius: '8px',
              marginBottom: '15px',
              fontWeight: 'bold',
              textAlign: 'center'
            }}>
              ✓ Merci pour votre note !
            </div>
          )}

          {/* Statistiques de notation */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '20px',
            marginBottom: '25px',
            flexWrap: 'wrap'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1f2937' }}>
                {ratingStats.average_rating.toFixed(1)}
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>
                {ratingStats.total_votes} {ratingStats.total_votes > 1 ? 'votes' : 'vote'}
              </div>
            </div>

            {/* Étoiles de notation */}
            <div style={{ display: 'flex', gap: '8px' }}>
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
                      fontSize: '40px',
                      color: isActive ? '#fbbf24' : '#d1d5db',
                      transition: 'all 0.2s ease',
                      transform: hoveredStar === star ? 'scale(1.2)' : 'scale(1)'
                    }}
                  >
                    ★
                  </div>
                );
              })}
            </div>
          </div>

          {ratingStats.user_rating && (
            <div style={{ textAlign: 'center', fontSize: '14px', color: '#666' }}>
              Votre note : {ratingStats.user_rating} étoile{ratingStats.user_rating > 1 ? 's' : ''}
            </div>
          )}

          {/* Lien vers le formulaire de session */}
          <div style={{ marginTop: '20px', textAlign: 'center', borderTop: '1px solid #e5e7eb', paddingTop: '20px' }}>
            <button
              onClick={() => setShowSessionForm(!showSessionForm)}
              style={{
                padding: '10px 24px',
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              {showSessionForm ? '✕ Fermer' : '📝 Ajouter une session'}
            </button>
          </div>
        </div>

        {/* Formulaire de session */}
        {showSessionForm && (
          <div style={{
            marginTop: '30px',
            padding: '30px',
            background: '#ffffff',
            borderRadius: '12px',
            border: '2px solid #667eea'
          }}>
            <h2 style={{ marginTop: 0, marginBottom: '20px' }}>Enregistrer une session de surf</h2>

            {sessionSuccess && (
              <div style={{
                padding: '12px',
                background: '#d1fae5',
                color: '#065f46',
                borderRadius: '8px',
                marginBottom: '15px',
                fontWeight: 'bold',
                textAlign: 'center'
              }}>
                ✓ Session enregistrée avec succès !
              </div>
            )}

            <form onSubmit={handleSessionSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    Date *
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={sessionData.date}
                    onChange={handleSessionChange}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    Heure
                  </label>
                  <input
                    type="time"
                    name="time"
                    value={sessionData.time}
                    onChange={handleSessionChange}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Note de la session (1-5) *
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setSessionData(prev => ({ ...prev, rating: value }))}
                      style={{
                        flex: 1,
                        padding: '10px',
                        background: sessionData.rating === value ? '#667eea' : '#f3f4f6',
                        color: sessionData.rating === value ? 'white' : '#1f2937',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '16px'
                      }}
                    >
                      {value}★
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    Hauteur des vagues (m)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    name="wave_height"
                    value={sessionData.wave_height}
                    onChange={handleSessionChange}
                    placeholder="Ex: 1.5"
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    Direction du vent
                  </label>
                  <input
                    type="text"
                    name="wind_direction"
                    value={sessionData.wind_direction}
                    onChange={handleSessionChange}
                    placeholder="Ex: N, NE, SW..."
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    Marée
                  </label>
                  <select
                    name="tide"
                    value={sessionData.tide}
                    onChange={handleSessionChange}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db',
                      fontSize: '14px'
                    }}
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
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
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
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              </div>

              <button
                type="submit"
                style={{
                  padding: '12px 24px',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  width: '100%'
                }}
              >
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
