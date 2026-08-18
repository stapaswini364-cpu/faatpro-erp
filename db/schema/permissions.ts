import {
  index,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const permissions = pgTable(
  "permissions",
  {
    id: uuid("id")
      .defaultRandom()
      .primaryKey(),

    module: varchar("module", {
      length: 100,
    }).notNull(),

    action: varchar("action", {
      length: 100,
    }).notNull(),

    code: varchar("code", {
      length: 200,
    }).notNull(),

    description: varchar("description", {
      length: 500,
    }),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    codeUnique: uniqueIndex(
      "permissions_code_unique",
    ).on(table.code),

    moduleIdx: index(
      "permissions_module_idx",
    ).on(table.module),
  }),
);