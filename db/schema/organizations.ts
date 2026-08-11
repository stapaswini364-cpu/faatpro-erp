import {
  boolean,
  index,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const organizations = pgTable(
  "organizations",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    // Clerk Organization ID
    clerkOrganizationId: varchar("clerk_organization_id", {
      length: 255,
    })
      .notNull()
      .unique(),

    name: varchar("name", {
      length: 200,
    }).notNull(),

    slug: varchar("slug", {
      length: 150,
    })
      .notNull()
      .unique(),

    legalName: varchar("legal_name", {
      length: 250,
    }),

    isActive: boolean("is_active").notNull().default(true),

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
    clerkOrganizationIdx: index("organizations_clerk_organization_id_idx").on(
      table.clerkOrganizationId,
    ),

    activeIdx: index("organizations_is_active_idx").on(table.isActive),
  }),
);
