CREATE TABLE "ledgers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"ledger_code" varchar(100) NOT NULL,
	"ledger_name" varchar(255) NOT NULL,
	"description" varchar(500),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ledgers" ADD CONSTRAINT "ledgers_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "ledgers_organization_id_idx" ON "ledgers" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "ledgers_organization_active_idx" ON "ledgers" USING btree ("organization_id","is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "ledgers_organization_code_unique" ON "ledgers" USING btree ("organization_id","ledger_code");