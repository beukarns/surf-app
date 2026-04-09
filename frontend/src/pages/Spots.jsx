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
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <button
          onClick={() => navigate(`/regions/${encodeURIComponent(continent)}/${encodeURIComponent(country)}`)}
          className="btn-ghost"
        >
          ← Retour
        </button>
        <span style={{ color: 'white', fontWeight: 600, fontSize: '16px' }}>
          {continent} › {country} › {region}
        </span>
      </div>

      <div className="card">
        <h1 style={{ marginTop: 0, marginBottom: '4px' }}>{region}</h1>
        <p style={{ color: '#8a9bb0', fontSize: '14px', marginBottom: '24px', marginTop: 0 }}>
          {spots.length} spot{spots.length > 1 ? 's' : ''} dans cette région
          {filteredSpots.length !== spots.length && ` • ${filteredSpots.length} affiché${filteredSpots.length > 1 ? 's' : ''}`}
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
          background: '#f0f6fc',
          border: '1px solid #d6e8f5',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '16px',
          display: 'flex',
          gap: '10px',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          <input
            type="text"
            placeholder="🔍 Rechercher dans la région..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: '1 1 200px',
              padding: '9px 14px',
              borderRadius: '8px',
              border: '1.5px solid #c8dff0',
              fontSize: '14px',
              background: 'white',
              color: '#0e4d6e',
              outline: 'none'
            }}
          />

          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            style={{
              padding: '9px 14px',
              borderRadius: '8px',
              border: '1.5px solid #c8dff0',
              fontSize: '14px',
              background: 'white',
              color: '#0e4d6e',
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
                padding: '9px 14px',
                borderRadius: '8px',
                border: '1.5px solid #c8dff0',
                fontSize: '14px',
                background: 'white',
                color: '#0e4d6e',
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
              className="btn-danger"
              style={{ fontSize: '13px', padding: '9px 14px' }}
            >
              Effacer
            </button>
          )}
        </div>

        {/* Bouton proposition */}
        <div style={{ marginBottom: '20px' }}>
          <button onClick={() => setShowForm(!showForm)} className="btn-secondary" style={{ width: '100%' }}>
            {showForm ? '✕ Annuler' : '+ Proposer un nouveau spot'}
          </button>
        </div>

        {/* Formulaire de proposition */}
        {showForm && (
          <div style={{
            background: '#f0f6fc',
            padding: '24px',
            borderRadius: '16px',
            marginBottom: '24px',
            border: '1.5px solid #d6e8f5'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#0e4d6e' }}>Proposer un nouveau spot</h3>

            {formSuccess && (
              <div style={{
                padding: '12px 16px',
                background: '#d1fae5',
                color: '#065f46',
                borderRadius: '10px',
                marginBottom: '16px',
                fontWeight: 600
              }}>
                ✓ Votre proposition a été soumise avec succès !
              </div>
            )}

            <form onSubmit={handleSubmitProposal}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: '#0e4d6e', fontSize: '14px' }}>
                  Nom du spot *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  required
                  style={{ padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #c8dff0', fontSize: '14px', width: '100%' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: '#0e4d6e', fontSize: '14px' }}>Latitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleFormChange}
                    placeholder="Ex: 46.123456"
                    style={{ padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #c8dff0', fontSize: '14px', width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: '#0e4d6e', fontSize: '14px' }}>Longitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleFormChange}
                    placeholder="Ex: -2.123456"
                    style={{ padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #c8dff0', fontSize: '14px', width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: '#0e4d6e', fontSize: '14px' }}>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  rows="3"
                  placeholder="Décrivez le spot, son accès, les conditions..."
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #c8dff0', fontSize: '14px', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: '#0e4d6e', fontSize: '14px' }}>Votre nom</label>
                  <input
                    type="text"
                    name="submitter_name"
                    value={formData.submitter_name}
                    onChange={handleFormChange}
                    style={{ padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #c8dff0', fontSize: '14px', width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: '#0e4d6e', fontSize: '14px' }}>Votre email</label>
                  <input
                    type="email"
                    name="submitter_email"
                    value={formData.submitter_email}
                    onChange={handleFormChange}
                    style={{ padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #c8dff0', fontSize: '14px', width: '100%' }}
                  />
                </div>
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%' }}>
                Soumettre la proposition
              </button>
            </form>
          </div>
        )}

        {/* Liste des spots filtrés */}
        {filteredSpots.length === 0 && !loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#8a9bb0' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🌊</div>
            <p style={{ margin: 0 }}>
              {spots.length === 0
                ? 'Aucun spot dans cette région'
                : 'Aucun spot ne correspond aux filtres sélectionnés'}
            </p>
          </div>
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong style={{ color: '#0e4d6e' }}>{spot.name || spot.region}</strong>
                      <div style={{ fontSize: '13px', color: '#8a9bb0', marginTop: '4px' }}>
                        {[spot.type, spot.wave_quality].filter(Boolean).join(' • ')}
                      </div>
                      {(spot.swell_min || spot.swell_max) && (
                        <div style={{ fontSize: '12px', color: '#a0b3c6', marginTop: '2px' }}>
                          Houle: {spot.swell_min || '?'}m – {spot.swell_max || '?'}m
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end', flexShrink: 0 }}>
                      {level && (
                        <span style={{
                          background: levelColor,
                          color: 'white',
                          padding: '3px 10px',
                          borderRadius: '20px',
                          fontSize: '11px',
                          fontWeight: 700
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
                          fontWeight: 700
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
