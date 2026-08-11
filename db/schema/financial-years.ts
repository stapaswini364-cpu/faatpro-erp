import {
  boolean,
  date,
  index,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { companies } from "./companies";
import { organizations } from "./organizations";

export const financialYears = pgTable(
  "financial_years",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),

    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),

    name: varchar("name", {
      length: 20,
    }).notNull(),

    startDate: date("start_date").notNull(),

    endDate: date("end_date").notNull(),

    // Soft-delete / active strategy
    isActive: boolean("is_active").notNull().default(true),

    // Financial year closing status
    isClosed: boolean("is_closed").notNull().default(false),

    // Audit fields
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

    createdBy: uuid("created_by"),

    updatedBy: uuid("updated_by"),
  },
  (table) => ({
    organizationIdx: index(
      "financial_years_organization_id_idx",
    ).on(table.organizationId),

    companyIdx: index(
      "financial_years_company_id_idx",
    ).on(table.companyId),

    dateIdx: index(
      "financial_years_start_date_end_date_idx",
    ).on(table.startDate, table.endDate),

    activeIdx: index(
      "financial_years_is_active_idx",
    ).on(table.isActive),

    closedIdx: index(
      "financial_years_is_closed_idx",
    ).on(table.isClosed),
  }),
);