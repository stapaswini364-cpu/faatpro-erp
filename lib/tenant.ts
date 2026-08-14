import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";

import { getDb } from "../db/connection";
import { organizations } from "../db/schema/organizations";

export async function getTenantContext() {
  const { userId, orgId, orgRole } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  if (!orgId) {
    throw new Error("No organization selected");
  }

  const db = getDb();

  const organization = await db
    .select({
      id: organizations.id,
      clerkOrganizationId: organizations.clerkOrganizationId,
      name: organizations.name,
      slug: organizations.slug,
    })
    .from(organizations)
    .where(
      eq(organizations.clerkOrganizationId, orgId),
    )
    .limit(1);

  if (organization.length === 0) {
    throw new Error("Organization not registered in FAATPRO");
  }

  const tenant = organization[0];

  return {
    userId,

    // Clerk Organization ID
    clerkOrganizationId: tenant.clerkOrganizationId,

    // FAATPRO PostgreSQL Organization UUID
    organizationId: tenant.id,

    organizationName: tenant.name,
    organizationSlug: tenant.slug,

    organizationRole: orgRole,
  };
}