import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('Les mots de passe ne correspondent pas'); return; }
    if (password.length < 6) { setError('Le mot de passe doit faire au moins 6 caractères'); return; }
    setLoading(true);
    try {
      await register(email, password);
      navigate('/continents');
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(detail === 'Email already registered' ? 'Cet email est déjà utilisé' : 'Erreur lors de l\'inscription.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: '420px', margin: '40px auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{ fontSize: '52px', marginBottom: '8px' }}>🏄</div>
        <h1 style={{ color: 'white', fontFamily: 'Poppins, sans-serif', fontSize: '32px', fontWeight: 800, marginBottom: '6px' }}>
          Surf Spots
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '15px' }}>
          Rejoins la communauté surf
        </p>
      </div>

      <div className="card">
        <h2 style={{ textAlign: 'center', marginBottom: '24px', color: '#0e4d6e' }}>
          Créer un compte
        </h2>

        {error && <div className="error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="votre@email.com" required autoFocus />
          </div>
          <div className="form-group">
            <label>Mot de passe</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimum 6 caractères" required minLength="6" />
          </div>
          <div className="form-group">
            <label>Confirmer le mot de passe</label>
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" required minLength="6" />
          </div>
          <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '8px' }}>
            {loading ? 'Création...' : 'Créer mon compte 🤙'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px', color: '#4a6580', fontSize: '14px' }}>
          Déjà un compte ?{' '}
          <Link to="/login" style={{ color: '#00b4d8', fontWeight: 600, textDecoration: 'none' }}>
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
