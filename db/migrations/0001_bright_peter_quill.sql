CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"customer_code" varchar(50) NOT NULL,
	"customer_name" varchar(200) NOT NULL,
	"mobile" varchar(20),
	"email" varchar(255),
	"address" varchar(500),
	"city" varchar(100),
	"state" varchar(100),
	"pin_code" varchar(10),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "customers_organization_id_idx" ON "customers" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "customers_organization_active_idx" ON "customers" USING btree ("organization_id","is_active");--> statement-breakpoint
CREATE INDEX "customers_organization_code_idx" ON "customers" USING btree ("organization_id","customer_code");