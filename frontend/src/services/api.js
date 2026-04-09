import axios from 'axios';

// En dev, Vite proxy /api → http://localhost:8000
// En prod, nginx proxy /api → http://127.0.0.1:8000
const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur JWT : ajoute le token si présent
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur réponse : déconnexion automatique si 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Redirige vers login sans casser React Router
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  register: (email, password) => api.post('/auth/register', { email, password }),
  login: (email, password) => api.post('/auth/login', { email, password }),
  getMe: () => api.get('/auth/me'),
};

// Spots
export const spotsAPI = {
  getContinents: () => api.get('/spots/continents'),
  getContinentsStats: () => api.get('/spots/continents/stats'),
  search: (q, limit = 20) => api.get('/spots/search', { params: { q, limit } }),
  getCountries: (continent) =>
    api.get(`/spots/countries/${encodeURIComponent(continent)}`),
  getRegions: (continent, country) =>
    api.get(`/spots/regions/${encodeURIComponent(continent)}/${encodeURIComponent(country)}`),
  getSpotsByCountry: (continent, country) =>
    api.get(`/spots/country/${encodeURIComponent(continent)}/${encodeURIComponent(country)}`),
  getSpotsByRegion: (continent, country, region, filters = {}) =>
    api.get(
      `/spots/list/${encodeURIComponent(continent)}/${encodeURIComponent(country)}/${encodeURIComponent(region)}`,
      { params: filters }
    ),
  getSpotDetail: (spotId) => api.get(`/spots/${spotId}`),
};

// Proposed Spots
export const proposedSpotsAPI = {
  createProposedSpot: (proposedSpot) => api.post('/proposed-spots', proposedSpot),
  getProposedSpots: (status = null) =>
    api.get('/proposed-spots', { params: { status } }),
};

// Ratings
export const ratingsAPI = {
  createOrUpdateRating: (spotId, rating) =>
    api.post('/ratings', { spot_id: spotId, rating }),
  getSpotRatings: (spotId) => api.get(`/ratings/${spotId}`),
};

// Sessions
export const sessionsAPI = {
  createSession: (sessionData) => api.post('/sessions', sessionData),
  getMySessions: () => api.get('/sessions/me'),
  getSpotSessions: (spotId) => api.get(`/sessions/${spotId}`),
};

// Favorites
export const favoritesAPI = {
  getMyFavorites: () => api.get('/favorites'),
  getMyFavoriteIds: () => api.get('/favorites/ids'),
  toggleFavorite: (spotId) => api.post(`/favorites/${spotId}`),
};

export default api;
