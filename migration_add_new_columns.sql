-- Migration pour ajouter les nouvelles colonnes à la table spots
-- Date: 2026-01-12
-- Description: Ajout de frequency_score, wave_quality_score, experience_needed_score, swell_min, swell_max

-- Ajouter les nouvelles colonnes
ALTER TABLE spots ADD COLUMN IF NOT EXISTS frequency_score DECIMAL(3, 2);
ALTER TABLE spots ADD COLUMN IF NOT EXISTS wave_quality_score DECIMAL(3, 2);
ALTER TABLE spots ADD COLUMN IF NOT EXISTS experience_needed_score DECIMAL(3, 2);
ALTER TABLE spots ADD COLUMN IF NOT EXISTS swell_min DECIMAL(4, 2);
ALTER TABLE spots ADD COLUMN IF NOT EXISTS swell_max DECIMAL(4, 2);

-- Créer les index pour optimiser les recherches
CREATE INDEX IF NOT EXISTS idx_spots_wave_quality_score ON spots(wave_quality_score DESC);
CREATE INDEX IF NOT EXISTS idx_spots_frequency_score ON spots(frequency_score DESC);
CREATE INDEX IF NOT EXISTS idx_spots_swell_min ON spots(swell_min);
CREATE INDEX IF NOT EXISTS idx_spots_swell_max ON spots(swell_max);

-- Afficher un message de confirmation
DO $$
BEGIN
    RAISE NOTICE 'Migration terminée avec succès !';
    RAISE NOTICE '5 nouvelles colonnes ajoutées : frequency_score, wave_quality_score, experience_needed_score, swell_min, swell_max';
    RAISE NOTICE '4 nouveaux index créés pour optimiser les recherches';
END $$;
