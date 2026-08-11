import {
  boolean,
  date,
  index,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * ============================================================
 * ORGANIZATIONS
 * ============================================================
 * Top-level tenant.
 *
 * Existing PostgreSQL table:
 * public.organizations
 */
export const organizations = pgTable(
  "organizations",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    clerkOrganizationId: varchar("clerk_organization_id", {
      length: 255,
    }).notNull(),

    name: varchar("name", {
      length: 200,
    }).notNull(),

    slug: varchar("slug", {
      length: 150,
    }).notNull(),

    legalName: varchar("legal_name", {
      length: 250,
    }),

    isActive: boolean("is_active")
      .notNull()
      .default(true),

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
  },
  (table) => [
    index("organizations_clerk_organization_id_idx").on(
      table.clerkOrganizationId,
    ),

    index("organizations_is_active_idx").on(
      table.isActive,
    ),
  ],
);

/**
 * ============================================================
 * COMPANIES
 * ============================================================
 * Legal/accounting entity under an organization.
 */
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

    isActive: boolean("is_active")
      .notNull()
      .default(true),

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
  },
  (table) => [
    index("companies_organization_id_idx").on(
      table.organizationId,
    ),

    index("companies_gstin_idx").on(
      table.gstin,
    ),

    index("companies_pan_idx").on(
      table.pan,
    ),

    index("companies_is_active_idx").on(
      table.isActive,
    ),
  ],
);

/**
 * ============================================================
 * BRANCHES
 * ============================================================
 */
export const branches = pgTable(
  "branches",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),

    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),

    code: varchar("code", {
      length: 50,
    }).notNull(),

    name: varchar("name", {
      length: 200,
    }).notNull(),

    legalName: varchar("legal_name", {
      length: 250,
    }),

    gstin: varchar("gstin", {
      length: 15,
    }),

    phone: varchar("phone", {
      length: 20,
    }),

    email: varchar("email", {
      length: 255,
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

    isHeadOffice: boolean("is_head_office")
      .notNull()
      .default(false),

    isActive: boolean("is_active")
      .notNull()
      .default(true),

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
  },
  (table) => [
    index("branches_organization_id_idx").on(
      table.organizationId,
    ),

    index("branches_company_id_idx").on(
      table.companyId,
    ),

    index("branches_code_idx").on(
      table.code,
    ),

    index("branches_gstin_idx").on(
      table.gstin,
    ),

    index("branches_is_active_idx").on(
      table.isActive,
    ),
  ],
);

/**
 * ============================================================
 * FINANCIAL YEARS
 * ============================================================
 */
export const financialYears = pgTable(
  "financial_years",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),

    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),

    name: varchar("name", {
      length: 20,
    }).notNull(),

    startDate: date("start_date").notNull(),

    endDate: date("end_date").notNull(),

    isActive: boolean("is_active")
      .notNull()
      .default(true),

    isClosed: boolean("is_closed")
      .notNull()
      .default(false),

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
  },
  (table) => [
    index("financial_years_organization_id_idx").on(
      table.organizationId,
    ),

    index("financial_years_company_id_idx").on(
      table.companyId,
    ),

    index("financial_years_is_active_idx").on(
      table.isActive,
    ),

    index("financial_years_is_closed_idx").on(
      table.isClosed,
    ),

    index("financial_years_start_date_end_date_idx").on(
      table.startDate,
      table.endDate,
    ),
  ],
);