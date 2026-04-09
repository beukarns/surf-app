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
      <div className="card">
        <button onClick={() => navigate('/continents')} className="back-button">
          ← Retour aux continents
        </button>

        <h1>Choisissez un pays - {continent}</h1>

        {error && <div className="error">{error}</div>}

        {/* Carte du continent zoomée */}
        <div style={{
          background: '#e0f7fa',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '30px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <ContinentMap
            continent={continent}
            availableCountries={countries}
            onCountryClick={handleCountryClick}
          />
        </div>

        {/* Liste alternative */}
        <h2 style={{ fontSize: '18px', marginBottom: '15px', color: '#666' }}>
          Ou choisissez dans la liste :
        </h2>
        <ul className="list">
          {countries.map((country) => (
            <li
              key={country}
              className="list-item"
              onClick={() => handleCountryClick(country)}
            >
              {country}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default Countries;
