import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { spotsAPI, sessionsAPI, favoritesAPI } from '../services/api';

const QUALITY_COLORS = {
  'World Class': '#8b5cf6', 'Totally Epic': '#8b5cf6',
  'Regional Classic': '#10b981', 'Normal': '#f59e0b',
  'Sloppy': '#fb923c', 'Choss': '#ef4444',
};

function Home() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      sessionsAPI.getMySessions().catch(() => ({ data: [] })),
      favoritesAPI.getMyFavorites().catch(() => ({ data: [] })),
    ]).then(([s, f]) => {
      setSessions(s.data.slice(0, 3));
      setFavorites(f.data.slice(0, 4));
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const r = await spotsAPI.search(searchQuery, 6);
        setSearchResults(r.data);
      } catch {}
      setSearching(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const ratingStars = (r) => '★'.repeat(r || 0) + '☆'.repeat(5 - (r || 0));
  const firstName = user?.email?.split('@')[0];

  return (
    <div className="container" style={{ maxWidth: '860px' }}>
      {/* Navbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ color: 'white', fontWeight: 700, fontSize: '22px', letterSpacing: '-0.5px' }}>
          🏄 SurfSpots
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button onClick={() => navigate('/continents')} className="btn-ghost" style={{ fontSize: '14px' }}>🌍 Explorer</button>
          <button onClick={() => navigate('/profile')} className="btn-ghost" style={{ fontSize: '14px' }}>👤 Profil</button>
          <button onClick={() => { logout(); navigate('/login'); }} className="btn-danger" style={{ fontSize: '14px' }}>Déconnexion</button>
        </div>
      </div>

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #0077b6, #00b4d8)',
        borderRadius: '20px',
        padding: '32px 28px',
        marginBottom: '24px',
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: '-20px', right: '-20px', fontSize: '120px', opacity: 0.1 }}>🌊</div>
        <h1 style={{ margin: '0 0 6px', fontSize: '26px', fontWeight: 800 }}>
          Salut {firstName} 👋
        </h1>
        <p style={{ margin: '0 0 20px', opacity: 0.85, fontSize: '15px' }}>
          Trouve ton prochain spot de surf
        </p>

        {/* Barre de recherche */}
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="🔍 Rechercher un spot, une région, un pays..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '14px 18px',
              borderRadius: '12px',
              border: 'none',
              fontSize: '15px',
              color: '#0e4d6e',
              fontWeight: 500,
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              outline: 'none',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#8a9bb0', fontSize: '18px' }}
            >✕</button>
          )}
        </div>

        {/* Résultats de recherche */}
        {(searchResults.length > 0 || searching) && (
          <div style={{ marginTop: '8px', background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 8px 30px rgba(0,0,0,0.15)' }}>
            {searching && <div style={{ padding: '14px 18px', color: '#8a9bb0', fontSize: '14px' }}>Recherche...</div>}
            {searchResults.map((spot, i) => (
              <div
                key={spot.id}
                onClick={() => { navigate(`/spot/${spot.id}`); setSearchQuery(''); }}
                style={{
                  padding: '12px 18px',
                  borderTop: i > 0 ? '1px solid #f0f6fc' : 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px',
                  transition: 'background 0.15s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#f8fbff'}
                onMouseLeave={e => e.currentTarget.style.background = 'white'}
              >
                <div>
                  <div style={{ fontWeight: 700, color: '#0e4d6e', fontSize: '14px' }}>{spot.name || spot.region}</div>
                  <div style={{ fontSize: '12px', color: '#8a9bb0', marginTop: '2px' }}>
                    {[spot.continent, spot.country, spot.region].filter(Boolean).join(' › ')}
                  </div>
                </div>
                {spot.wave_quality && (
                  <span style={{ background: QUALITY_COLORS[spot.wave_quality] || '#9ca3af', color: 'white', padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>
                    {spot.wave_quality}
                  </span>
                )}
              </div>
            ))}
            {searchResults.length === 0 && !searching && (
              <div style={{ padding: '14px 18px', color: '#8a9bb0', fontSize: '14px' }}>Aucun résultat pour "{searchQuery}"</div>
            )}
          </div>
        )}
      </div>

      {/* Accès rapide */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {[
          { icon: '🌍', label: 'Explorer', sub: 'Tous les continents', action: () => navigate('/continents') },
          { icon: '🔍', label: 'Recherche avancée', sub: 'Filtres & cartes', action: () => navigate('/search') },
          { icon: '👤', label: 'Mon profil', sub: 'Sessions & favoris', action: () => navigate('/profile') },
        ].map(item => (
          <div
            key={item.label}
            onClick={item.action}
            style={{
              background: 'white',
              borderRadius: '14px',
              padding: '18px 14px',
              cursor: 'pointer',
              border: '1.5px solid #e2ecf5',
              textAlign: 'center',
              transition: 'all 0.2s',
              boxShadow: '0 2px 8px rgba(0,119,182,0.06)'
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,119,182,0.12)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,119,182,0.06)'; }}
          >
            <div style={{ fontSize: '28px', marginBottom: '6px' }}>{item.icon}</div>
            <div style={{ fontWeight: 700, color: '#0e4d6e', fontSize: '14px' }}>{item.label}</div>
            <div style={{ fontSize: '12px', color: '#8a9bb0', marginTop: '3px' }}>{item.sub}</div>
          </div>
        ))}
      </div>

      {!loading && (
        <div style={{ display: 'grid', gridTemplateColumns: favorites.length > 0 ? '1fr 1fr' : '1fr', gap: '20px' }}>

          {/* Favoris */}
          {favorites.length > 0 && (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ margin: 0, fontSize: '16px', color: '#0e4d6e' }}>❤️ Mes favoris</h2>
                <button onClick={() => navigate('/profile')} style={{ background: 'none', border: 'none', color: '#00b4d8', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>Voir tout →</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {favorites.map(spot => (
                  <div
                    key={spot.id}
                    onClick={() => navigate(`/spot/${spot.id}`)}
                    style={{ padding: '10px 14px', background: '#f8fbff', borderRadius: '10px', cursor: 'pointer', border: '1.5px solid transparent', transition: 'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#00b4d8'; e.currentTarget.style.background = 'white'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.background = '#f8fbff'; }}
                  >
                    <div style={{ fontWeight: 700, color: '#0e4d6e', fontSize: '13px' }}>{spot.name || spot.region}</div>
                    <div style={{ fontSize: '11px', color: '#8a9bb0', marginTop: '2px' }}>{[spot.country, spot.region].filter(Boolean).join(' › ')}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dernières sessions */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ margin: 0, fontSize: '16px', color: '#0e4d6e' }}>🏄 Dernières sessions</h2>
              <button onClick={() => navigate('/profile')} style={{ background: 'none', border: 'none', color: '#00b4d8', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>Voir tout →</button>
            </div>
            {sessions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: '#8a9bb0' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🌊</div>
                <p style={{ margin: 0, fontSize: '13px' }}>Aucune session enregistrée</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {sessions.map(session => (
                  <div key={session.id} style={{ padding: '12px 14px', background: '#f8fbff', borderRadius: '10px', border: '1.5px solid #e2ecf5' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontWeight: 700, color: '#0e4d6e', fontSize: '13px' }}>{session.date}</div>
                      {session.rating && <span style={{ color: '#f59e0b', fontSize: '13px' }}>{ratingStars(session.rating)}</span>}
                    </div>
                    {session.wave_height && <div style={{ fontSize: '12px', color: '#8a9bb0', marginTop: '3px' }}>Vagues : {session.wave_height}m{session.wind_direction ? ` • Vent : ${session.wind_direction}` : ''}</div>}
                    {session.notes && <div style={{ fontSize: '12px', color: '#a0b3c6', marginTop: '3px', fontStyle: 'italic' }}>"{session.notes}"</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
