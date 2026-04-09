import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { sessionsAPI, favoritesAPI } from '../services/api';

function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [activeTab, setActiveTab] = useState('sessions');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      sessionsAPI.getMySessions().catch(() => ({ data: [] })),
      favoritesAPI.getMyFavorites().catch(() => ({ data: [] })),
    ]).then(([sessRes, favRes]) => {
      setSessions(sessRes.data);
      setFavorites(favRes.data);
      setLoading(false);
    });
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const stats = {
    totalSessions: sessions.length,
    avgRating: sessions.length
      ? (sessions.reduce((a, s) => a + (s.rating || 0), 0) / sessions.length).toFixed(1)
      : '—',
    uniqueSpots: new Set(sessions.map(s => s.spot_id)).size,
    favorites: favorites.length,
  };

  const ratingStars = (r) => '★'.repeat(r || 0) + '☆'.repeat(5 - (r || 0));

  return (
    <div className="container" style={{ maxWidth: '860px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => navigate('/')} className="btn-ghost">← Retour</button>
          <span style={{ color: 'white', fontWeight: 600, fontSize: '20px' }}>Mon profil</span>
        </div>
        <button onClick={handleLogout} className="btn-danger">Déconnexion</button>
      </div>

      {/* Infos user */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{
            width: '60px', height: '60px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #00b4d8, #0077b6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '24px', flexShrink: 0
          }}>
            🏄
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '18px', color: '#0e4d6e' }}>{user?.email}</div>
            <div style={{ color: '#8a9bb0', fontSize: '13px', marginTop: '2px' }}>Surfeur passionné</div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: '20px' }}>
        <div className="stat-card">
          <div className="stat-value">{stats.totalSessions}</div>
          <div className="stat-label">Sessions</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.uniqueSpots}</div>
          <div className="stat-label">Spots surfés</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.avgRating}</div>
          <div className="stat-label">Note moyenne</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.favorites}</div>
          <div className="stat-label">Favoris</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card">
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '2px solid #e2ecf5', paddingBottom: '0' }}>
          {['sessions', 'favorites'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: 'none',
                border: 'none',
                padding: '10px 20px',
                fontSize: '15px',
                fontWeight: 600,
                color: activeTab === tab ? '#00b4d8' : '#8a9bb0',
                borderBottom: activeTab === tab ? '2px solid #00b4d8' : '2px solid transparent',
                marginBottom: '-2px',
                cursor: 'pointer',
                width: 'auto',
                borderRadius: '0',
                transition: 'all 0.2s',
              }}
            >
              {tab === 'sessions' ? `🏄 Sessions (${stats.totalSessions})` : `❤️ Favoris (${stats.favorites})`}
            </button>
          ))}
        </div>

        {loading && <div style={{ textAlign: 'center', padding: '40px', color: '#8a9bb0' }}>Chargement...</div>}

        {/* Onglet Sessions */}
        {!loading && activeTab === 'sessions' && (
          <>
            {sessions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#8a9bb0' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>🌊</div>
                <p>Aucune session enregistrée</p>
                <p style={{ fontSize: '13px', marginTop: '6px' }}>Va sur un spot et clique "Ajouter une session"</p>
              </div>
            ) : (
              <ul className="list">
                {sessions.map((session) => (
                  <li key={session.id} className="list-item" style={{ cursor: 'default' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                      <div>
                        <div style={{ fontWeight: 600, color: '#0e4d6e', marginBottom: '4px' }}>
                          {session.date}
                          {session.time && <span style={{ color: '#8a9bb0', marginLeft: '8px', fontSize: '13px' }}>{session.time}</span>}
                        </div>
                        {session.wave_height && (
                          <div style={{ fontSize: '13px', color: '#4a6580' }}>
                            Vagues : {session.wave_height}m
                            {session.wind_direction && ` • Vent : ${session.wind_direction}`}
                            {session.tide && ` • Marée : ${session.tide}`}
                          </div>
                        )}
                        {session.notes && (
                          <div style={{ fontSize: '13px', color: '#8a9bb0', marginTop: '4px', fontStyle: 'italic' }}>
                            "{session.notes}"
                          </div>
                        )}
                      </div>
                      {session.rating && (
                        <div style={{ color: '#f59e0b', fontSize: '16px', letterSpacing: '1px' }}>
                          {ratingStars(session.rating)}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {/* Onglet Favoris */}
        {!loading && activeTab === 'favorites' && (
          <>
            {favorites.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#8a9bb0' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>❤️</div>
                <p>Aucun spot en favori</p>
                <p style={{ fontSize: '13px', marginTop: '6px' }}>Clique sur ❤️ sur un spot pour l'ajouter</p>
              </div>
            ) : (
              <ul className="list">
                {favorites.map((spot) => (
                  <li key={spot.id} className="list-item" onClick={() => navigate(`/spot/${spot.id}`)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong style={{ color: '#0e4d6e' }}>{spot.name || spot.region}</strong>
                        <div style={{ fontSize: '13px', color: '#8a9bb0', marginTop: '3px' }}>
                          {[spot.continent, spot.country, spot.region].filter(Boolean).join(' › ')}
                        </div>
                      </div>
                      {spot.wave_quality && (
                        <span style={{
                          background: '#e0f2fe', color: '#0077b6',
                          padding: '3px 10px', borderRadius: '20px',
                          fontSize: '11px', fontWeight: 700
                        }}>
                          {spot.wave_quality}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Profile;
