import {
  pgTable,
  uuid,
  numeric,
  text,
  timestamp,
  index,
  check,
} from "drizzle-orm/pg-core";

import { sql } from "drizzle-orm";

import { organizations } from "./organizations";
import { vouchers } from "./vouchers";
import { ledgers } from "./ledgers";

export const voucherEntries = pgTable(
  "voucher_entries",
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

    voucherId: uuid("voucher_id")
      .notNull()
      .references(() => vouchers.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),

    ledgerId: uuid("ledger_id")
      .notNull()
      .references(() => ledgers.id, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),

    debitAmount: numeric("debit_amount", {
      precision: 18,
      scale: 2,
    })
      .default("0")
      .notNull(),

    creditAmount: numeric("credit_amount", {
      precision: 18,
      scale: 2,
    })
      .default("0")
      .notNull(),

    narration: text("narration"),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },

  (table) => ({
    organizationIdx: index(
      "voucher_entries_organization_id_idx",
    ).on(table.organizationId),

    voucherIdx: index(
      "voucher_entries_voucher_id_idx",
    ).on(table.voucherId),

    ledgerIdx: index(
      "voucher_entries_ledger_id_idx",
    ).on(table.ledgerId),

    debitCreditCheck: check(
      "voucher_entries_debit_credit_check",
      sql`
        (
          (${table.debitAmount} > 0 AND ${table.creditAmount} = 0)
          OR
          (${table.creditAmount} > 0 AND ${table.debitAmount} = 0)
        )
      `,
    ),
  }),
);