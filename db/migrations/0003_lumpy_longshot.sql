ALTER TABLE "branches" ADD COLUMN "created_by" uuid;--> statement-breakpoint
ALTER TABLE "branches" ADD COLUMN "updated_by" uuid;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "created_by" uuid;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "updated_by" uuid;--> statement-breakpoint
ALTER TABLE "financial_years" ADD COLUMN "created_by" uuid;--> statement-breakpoint
ALTER TABLE "financial_years" ADD COLUMN "updated_by" uuid;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "created_by" uuid;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "updated_by" uuid;--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_clerk_organization_id_unique" UNIQUE("clerk_organization_id");--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_slug_unique" UNIQUE("slug");