import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { spotsAPI } from '../services/api';

function Regions() {
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { continent, country } = useParams();

  useEffect(() => {
    loadRegions();
  }, [continent, country]);

  const loadRegions = async () => {
    try {
      const response = await spotsAPI.getRegions(continent, country);
      setRegions(response.data);
    } catch (err) {
      setError('Erreur lors du chargement des régions');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div className="container">
      <div className="card">
        <button
          onClick={() => navigate(`/countries/${encodeURIComponent(continent)}`)}
          className="back-button"
        >
          ← Retour aux pays
        </button>

        <h1>Régions - {country}</h1>

        {error && <div className="error">{error}</div>}

        <ul className="list">
          {regions.map((region) => (
            <li
              key={region}
              className="list-item"
              onClick={() => navigate(`/spots/${encodeURIComponent(continent)}/${encodeURIComponent(country)}/${encodeURIComponent(region)}`)}
            >
              {region}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default Regions;
