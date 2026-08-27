import {
  boolean,
  index,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { organizations } from "./organizations";

export const currencies = pgTable(
  "currencies",
  {
    id: uuid("id")
      .defaultRandom()
      .primaryKey(),

    organizationId: uuid("organization_id")
      .notNull()
      .references(
        () => organizations.id,
        {
          onDelete: "cascade",
          onUpdate: "cascade",
        },
      ),

    name: varchar("name", {
      length: 100,
    }).notNull(),

    code: varchar("code", {
      length: 3,
    }).notNull(),

    symbol: varchar("symbol", {
      length: 10,
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
  (table) => ({
    organizationIdx: index(
      "currencies_organization_id_idx",
    ).on(table.organizationId),

    codeIdx: index(
      "currencies_code_idx",
    ).on(table.code),

    activeIdx: index(
      "currencies_is_active_idx",
    ).on(table.isActive),
  }),
);