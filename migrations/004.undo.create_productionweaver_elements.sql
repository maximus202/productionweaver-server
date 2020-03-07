ALTER TABLE productionweaver_elements DROP COLUMN IF EXISTS category;

DROP TYPE IF EXISTS element_category;

DROP TABLE IF EXISTS productionweaver_elements;