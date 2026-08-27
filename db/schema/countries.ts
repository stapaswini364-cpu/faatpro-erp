import {
  boolean,
  index,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { organizations } from "./organizations";

export const countries = pgTable(
  "countries",
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

    isoCode: varchar("iso_code", {
      length: 2,
    }),

    iso3Code: varchar("iso3_code", {
      length: 3,
    }),

    phoneCode: varchar("phone_code", {
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
      "countries_organization_id_idx",
    ).on(table.organizationId),

    activeIdx: index(
      "countries_is_active_idx",
    ).on(table.isActive),

    nameIdx: index(
      "countries_name_idx",
    ).on(table.name),
  }),
);