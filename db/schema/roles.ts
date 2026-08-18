import {
  boolean,
  index,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { organizations } from "./organizations";

export const roles = pgTable(
  "roles",
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

    name: varchar("name", {
      length: 100,
    }).notNull(),

    code: varchar("code", {
      length: 100,
    }).notNull(),

    description: varchar("description", {
      length: 500,
    }),

    isSystemRole: boolean("is_system_role")
      .default(false)
      .notNull(),

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
    organizationIdIdx: index(
      "roles_organization_id_idx",
    ).on(table.organizationId),

    organizationCodeUnique: uniqueIndex(
      "roles_organization_code_unique",
    ).on(
      table.organizationId,
      table.code,
    ),

    organizationActiveIdx: index(
      "roles_organization_active_idx",
    ).on(
      table.organizationId,
      table.isActive,
    ),
  }),
);