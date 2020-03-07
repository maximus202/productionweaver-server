ALTER TABLE IF EXISTS productionweaver_elements
DROP COLUMN scene_id;

ALTER TABLE productionweaver_scenes DROP COLUMN IF EXISTS time_of_day;

DROP TYPE IF EXISTS time_of_day;

ALTER TABLE productionweaver_scenes DROP COLUMN IF EXISTS setting;

DROP TYPE IF EXISTS exterior_interior;

DROP TABLE IF EXISTS productionweaver_scenes;