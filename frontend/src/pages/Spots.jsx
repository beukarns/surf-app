import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { spotsAPI, proposedSpotsAPI } from '../services/api';
import SpotsMap from '../components/SpotsMap';

const QUALITY_COLORS = {
  'World Class': '#8b5cf6',
  'Totally Epic': '#8b5cf6',
  'Regional Classic': '#10b981',
  'Normal': '#fbbf24',
  'Sloppy': '#fb923c',
  'Choss': '#ef4444',
};

const LEVEL_LABELS = {
  'beginner': 'Débutant',
  'intermediate': 'Intermédiaire',
  'expert': 'Expert',
};

function Spots() {
  const [spots, setSpots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  // Filtres
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [qualityFilter, setQualityFilter] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    latitude: '',
    longitude: '',
    description: '',
    submitter_name: '',
    submitter_email: ''
  });
  const [formSuccess, setFormSuccess] = useState(false);
  const navigate = useNavigate();
  const { continent, country, region } = useParams();

  useEffect(() => {
    loadSpots();
  }, [continent, country, region]);

  const loadSpots = async () => {
    setLoading(true);
    try {
      const response = await spotsAPI.getSpotsByRegion(continent, country, region);
      setSpots(response.data);
    } catch (err) {
      setError('Erreur lors du chargement des spots');
    } finally {
      setLoading(false);
    }
  };

  // Filtrage client-side (rapide, évite des allers-retours API)
  const filteredSpots = useMemo(() => {
    return spots.filter((spot) => {
      const name = (spot.name || spot.region || '').toLowerCase();
      if (searchQuery && !name.includes(searchQuery.toLowerCase())) return false;

      if (levelFilter) {
        const score = spot.experience_needed_score ? parseFloat(spot.experience_needed_score) : null;
        if (levelFilter === 'beginner' && score !== null && score > 0.4) return false;
        if (levelFilter === 'intermediate' && (score === null || score <= 0.4 || score > 0.7)) return false;
        if (levelFilter === 'expert' && (score === null || score <= 0.7)) return false;
      }

      if (qualityFilter && spot.wave_quality !== qualityFilter) return false;

      return true;
    });
  }, [spots, searchQuery, levelFilter, qualityFilter]);

  // Qualités disponibles dans cette région
  const availableQualities = useMemo(() => {
    const set = new Set(spots.map((s) => s.wave_quality).filter(Boolean));
    return Array.from(set).sort();
  }, [spots]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitProposal = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await proposedSpotsAPI.createProposedSpot({
        name: formData.name,
        continent,
        country,
        region,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        description: formData.description || null,
        submitter_name: formData.submitter_name || null,
        submitter_email: formData.submitter_email || null
      });
      setFormSuccess(true);
      setFormData({ name: '', latitude: '', longitude: '', description: '', submitter_name: '', submitter_email: '' });
      setTimeout(() => { setFormSuccess(false); setShowForm(false); }, 3000);
    } catch {
      setError('Erreur lors de la soumission de la proposition');
    }
  };

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div className="container">
      <div className="card">
        <button
          onClick={() => navigate(`/regions/${encodeURIComponent(continent)}/${encodeURIComponent(country)}`)}
          className="back-button"
        >
          ← Retour aux régions
        </button>

        <h1>Spots — {region}</h1>
        <p style={{ color: '#666', marginBottom: '20px', fontSize: '14px' }}>
          {spots.length} spot{spots.length > 1 ? 's' : ''} dans cette région
        </p>

        {error && <div className="error">{error}</div>}

        {/* Carte des spots */}
        {spots.length > 0 && (
          <SpotsMap
            spots={filteredSpots}
            onSpotClick={(spotId) => navigate(`/spot/${spotId}`)}
          />
        )}

        {/* Barre de filtres */}
        <div style={{
          background: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '10px',
          padding: '16px',
          marginBottom: '20px',
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          <input
            type="text"
            placeholder="Rechercher dans la région..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: '1 1 200px',
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              fontSize: '14px'
            }}
          />

          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              fontSize: '14px',
              background: 'white',
              cursor: 'pointer'
            }}
          >
            <option value="">Tous niveaux</option>
            <option value="beginner">Débutant</option>
            <option value="intermediate">Intermédiaire</option>
            <option value="expert">Expert</option>
          </select>

          {availableQualities.length > 0 && (
            <select
              value={qualityFilter}
              onChange={(e) => setQualityFilter(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                fontSize: '14px',
                background: 'white',
                cursor: 'pointer'
              }}
            >
              <option value="">Toutes qualités</option>
              {availableQualities.map((q) => (
                <option key={q} value={q}>{q}</option>
              ))}
            </select>
          )}

          {(searchQuery || levelFilter || qualityFilter) && (
            <button
              onClick={() => { setSearchQuery(''); setLevelFilter(''); setQualityFilter(''); }}
              style={{
                padding: '8px 14px',
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 'bold',
                width: 'auto'
              }}
            >
              Effacer
            </button>
          )}
        </div>

        {/* Bouton proposition */}
        <div style={{ marginBottom: '20px' }}>
          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              padding: '12px 24px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              width: '100%'
            }}
          >
            {showForm ? '✕ Annuler' : '+ Proposer un nouveau spot'}
          </button>
        </div>

        {/* Formulaire de proposition */}
        {showForm && (
          <div style={{
            background: '#f9fafb',
            padding: '20px',
            borderRadius: '12px',
            marginBottom: '30px',
            border: '2px solid #e5e7eb'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Proposer un nouveau spot</h3>

            {formSuccess && (
              <div style={{
                padding: '12px',
                background: '#d1fae5',
                color: '#065f46',
                borderRadius: '8px',
                marginBottom: '15px',
                fontWeight: 'bold'
              }}>
                ✓ Votre proposition a été soumise avec succès !
              </div>
            )}

            <form onSubmit={handleSubmitProposal}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Nom du spot *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  required
                  style={{ padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Latitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleFormChange}
                    placeholder="Ex: 46.123456"
                    style={{ padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Longitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleFormChange}
                    placeholder="Ex: -2.123456"
                    style={{ padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  rows="3"
                  placeholder="Décrivez le spot, son accès, les conditions..."
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Votre nom</label>
                  <input
                    type="text"
                    name="submitter_name"
                    value={formData.submitter_name}
                    onChange={handleFormChange}
                    style={{ padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Votre email</label>
                  <input
                    type="email"
                    name="submitter_email"
                    value={formData.submitter_email}
                    onChange={handleFormChange}
                    style={{ padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' }}
                  />
                </div>
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
                Soumettre la proposition
              </button>
            </form>
          </div>
        )}

        {/* Liste des spots filtrés */}
        {filteredSpots.length === 0 && !loading ? (
          <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
            {spots.length === 0
              ? 'Aucun spot dans cette région'
              : 'Aucun spot ne correspond aux filtres sélectionnés'}
          </p>
        ) : (
          <ul className="list">
            {filteredSpots.map((spot) => {
              const score = spot.experience_needed_score ? parseFloat(spot.experience_needed_score) : null;
              const level = score === null ? null : score > 0.7 ? 'Expert' : score > 0.4 ? 'Intermédiaire' : 'Débutant';
              const levelColor = level === 'Expert' ? '#ef4444' : level === 'Intermédiaire' ? '#f59e0b' : '#10b981';

              return (
                <li
                  key={spot.id}
                  className="list-item"
                  onClick={() => navigate(`/spot/${spot.id}`)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <strong>{spot.name || spot.region}</strong>
                      <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>
                        {[spot.type, spot.wave_quality].filter(Boolean).join(' • ')}
                      </div>
                      {(spot.swell_min || spot.swell_max) && (
                        <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>
                          Houle: {spot.swell_min || '?'}m – {spot.swell_max || '?'}m
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      {level && (
                        <span style={{
                          background: levelColor,
                          color: 'white',
                          padding: '3px 10px',
                          borderRadius: '20px',
                          fontSize: '11px',
                          fontWeight: 'bold'
                        }}>
                          {level}
                        </span>
                      )}
                      {spot.wave_quality && (
                        <span style={{
                          background: QUALITY_COLORS[spot.wave_quality] || '#9ca3af',
                          color: 'white',
                          padding: '3px 10px',
                          borderRadius: '20px',
                          fontSize: '11px',
                          fontWeight: 'bold'
                        }}>
                          {spot.wave_quality}
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

export default Spots;
