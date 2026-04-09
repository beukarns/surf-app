-- Convertir toutes les colonnes VARCHAR en TEXT pour éviter les limites

ALTER TABLE spots ALTER COLUMN name TYPE TEXT;
ALTER TABLE spots ALTER COLUMN continent TYPE TEXT;
ALTER TABLE spots ALTER COLUMN country TYPE TEXT;
ALTER TABLE spots ALTER COLUMN region TYPE TEXT;
ALTER TABLE spots ALTER COLUMN datum TYPE TEXT;
ALTER TABLE spots ALTER COLUMN precision TYPE TEXT;
ALTER TABLE spots ALTER COLUMN distance TYPE TEXT;
ALTER TABLE spots ALTER COLUMN walk TYPE TEXT;
ALTER TABLE spots ALTER COLUMN easy_to_find TYPE TEXT;
ALTER TABLE spots ALTER COLUMN public_access TYPE TEXT;
ALTER TABLE spots ALTER COLUMN special_access TYPE TEXT;
ALTER TABLE spots ALTER COLUMN wave_quality TYPE TEXT;
ALTER TABLE spots ALTER COLUMN experience TYPE TEXT;
ALTER TABLE spots ALTER COLUMN frequency TYPE TEXT;
ALTER TABLE spots ALTER COLUMN type TYPE TEXT;
ALTER TABLE spots ALTER COLUMN direction TYPE TEXT;
ALTER TABLE spots ALTER COLUMN bottom TYPE TEXT;
ALTER TABLE spots ALTER COLUMN power TYPE TEXT;
ALTER TABLE spots ALTER COLUMN normal_length TYPE TEXT;
ALTER TABLE spots ALTER COLUMN good_day_length TYPE TEXT;
ALTER TABLE spots ALTER COLUMN good_swell_direction TYPE TEXT;
ALTER TABLE spots ALTER COLUMN good_wind_direction TYPE TEXT;
ALTER TABLE spots ALTER COLUMN best_tide_position TYPE TEXT;
ALTER TABLE spots ALTER COLUMN best_tide_movement TYPE TEXT;
ALTER TABLE spots ALTER COLUMN week_crowd TYPE TEXT;
ALTER TABLE spots ALTER COLUMN weekend_crowd TYPE TEXT;
ALTER TABLE spots ALTER COLUMN webcam_url TYPE TEXT;

SELECT 'Toutes les colonnes converties en TEXT - plus de limite de taille !' as status;
