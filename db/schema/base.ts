import {
  boolean,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const baseColumns = {
  id: uuid("id").defaultRandom().primaryKey(),

  organizationId: uuid("organization_id").notNull(),

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

  createdBy: uuid("created_by"),

  updatedBy: uuid("updated_by"),

  isActive: boolean("is_active").default(true).notNull(),
};