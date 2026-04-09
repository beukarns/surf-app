-- Schéma complet de la base de données Surf Spots
-- PostgreSQL 15+

-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);

-- Table des spots de surf
CREATE TABLE IF NOT EXISTS spots (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    continent VARCHAR(100),
    country VARCHAR(100),
    region VARCHAR(100),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    datum VARCHAR(50),
    precision VARCHAR(50),
    access_info TEXT,
    distance VARCHAR(100),
    walk VARCHAR(100),
    easy_to_find VARCHAR(50),
    public_access VARCHAR(50),
    special_access VARCHAR(100),
    wave_quality VARCHAR(50),
    experience VARCHAR(100),
    frequency VARCHAR(100),
    type VARCHAR(50),
    direction VARCHAR(50),
    bottom VARCHAR(50),
    power VARCHAR(100),
    normal_length VARCHAR(50),
    good_day_length VARCHAR(50),
    good_swell_direction VARCHAR(100),
    good_wind_direction VARCHAR(100),
    swell_size TEXT,
    best_tide_position VARCHAR(100),
    best_tide_movement VARCHAR(100),
    week_crowd VARCHAR(50),
    weekend_crowd VARCHAR(50),
    webcam_url VARCHAR(500),
    description TEXT,
    description_2 TEXT,
    rating INTEGER,
    votes INTEGER,
    frequency_score DECIMAL(3, 2),
    wave_quality_score DECIMAL(3, 2),
    experience_needed_score DECIMAL(3, 2),
    swell_min DECIMAL(4, 2),
    swell_max DECIMAL(4, 2),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Index pour optimiser les requêtes de navigation
CREATE INDEX idx_spots_continent ON spots(continent);
CREATE INDEX idx_spots_country ON spots(country);
CREATE INDEX idx_spots_region ON spots(region);
CREATE INDEX idx_spots_rating ON spots(rating DESC);
CREATE INDEX idx_spots_wave_quality_score ON spots(wave_quality_score DESC);
CREATE INDEX idx_spots_frequency_score ON spots(frequency_score DESC);
CREATE INDEX idx_spots_swell_min ON spots(swell_min);
CREATE INDEX idx_spots_swell_max ON spots(swell_max);

-- Table des sessions de surf (future feature)
CREATE TABLE IF NOT EXISTS sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    spot_id INTEGER NOT NULL REFERENCES spots(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    time TIME,
    rating INTEGER CHECK (rating >= 1 AND rating <= 10),
    wave_height DECIMAL(4, 2),
    wind_direction VARCHAR(50),
    tide VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_spot_id ON sessions(spot_id);
CREATE INDEX idx_sessions_date ON sessions(date DESC);

-- Table des alertes personnalisées (future feature)
CREATE TABLE IF NOT EXISTS alerts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    region VARCHAR(100),
    conditions JSONB,  -- Conditions d'alerte stockées en JSON
    notification_method VARCHAR(50),  -- email, telegram, etc.
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_alerts_user_id ON alerts(user_id);
CREATE INDEX idx_alerts_active ON alerts(active) WHERE active = true;

-- Vues utiles pour les stats (optionnel)

-- Vue : spots par région avec comptage
CREATE OR REPLACE VIEW spots_by_region AS
SELECT
    continent,
    country,
    region,
    COUNT(*) as spot_count,
    AVG(rating) as avg_rating
FROM spots
GROUP BY continent, country, region
ORDER BY continent, country, region;

-- Vue : top spots par note
CREATE OR REPLACE VIEW top_spots AS
SELECT
    id,
    continent,
    country,
    region,
    rating,
    votes,
    type,
    wave_quality
FROM spots
WHERE rating IS NOT NULL
ORDER BY rating DESC, votes DESC
LIMIT 100;

-- Commentaires pour la documentation
COMMENT ON TABLE users IS 'Utilisateurs de l''application';
COMMENT ON TABLE spots IS 'Spots de surf avec toutes leurs caractéristiques';
COMMENT ON TABLE sessions IS 'Historique des sessions de surf des utilisateurs';
COMMENT ON TABLE alerts IS 'Alertes personnalisées pour les conditions de surf';

-- Exemple de données test (à supprimer en production)
-- INSERT INTO users (email, password_hash) VALUES ('test@test.com', '$2b$12$...');
