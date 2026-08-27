import {
  boolean,
  index,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { organizations } from "./organizations";
import { countries } from "./countries";
import { states } from "./states";

export const cities = pgTable(
  "cities",
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

    countryId: uuid("country_id")
      .notNull()
      .references(
        () => countries.id,
        {
          onDelete: "cascade",
          onUpdate: "cascade",
        },
      ),

    stateId: uuid("state_id")
      .notNull()
      .references(
        () => states.id,
        {
          onDelete: "cascade",
          onUpdate: "cascade",
        },
      ),

    name: varchar("name", {
      length: 100,
    }).notNull(),

    code: varchar("code", {
      length: 20,
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
      "cities_organization_id_idx",
    ).on(table.organizationId),

    countryIdx: index(
      "cities_country_id_idx",
    ).on(table.countryId),

    stateIdx: index(
      "cities_state_id_idx",
    ).on(table.stateId),

    activeIdx: index(
      "cities_is_active_idx",
    ).on(table.isActive),

    nameIdx: index(
      "cities_name_idx",
    ).on(table.name),
  }),
);