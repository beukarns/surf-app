-- Agrandir les colonnes qui causent des erreurs "value too long"

ALTER TABLE spots ALTER COLUMN distance TYPE VARCHAR(200);
ALTER TABLE spots ALTER COLUMN walk TYPE VARCHAR(200);
ALTER TABLE spots ALTER COLUMN special_access TYPE VARCHAR(200);
ALTER TABLE spots ALTER COLUMN experience TYPE VARCHAR(200);
ALTER TABLE spots ALTER COLUMN frequency TYPE VARCHAR(200);
ALTER TABLE spots ALTER COLUMN power TYPE VARCHAR(200);
ALTER TABLE spots ALTER COLUMN good_swell_direction TYPE VARCHAR(200);
ALTER TABLE spots ALTER COLUMN good_wind_direction TYPE VARCHAR(200);
ALTER TABLE spots ALTER COLUMN best_tide_position TYPE VARCHAR(200);
ALTER TABLE spots ALTER COLUMN best_tide_movement TYPE VARCHAR(200);

SELECT 'Colonnes agrandies avec succès!' as status;
