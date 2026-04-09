import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/continents');
    } catch (err) {
      setError(
        err.response?.data?.detail === 'Incorrect email or password'
          ? 'Email ou mot de passe incorrect'
          : 'Erreur de connexion. Réessayez.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: '420px', margin: '40px auto' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{ fontSize: '52px', marginBottom: '8px' }}>🏄</div>
        <h1 style={{ color: 'white', fontFamily: 'Poppins, sans-serif', fontSize: '32px', fontWeight: 800, marginBottom: '6px' }}>
          Surf Spots
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '15px' }}>
          Les meilleurs spots du monde
        </p>
      </div>

      <div className="card">
        <h2 style={{ textAlign: 'center', marginBottom: '24px', color: '#0e4d6e' }}>
          Connexion
        </h2>

        {error && <div className="error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.com"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Mot de passe</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength="6"
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '8px' }}>
            {loading ? 'Connexion...' : 'Se connecter 🌊'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px', color: '#4a6580', fontSize: '14px' }}>
          Pas encore de compte ?{' '}
          <Link to="/register" style={{ color: '#00b4d8', fontWeight: 600, textDecoration: 'none' }}>
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
