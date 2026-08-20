import {
  boolean,
  pgTable,
  uuid,
  varchar,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { organizations } from "./organizations";

export const ledgers = pgTable(
  "ledgers",
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

    ledgerCode: varchar("ledger_code", {
      length: 100,
    }).notNull(),

    ledgerName: varchar("ledger_name", {
      length: 255,
    }).notNull(),

    description: varchar("description", {
      length: 500,
    }),

    isActive: boolean("is_active")
      .default(true)
      .notNull(),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },

  (table) => ({
    organizationIdx: index(
      "ledgers_organization_id_idx",
    ).on(table.organizationId),

    organizationActiveIdx: index(
      "ledgers_organization_active_idx",
    ).on(
      table.organizationId,
      table.isActive,
    ),

    organizationCodeUnique: uniqueIndex(
      "ledgers_organization_code_unique",
    ).on(
      table.organizationId,
      table.ledgerCode,
    ),
  }),
);