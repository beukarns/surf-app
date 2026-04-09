import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Continents from './pages/Continents';
import Countries from './pages/Countries';
import Regions from './pages/Regions';
import Spots from './pages/Spots';
import SpotDetail from './pages/SpotDetail';
import Search from './pages/Search';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading">Chargement...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading">Chargement...</div>;
  if (user) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Routes publiques */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

      {/* Routes protégées */}
      <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
      <Route path="/continents" element={<ProtectedRoute><Continents /></ProtectedRoute>} />
      <Route path="/countries/:continent" element={<ProtectedRoute><Countries /></ProtectedRoute>} />
      <Route path="/regions/:continent/:country" element={<ProtectedRoute><Regions /></ProtectedRoute>} />
      <Route path="/spots/:continent/:country/:region" element={<ProtectedRoute><Spots /></ProtectedRoute>} />
      <Route path="/spot/:spotId" element={<ProtectedRoute><SpotDetail /></ProtectedRoute>} />
      <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
