import { auth } from "@clerk/nextjs/server";

export async function getTenantContext() {
  const { userId, orgId, orgRole } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  if (!orgId) {
    throw new Error("No organization selected");
  }

  return {
    userId,
    organizationId: orgId,
    organizationRole: orgRole,
  };
}