CREATE TYPE "public"."voucher_status" AS ENUM('draft', 'posted', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."voucher_type" AS ENUM('journal', 'payment', 'receipt', 'contra', 'sale', 'service', 'finance');--> statement-breakpoint
CREATE TABLE "vouchers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"voucher_number" varchar(100) NOT NULL,
	"voucher_type" "voucher_type" NOT NULL,
	"voucher_date" timestamp with time zone NOT NULL,
	"narration" text,
	"status" "voucher_status" DEFAULT 'draft' NOT NULL,
	"total_amount" numeric(18, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "voucher_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"voucher_id" uuid NOT NULL,
	"ledger_id" uuid NOT NULL,
	"debit_amount" numeric(18, 2) DEFAULT '0' NOT NULL,
	"credit_amount" numeric(18, 2) DEFAULT '0' NOT NULL,
	"narration" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "voucher_entries_debit_credit_check" CHECK (
        (
          ("voucher_entries"."debit_amount" > 0 AND "voucher_entries"."credit_amount" = 0)
          OR
          ("voucher_entries"."credit_amount" > 0 AND "voucher_entries"."debit_amount" = 0)
        )
      )
);
--> statement-breakpoint
ALTER TABLE "vouchers" ADD CONSTRAINT "vouchers_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "voucher_entries" ADD CONSTRAINT "voucher_entries_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "voucher_entries" ADD CONSTRAINT "voucher_entries_voucher_id_vouchers_id_fk" FOREIGN KEY ("voucher_id") REFERENCES "public"."vouchers"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "voucher_entries" ADD CONSTRAINT "voucher_entries_ledger_id_ledgers_id_fk" FOREIGN KEY ("ledger_id") REFERENCES "public"."ledgers"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "vouchers_organization_id_idx" ON "vouchers" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "vouchers_organization_date_idx" ON "vouchers" USING btree ("organization_id","voucher_date");--> statement-breakpoint
CREATE INDEX "vouchers_organization_status_idx" ON "vouchers" USING btree ("organization_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "vouchers_organization_number_unique" ON "vouchers" USING btree ("organization_id","voucher_number");--> statement-breakpoint
CREATE INDEX "voucher_entries_organization_id_idx" ON "voucher_entries" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "voucher_entries_voucher_id_idx" ON "voucher_entries" USING btree ("voucher_id");--> statement-breakpoint
CREATE INDEX "voucher_entries_ledger_id_idx" ON "voucher_entries" USING btree ("ledger_id");