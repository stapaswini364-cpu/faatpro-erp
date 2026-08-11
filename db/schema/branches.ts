import {
  boolean,
  index,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { companies } from "./companies";
import { organizations } from "./organizations";

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
    organizationIdx: index("branches_organization_id_idx").on(
      table.organizationId,
    ),

    companyIdx: index("branches_company_id_idx").on(
      table.companyId,
    ),

    codeIdx: index("branches_code_idx").on(table.code),

    gstinIdx: index("branches_gstin_idx").on(table.gstin),

    activeIdx: index("branches_is_active_idx").on(
      table.isActive,
    ),
  }),
);