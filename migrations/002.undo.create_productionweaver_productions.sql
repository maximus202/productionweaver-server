ALTER TABLE IF EXISTS productionweaver_elements
DROP COLUMN production_id;

ALTER TABLE IF EXISTS productionweaver_scenes 
DROP COLUMN production_id;

DROP TABLE IF EXISTS productionweaver_productions;