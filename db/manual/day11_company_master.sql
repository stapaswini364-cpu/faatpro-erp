BEGIN;

-- ============================================================
-- COUNTRIES
-- ============================================================

CREATE TABLE IF NOT EXISTS countries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL,
    name varchar(100) NOT NULL,
    iso_code varchar(2),
    iso3_code varchar(3),
    phone_code varchar(10),
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT countries_organization_id_fk
        FOREIGN KEY (organization_id)
        REFERENCES organizations(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS countries_organization_id_idx
    ON countries (organization_id);

CREATE INDEX IF NOT EXISTS countries_is_active_idx
    ON countries (is_active);

CREATE INDEX IF NOT EXISTS countries_name_idx
    ON countries (name);


-- ============================================================
-- STATES
-- ============================================================

CREATE TABLE IF NOT EXISTS states (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL,
    country_id uuid NOT NULL,
    name varchar(100) NOT NULL,
    code varchar(20),
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT states_organization_id_fk
        FOREIGN KEY (organization_id)
        REFERENCES organizations(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT states_country_id_fk
        FOREIGN KEY (country_id)
        REFERENCES countries(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS states_organization_id_idx
    ON states (organization_id);

CREATE INDEX IF NOT EXISTS states_country_id_idx
    ON states (country_id);

CREATE INDEX IF NOT EXISTS states_is_active_idx
    ON states (is_active);

CREATE INDEX IF NOT EXISTS states_name_idx
    ON states (name);


-- ============================================================
-- CITIES
-- ============================================================

CREATE TABLE IF NOT EXISTS cities (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL,
    country_id uuid NOT NULL,
    state_id uuid NOT NULL,
    name varchar(100) NOT NULL,
    code varchar(20),
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT cities_organization_id_fk
        FOREIGN KEY (organization_id)
        REFERENCES organizations(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT cities_country_id_fk
        FOREIGN KEY (country_id)
        REFERENCES countries(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT cities_state_id_fk
        FOREIGN KEY (state_id)
        REFERENCES states(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS cities_organization_id_idx
    ON cities (organization_id);

CREATE INDEX IF NOT EXISTS cities_country_id_idx
    ON cities (country_id);

CREATE INDEX IF NOT EXISTS cities_state_id_idx
    ON cities (state_id);

CREATE INDEX IF NOT EXISTS cities_is_active_idx
    ON cities (is_active);

CREATE INDEX IF NOT EXISTS cities_name_idx
    ON cities (name);


-- ============================================================
-- CURRENCIES
-- ============================================================

CREATE TABLE IF NOT EXISTS currencies (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL,
    name varchar(100) NOT NULL,
    code varchar(3) NOT NULL,
    symbol varchar(10),
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT currencies_organization_id_fk
        FOREIGN KEY (organization_id)
        REFERENCES organizations(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS currencies_organization_id_idx
    ON currencies (organization_id);

CREATE INDEX IF NOT EXISTS currencies_code_idx
    ON currencies (code);

CREATE INDEX IF NOT EXISTS currencies_is_active_idx
    ON currencies (is_active);


-- ============================================================
-- COMPANIES MASTER REFERENCES
-- Keep old fields for backward compatibility.
-- ============================================================

ALTER TABLE companies
    ADD COLUMN IF NOT EXISTS country_id uuid;

ALTER TABLE companies
    ADD COLUMN IF NOT EXISTS state_id uuid;

ALTER TABLE companies
    ADD COLUMN IF NOT EXISTS city_id uuid;

ALTER TABLE companies
    ADD COLUMN IF NOT EXISTS currency_id uuid;


-- Foreign keys only if not already present
ALTER TABLE companies
    DROP CONSTRAINT IF EXISTS companies_country_id_countries_id_fk;

ALTER TABLE companies
    ADD CONSTRAINT companies_country_id_countries_id_fk
    FOREIGN KEY (country_id)
    REFERENCES countries(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE;


ALTER TABLE companies
    DROP CONSTRAINT IF EXISTS companies_state_id_states_id_fk;

ALTER TABLE companies
    ADD CONSTRAINT companies_state_id_states_id_fk
    FOREIGN KEY (state_id)
    REFERENCES states(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE;


ALTER TABLE companies
    DROP CONSTRAINT IF EXISTS companies_city_id_cities_id_fk;

ALTER TABLE companies
    ADD CONSTRAINT companies_city_id_cities_id_fk
    FOREIGN KEY (city_id)
    REFERENCES cities(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE;


ALTER TABLE companies
    DROP CONSTRAINT IF EXISTS companies_currency_id_currencies_id_fk;

ALTER TABLE companies
    ADD CONSTRAINT companies_currency_id_currencies_id_fk
    FOREIGN KEY (currency_id)
    REFERENCES currencies(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE;


CREATE INDEX IF NOT EXISTS companies_country_id_idx
    ON companies (country_id);

CREATE INDEX IF NOT EXISTS companies_state_id_idx
    ON companies (state_id);

CREATE INDEX IF NOT EXISTS companies_city_id_idx
    ON companies (city_id);

CREATE INDEX IF NOT EXISTS companies_currency_id_idx
    ON companies (currency_id);

COMMIT;