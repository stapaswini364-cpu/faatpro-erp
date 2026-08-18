import {
  index,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { organizations } from "./organizations";
import { roles } from "./roles";

export const userRoles = pgTable(
  "user_roles",
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

    userId: varchar("user_id", {
      length: 255,
    }).notNull(),

    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    organizationIdIdx: index(
      "user_roles_organization_id_idx",
    ).on(table.organizationId),

    userIdIdx: index(
      "user_roles_user_id_idx",
    ).on(table.userId),

    roleIdIdx: index(
      "user_roles_role_id_idx",
    ).on(table.roleId),

    organizationUserRoleUnique: uniqueIndex(
      "user_roles_organization_user_role_unique",
    ).on(
      table.organizationId,
      table.userId,
      table.roleId,
    ),
  }),
);