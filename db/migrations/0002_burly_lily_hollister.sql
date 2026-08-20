ALTER TABLE "branches" DROP CONSTRAINT "branches_company_id_companies_id_fk";
--> statement-breakpoint
ALTER TABLE "companies" DROP CONSTRAINT "companies_organization_id_organizations_id_fk";
--> statement-breakpoint
ALTER TABLE "financial_years" DROP CONSTRAINT "financial_years_company_id_companies_id_fk";
--> statement-breakpoint
DROP INDEX "idx_branches_company_id";--> statement-breakpoint
DROP INDEX "idx_branches_branch_code";--> statement-breakpoint
DROP INDEX "idx_companies_organization_id";--> statement-breakpoint
DROP INDEX "idx_companies_company_code";--> statement-breakpoint
DROP INDEX "idx_financial_years_company_id";--> statement-breakpoint
DROP INDEX "idx_financial_years_current";--> statement-breakpoint
DROP INDEX "idx_organizations_code";--> statement-breakpoint
ALTER TABLE "branches" ALTER COLUMN "country" SET DEFAULT 'India';--> statement-breakpoint
ALTER TABLE "branches" ALTER COLUMN "country" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "branches" ALTER COLUMN "phone" SET DATA TYPE varchar(20);--> statement-breakpoint
ALTER TABLE "branches" ALTER COLUMN "email" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "companies" ALTER COLUMN "legal_name" SET DATA TYPE varchar(250);--> statement-breakpoint
ALTER TABLE "companies" ALTER COLUMN "email" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "companies" ALTER COLUMN "phone" SET DATA TYPE varchar(20);--> statement-breakpoint
ALTER TABLE "companies" ALTER COLUMN "address_line_1" SET DATA TYPE varchar(250);--> statement-breakpoint
ALTER TABLE "companies" ALTER COLUMN "address_line_2" SET DATA TYPE varchar(250);--> statement-breakpoint
ALTER TABLE "companies" ALTER COLUMN "country" SET DEFAULT 'India';--> statement-breakpoint
ALTER TABLE "companies" ALTER COLUMN "country" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "financial_years" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "financial_years" ALTER COLUMN "updated_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "branches" ADD COLUMN "organization_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "branches" ADD COLUMN "code" varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE "branches" ADD COLUMN "name" varchar(200) NOT NULL;--> statement-breakpoint
ALTER TABLE "branches" ADD COLUMN "legal_name" varchar(250);--> statement-breakpoint
ALTER TABLE "branches" ADD COLUMN "gstin" varchar(15);--> statement-breakpoint
ALTER TABLE "branches" ADD COLUMN "address_line_1" varchar(250);--> statement-breakpoint
ALTER TABLE "branches" ADD COLUMN "address_line_2" varchar(250);--> statement-breakpoint
ALTER TABLE "branches" ADD COLUMN "is_head_office" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "name" varchar(200) NOT NULL;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "registration_number" varchar(100);--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "gstin" varchar(15);--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "pan" varchar(10);--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "base_currency_code" varchar(3) DEFAULT 'INR' NOT NULL;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "financial_year_start" date;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "financial_year_end" date;--> statement-breakpoint
ALTER TABLE "financial_years" ADD COLUMN "organization_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "financial_years" ADD COLUMN "name" varchar(20) NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "clerk_organization_id" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "slug" varchar(150) NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "legal_name" varchar(250);--> statement-breakpoint
ALTER TABLE "branches" ADD CONSTRAINT "branches_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "branches" ADD CONSTRAINT "branches_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "companies" ADD CONSTRAINT "companies_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "financial_years" ADD CONSTRAINT "financial_years_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "financial_years" ADD CONSTRAINT "financial_years_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "branches_organization_id_idx" ON "branches" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "branches_company_id_idx" ON "branches" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "branches_code_idx" ON "branches" USING btree ("code");--> statement-breakpoint
CREATE INDEX "branches_gstin_idx" ON "branches" USING btree ("gstin");--> statement-breakpoint
CREATE INDEX "branches_is_active_idx" ON "branches" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "companies_organization_id_idx" ON "companies" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "companies_gstin_idx" ON "companies" USING btree ("gstin");--> statement-breakpoint
CREATE INDEX "companies_pan_idx" ON "companies" USING btree ("pan");--> statement-breakpoint
CREATE INDEX "companies_is_active_idx" ON "companies" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "financial_years_organization_id_idx" ON "financial_years" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "financial_years_company_id_idx" ON "financial_years" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "financial_years_is_active_idx" ON "financial_years" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "financial_years_is_closed_idx" ON "financial_years" USING btree ("is_closed");--> statement-breakpoint
CREATE INDEX "financial_years_start_date_end_date_idx" ON "financial_years" USING btree ("start_date","end_date");--> statement-breakpoint
CREATE INDEX "organizations_clerk_organization_id_idx" ON "organizations" USING btree ("clerk_organization_id");--> statement-breakpoint
CREATE INDEX "organizations_is_active_idx" ON "organizations" USING btree ("is_active");--> statement-breakpoint
ALTER TABLE "branches" DROP COLUMN "branch_code";--> statement-breakpoint
ALTER TABLE "branches" DROP COLUMN "branch_name";--> statement-breakpoint
ALTER TABLE "branches" DROP COLUMN "address";--> statement-breakpoint
ALTER TABLE "companies" DROP COLUMN "company_code";--> statement-breakpoint
ALTER TABLE "companies" DROP COLUMN "company_name";--> statement-breakpoint
ALTER TABLE "companies" DROP COLUMN "gst_number";--> statement-breakpoint
ALTER TABLE "companies" DROP COLUMN "pan_number";--> statement-breakpoint
ALTER TABLE "companies" DROP COLUMN "cin_number";--> statement-breakpoint
ALTER TABLE "companies" DROP COLUMN "website";--> statement-breakpoint
ALTER TABLE "companies" DROP COLUMN "currency_code";--> statement-breakpoint
ALTER TABLE "companies" DROP COLUMN "financial_year_start_month";--> statement-breakpoint
ALTER TABLE "financial_years" DROP COLUMN "year_name";--> statement-breakpoint
ALTER TABLE "financial_years" DROP COLUMN "is_current";--> statement-breakpoint
ALTER TABLE "financial_years" DROP COLUMN "is_deleted";--> statement-breakpoint
ALTER TABLE "financial_years" DROP COLUMN "created_by";--> statement-breakpoint
ALTER TABLE "financial_years" DROP COLUMN "updated_by";--> statement-breakpoint
ALTER TABLE "organizations" DROP COLUMN "code";--> statement-breakpoint
ALTER TABLE "organizations" DROP COLUMN "email";--> statement-breakpoint
ALTER TABLE "organizations" DROP COLUMN "phone";