import {
  boolean,
  date,
  index,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { organizations } from "./organizations";
import { countries } from "./countries";
import { states } from "./states";
import { cities } from "./cities";
import { currencies } from "./currencies";

export const companies = pgTable(
  "companies",
  {
    id: uuid("id")
      .defaultRandom()
      .primaryKey(),

    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),

    // ==========================================================
    // COMPANY INFORMATION
    // ==========================================================

    name: varchar("name", {
      length: 200,
    }).notNull(),

    legalName: varchar("legal_name", {
      length: 250,
    }),

    registrationNumber: varchar(
      "registration_number",
      {
        length: 100,
      },
    ),

    gstin: varchar("gstin", {
      length: 15,
    }),

    pan: varchar("pan", {
      length: 10,
    }),

    // ==========================================================
    // ADDRESS
    // ==========================================================

    addressLine1: varchar("address_line_1", {
      length: 250,
    }),

    addressLine2: varchar("address_line_2", {
      length: 250,
    }),

    postalCode: varchar("postal_code", {
      length: 20,
    }),

    // ==========================================================
    // MASTER REFERENCES
    // ==========================================================

    countryId: uuid("country_id").references(
      () => countries.id,
      {
        onDelete: "set null",
        onUpdate: "cascade",
      },
    ),

    stateId: uuid("state_id").references(
      () => states.id,
      {
        onDelete: "set null",
        onUpdate: "cascade",
      },
    ),

    cityId: uuid("city_id").references(
      () => cities.id,
      {
        onDelete: "set null",
        onUpdate: "cascade",
      },
    ),

    currencyId: uuid("currency_id").references(
      () => currencies.id,
      {
        onDelete: "set null",
        onUpdate: "cascade",
      },
    ),

    // ==========================================================
    // LEGACY / BACKWARD COMPATIBILITY FIELDS
    // ==========================================================

    city: varchar("city", {
      length: 100,
    }),

    state: varchar("state", {
      length: 100,
    }),

    country: varchar("country", {
      length: 100,
    })
      .notNull()
      .default("India"),

    baseCurrencyCode: varchar(
      "base_currency_code",
      {
        length: 3,
      },
    )
      .notNull()
      .default("INR"),

    // ==========================================================
    // CONTACT
    // ==========================================================

    email: varchar("email", {
      length: 255,
    }),

    phone: varchar("phone", {
      length: 20,
    }),

    // ==========================================================
    // FINANCIAL YEAR
    // ==========================================================

    financialYearStart: date(
      "financial_year_start",
    ),

    financialYearEnd: date(
      "financial_year_end",
    ),

    // ==========================================================
    // STATUS
    // ==========================================================

    isActive: boolean("is_active")
      .notNull()
      .default(true),

    // ==========================================================
    // AUDIT FIELDS
    // Clerk user IDs are strings, not UUIDs.
    // ==========================================================

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),

    createdBy: varchar("created_by", {
      length: 255,
    }),

    updatedBy: varchar("updated_by", {
      length: 255,
    }),
  },

  (table) => ({
    // Organization
    organizationIdx: index(
      "companies_organization_id_idx",
    ).on(table.organizationId),

    // Master references
    countryIdx: index(
      "companies_country_id_idx",
    ).on(table.countryId),

    stateIdx: index(
      "companies_state_id_idx",
    ).on(table.stateId),

    cityIdx: index(
      "companies_city_id_idx",
    ).on(table.cityId),

    currencyIdx: index(
      "companies_currency_id_idx",
    ).on(table.currencyId),

    // Existing indexes
    gstinIdx: index(
      "companies_gstin_idx",
    ).on(table.gstin),

    panIdx: index(
      "companies_pan_idx",
    ).on(table.pan),

    activeIdx: index(
      "companies_is_active_idx",
    ).on(table.isActive),
  }),
);