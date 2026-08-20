import {
  index,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { permissions } from "./permissions";
import { roles } from "./roles";

export const rolePermissions = pgTable(
  "role_permissions",
  {
    id: uuid("id")
      .defaultRandom()
      .primaryKey(),

    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),

    permissionId: uuid("permission_id")
      .notNull()
      .references(() => permissions.id, {
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
    roleIdIdx: index(
      "role_permissions_role_id_idx",
    ).on(table.roleId),

    permissionIdIdx: index(
      "role_permissions_permission_id_idx",
    ).on(table.permissionId),

    rolePermissionUnique: uniqueIndex(
      "role_permissions_role_permission_unique",
    ).on(
      table.roleId,
      table.permissionId,
    ),
  }),
);