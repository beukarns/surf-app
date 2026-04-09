import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { spotsAPI } from '../services/api';
import ContinentMap from '../components/ContinentMap';

function Countries() {
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { continent } = useParams();

  useEffect(() => {
    loadCountries();
  }, [continent]);

  const loadCountries = async () => {
    try {
      const response = await spotsAPI.getCountries(continent);
      setCountries(response.data);
    } catch (err) {
      setError('Erreur lors du chargement des pays');
    } finally {
      setLoading(false);
    }
  };

  const handleCountryClick = (country) => {
    console.log('Navigation vers régions:', continent, country);
    navigate(`/regions/${encodeURIComponent(continent)}/${encodeURIComponent(country)}`);
  };

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div className="container">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <button onClick={() => navigate('/continents')} className="btn-ghost">← Retour</button>
        <span style={{ color: 'white', fontWeight: 600, fontSize: '18px' }}>{continent}</span>
      </div>

      <div className="card">
        <h1 style={{ marginTop: 0, marginBottom: '6px' }}>Choisissez un pays</h1>
        <p style={{ color: '#8a9bb0', fontSize: '14px', marginBottom: '24px', marginTop: 0 }}>
          {countries.length} pays disponibles en {continent}
        </p>

        {error && <div className="error">{error}</div>}

        {/* Carte du continent zoomée */}
        <div style={{
          background: 'linear-gradient(135deg, #e0f7fa, #b2ebf2)',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '28px',
          boxShadow: '0 4px 16px rgba(0,180,216,0.15)'
        }}>
          <ContinentMap
            continent={continent}
            availableCountries={countries}
            onCountryClick={handleCountryClick}
          />
        </div>

        <p style={{ fontSize: '13px', color: '#8a9bb0', marginBottom: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Ou choisissez dans la liste
        </p>
        <ul className="list">
          {countries.map((country) => (
            <li
              key={country}
              className="list-item"
              onClick={() => handleCountryClick(country)}
            >
              <span style={{ fontWeight: 600, color: '#0e4d6e' }}>{country}</span>
              <span style={{ color: '#8a9bb0', fontSize: '18px' }}>›</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default Countries;
