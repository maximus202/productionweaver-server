CREATE TYPE exterior_interior AS ENUM (
    'Ext.',
    'Int.'
);

CREATE TYPE time_of_day AS ENUM (
    'Day',
    'Dusk',
    'Night',
    'Dawn'
);

CREATE TABLE productionweaver_scenes (
    id INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    scene_script_number INTEGER NOT NULL,
    setting exterior_interior NOT NULL,
    location TEXT NOT NULL,
    time_of_day time_of_day NOT NULL,
    short_summary TEXT,
    date_created TIMESTAMP NOT NULL DEFAULT now(),
    production_id INTEGER NOT NULL REFERENCES productionweaver_productions(id) ON DELETE CASCADE,
    owner INTEGER NOT NULL REFERENCES productionweaver_users(id) ON DELETE CASCADE
);