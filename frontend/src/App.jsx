import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
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
  if (user) return <Navigate to="/continents" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Routes publiques */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

      {/* Routes protégées */}
      <Route path="/continents" element={<ProtectedRoute><Continents /></ProtectedRoute>} />
      <Route path="/countries/:continent" element={<ProtectedRoute><Countries /></ProtectedRoute>} />
      <Route path="/regions/:continent/:country" element={<ProtectedRoute><Regions /></ProtectedRoute>} />
      <Route path="/spots/:continent/:country/:region" element={<ProtectedRoute><Spots /></ProtectedRoute>} />
      <Route path="/spot/:spotId" element={<ProtectedRoute><SpotDetail /></ProtectedRoute>} />
      <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />

      {/* Redirect racine */}
      <Route path="/" element={<Navigate to="/continents" replace />} />

      {/* 404 */}
      <Route path="*" element={<Navigate to="/continents" replace />} />
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
