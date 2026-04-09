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
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1 style={{ margin: 0 }}>Choisissez un continent</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => navigate('/search')}
              style={{
                padding: '8px 16px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
                width: 'auto'
              }}
            >
              Rechercher un spot
            </button>
            <span style={{ fontSize: '14px', color: '#666' }}>{user?.email}</span>
            <button onClick={handleLogout} className="back-button" style={{ margin: 0 }}>
              Déconnexion
            </button>
          </div>
        </div>

        {error && <div className="error">{error}</div>}

        {/* Carte du monde interactive */}
        <div style={{
          background: '#e0f7fa',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '30px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
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
              color: '#1e40af',
              fontSize: '20px',
              fontWeight: 'bold',
              marginTop: '15px',
              padding: '10px',
              background: 'rgba(255,255,255,0.9)',
              borderRadius: '8px',
              pointerEvents: 'none'
            }}>
              {hoveredContinent}
            </div>
          )}
        </div>

        {/* Liste alternative */}
        <h2 style={{ fontSize: '18px', marginBottom: '15px', color: '#666' }}>
          Ou choisissez dans la liste :
        </h2>
        <ul className="list">
          {continents.map((continent) => (
            <li
              key={continent}
              className="list-item"
              onClick={() => navigate(`/countries/${encodeURIComponent(continent)}`)}
            >
              {continent}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default Continents;
