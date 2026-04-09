import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { spotsAPI } from '../services/api';

function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    const q = searchParams.get('q');
    if (q && q.length >= 2) {
      setQuery(q);
      doSearch(q);
    }
  }, []);

  const doSearch = async (q) => {
    if (!q || q.trim().length < 2) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await spotsAPI.search(q.trim(), 30);
      setResults(res.data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSearchParams({ q: query });
    doSearch(query);
  };

  const getQualityColor = (quality) => {
    const map = {
      'World Class': '#8b5cf6',
      'Totally Epic': '#8b5cf6',
      'Regional Classic': '#10b981',
      'Normal': '#fbbf24',
      'Sloppy': '#fb923c',
      'Choss': '#ef4444'
    };
    return map[quality] || '#9ca3af';
  };

  return (
    <div className="container" style={{ maxWidth: '900px' }}>
      <div className="card">
        <button onClick={() => navigate('/continents')} className="back-button">
          ← Retour
        </button>

        <h1 style={{ marginBottom: '20px' }}>Rechercher un spot</h1>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nom du spot, pays, région..."
              style={{ flex: 1, padding: '12px 16px', fontSize: '16px', borderRadius: '8px', border: '2px solid #e5e7eb' }}
            />
            <button
              type="submit"
              disabled={query.trim().length < 2 || loading}
              style={{ width: 'auto', padding: '12px 24px' }}
            >
              {loading ? '...' : 'Rechercher'}
            </button>
          </div>
        </form>

        {loading && <div className="loading">Recherche en cours...</div>}

        {!loading && searched && results.length === 0 && (
          <p style={{ textAlign: 'center', color: '#666', padding: '30px' }}>
            Aucun spot trouvé pour "{query}"
          </p>
        )}

        {!loading && results.length > 0 && (
          <>
            <p style={{ color: '#666', marginBottom: '15px', fontSize: '14px' }}>
              {results.length} résultat{results.length > 1 ? 's' : ''} pour "{query}"
            </p>
            <ul className="list">
              {results.map((spot) => (
                <li
                  key={spot.id}
                  className="list-item"
                  onClick={() => navigate(`/spot/${spot.id}`)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <strong style={{ fontSize: '16px' }}>{spot.name || spot.region}</strong>
                      <div style={{ fontSize: '13px', color: '#888', marginTop: '4px' }}>
                        {[spot.continent, spot.country, spot.region].filter(Boolean).join(' › ')}
                      </div>
                      {spot.type && (
                        <div style={{ fontSize: '13px', color: '#666', marginTop: '2px' }}>
                          {spot.type}
                          {(spot.swell_min || spot.swell_max) && ` • Houle: ${spot.swell_min || '?'}-${spot.swell_max || '?'}m`}
                        </div>
                      )}
                    </div>
                    {spot.wave_quality && (
                      <div style={{
                        background: getQualityColor(spot.wave_quality),
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        whiteSpace: 'nowrap'
                      }}>
                        {spot.wave_quality}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}

        {!searched && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>🔍</div>
            <p>Tapez au moins 2 caractères pour rechercher</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Search;
