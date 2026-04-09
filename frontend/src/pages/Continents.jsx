import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { spotsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import WorldMap from '../components/WorldMap';

function Continents() {
  const [continents, setContinents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hoveredContinent, setHoveredContinent] = useState(null);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    loadContinents();
  }, []);

  const loadContinents = async () => {
    try {
      const response = await spotsAPI.getContinents();
      setContinents(response.data);
    } catch (err) {
      setError('Erreur lors du chargement des continents');
    } finally {
      setLoading(false);
    }
  };

  const handleContinentClick = (continent) => {
    if (continents.includes(continent)) {
      navigate(`/countries/${encodeURIComponent(continent)}`);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div className="container">
      {/* Navbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ color: 'white', fontWeight: 700, fontSize: '22px', letterSpacing: '-0.5px' }}>
          🏄 SurfSpots
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/search')} className="btn-secondary" style={{ fontSize: '14px' }}>
            🔍 Rechercher
          </button>
          <button onClick={() => navigate('/profile')} className="btn-ghost" style={{ fontSize: '14px' }}>
            👤 {user?.email?.split('@')[0]}
          </button>
          <button onClick={handleLogout} className="btn-danger" style={{ fontSize: '14px' }}>
            Déconnexion
          </button>
        </div>
      </div>

      <div className="card">
        <h1 style={{ marginTop: 0, marginBottom: '6px' }}>Choisissez un continent</h1>
        <p style={{ color: '#8a9bb0', fontSize: '14px', marginBottom: '24px', marginTop: 0 }}>
          {continents.length} continents disponibles
        </p>

        {error && <div className="error">{error}</div>}

        {/* Carte du monde interactive */}
        <div style={{
          background: 'linear-gradient(135deg, #e0f7fa, #b2ebf2)',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '28px',
          boxShadow: '0 4px 16px rgba(0,180,216,0.15)',
          position: 'relative'
        }}>
          <WorldMap
            availableContinents={continents}
            onContinentClick={handleContinentClick}
            hoveredContinent={hoveredContinent}
            onHover={setHoveredContinent}
          />

          {hoveredContinent && continents.includes(hoveredContinent) && (
            <div style={{
              textAlign: 'center',
              color: '#0077b6',
              fontSize: '18px',
              fontWeight: 700,
              marginTop: '12px',
              padding: '10px',
              background: 'rgba(255,255,255,0.9)',
              borderRadius: '10px',
              pointerEvents: 'none'
            }}>
              {hoveredContinent}
            </div>
          )}
        </div>

        {/* Liste alternative */}
        <p style={{ fontSize: '13px', color: '#8a9bb0', marginBottom: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Ou choisissez dans la liste
        </p>
        <ul className="list">
          {continents.map((c) => (
            <li
              key={c}
              className="list-item"
              onClick={() => navigate(`/countries/${encodeURIComponent(c)}`)}
            >
              <span style={{ fontWeight: 600, color: '#0e4d6e' }}>{c}</span>
              <span style={{ color: '#8a9bb0', fontSize: '18px' }}>›</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default Continents;
