import {
  boolean,
  index,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { organizations } from "./organizations";

export const customers = pgTable(
  "customers",
  {
    // Customer primary key
    id: uuid("id")
      .defaultRandom()
      .primaryKey(),

    // Tenant ID
    // Every customer belongs to one FAATPRO organization.
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, {
        onDelete: "cascade",
      }),

    // Customer details
    customerCode: varchar(
      "customer_code",
      {
        length: 50,
      },
    ).notNull(),

    customerName: varchar(
      "customer_name",
      {
        length: 200,
      },
    ).notNull(),

    mobile: varchar("mobile", {
      length: 20,
    }),

    email: varchar("email", {
      length: 255,
    }),

    address: varchar("address", {
      length: 500,
    }),

    city: varchar("city", {
      length: 100,
    }),

    state: varchar("state", {
      length: 100,
    }),

    pinCode: varchar("pin_code", {
      length: 10,
    }),

    // Customer active/inactive status
    isActive: boolean("is_active")
      .notNull()
      .default(true),

    // Audit fields
    createdAt: timestamp(
      "created_at",
      {
        withTimezone: true,
      },
    )
      .notNull()
      .defaultNow(),

    updatedAt: timestamp(
      "updated_at",
      {
        withTimezone: true,
      },
    )
      .notNull()
      .defaultNow(),
  },

  (table) => ({
    // Main tenant index
    organizationIdx: index(
      "customers_organization_id_idx",
    ).on(table.organizationId),

    // Useful for tenant + active records
    organizationActiveIdx: index(
      "customers_organization_active_idx",
    ).on(
      table.organizationId,
      table.isActive,
    ),

    // Useful for tenant + customer code
    organizationCodeIdx: index(
      "customers_organization_code_idx",
    ).on(
      table.organizationId,
      table.customerCode,
    ),
  }),
);