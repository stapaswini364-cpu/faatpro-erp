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

export const companies = pgTable(
  "companies",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),

    name: varchar("name", {
      length: 200,
    }).notNull(),

    legalName: varchar("legal_name", {
      length: 250,
    }),

    registrationNumber: varchar("registration_number", {
      length: 100,
    }),

    gstin: varchar("gstin", {
      length: 15,
    }),

    pan: varchar("pan", {
      length: 10,
    }),

    email: varchar("email", {
      length: 255,
    }),

    phone: varchar("phone", {
      length: 20,
    }),

    addressLine1: varchar("address_line_1", {
      length: 250,
    }),

    addressLine2: varchar("address_line_2", {
      length: 250,
    }),

    city: varchar("city", {
      length: 100,
    }),

    state: varchar("state", {
      length: 100,
    }),

    postalCode: varchar("postal_code", {
      length: 20,
    }),

    country: varchar("country", {
      length: 100,
    })
      .notNull()
      .default("India"),

    baseCurrencyCode: varchar("base_currency_code", {
      length: 3,
    })
      .notNull()
      .default("INR"),

    financialYearStart: date("financial_year_start"),

    financialYearEnd: date("financial_year_end"),

    // Soft-delete / active strategy
    isActive: boolean("is_active").notNull().default(true),

    // Audit fields
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

    createdBy: uuid("created_by"),

    updatedBy: uuid("updated_by"),
  },
  (table) => ({
    organizationIdx: index("companies_organization_id_idx").on(
      table.organizationId,
    ),

    gstinIdx: index("companies_gstin_idx").on(table.gstin),

    panIdx: index("companies_pan_idx").on(table.pan),

    activeIdx: index("companies_is_active_idx").on(table.isActive),
  }),
);