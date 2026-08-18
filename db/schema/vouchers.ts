import {
  pgEnum,
  pgTable,
  uuid,
  varchar,
  text,
  numeric,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { organizations } from "./organizations";

export const voucherStatusEnum = pgEnum(
  "voucher_status",
  [
    "draft",
    "posted",
    "cancelled",
  ],
);

export const voucherTypeEnum = pgEnum(
  "voucher_type",
  [
    "journal",
    "payment",
    "receipt",
    "contra",
    "sale",
    "service",
    "finance",
  ],
);

export const vouchers = pgTable(
  "vouchers",
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

    voucherNumber: varchar(
      "voucher_number",
      {
        length: 100,
      },
    ).notNull(),

    voucherType: voucherTypeEnum(
      "voucher_type",
    ).notNull(),

    voucherDate: timestamp(
      "voucher_date",
      {
        withTimezone: true,
      },
    ).notNull(),

    narration: text("narration"),

    status: voucherStatusEnum(
      "status",
    )
      .default("draft")
      .notNull(),

    totalAmount: numeric(
      "total_amount",
      {
        precision: 18,
        scale: 2,
      },
    )
      .default("0")
      .notNull(),

    createdAt: timestamp(
      "created_at",
      {
        withTimezone: true,
      },
    )
      .defaultNow()
      .notNull(),

    updatedAt: timestamp(
      "updated_at",
      {
        withTimezone: true,
      },
    )
      .defaultNow()
      .notNull(),
  },

  (table) => ({
    organizationIdx: index(
      "vouchers_organization_id_idx",
    ).on(table.organizationId),

    organizationDateIdx: index(
      "vouchers_organization_date_idx",
    ).on(
      table.organizationId,
      table.voucherDate,
    ),

    organizationStatusIdx: index(
      "vouchers_organization_status_idx",
    ).on(
      table.organizationId,
      table.status,
    ),

    organizationNumberUnique: uniqueIndex(
      "vouchers_organization_number_unique",
    ).on(
      table.organizationId,
      table.voucherNumber,
    ),
  }),
);