import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { getTenantContext } from "@/lib/tenant";
import { requirePermission } from "@/lib/rbac";

export default async function RBACLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId, orgId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  if (!orgId) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">
            Organization Required
          </h1>

          <p className="mt-2">
            Please select or create an organization to continue.
          </p>
        </div>
      </main>
    );
  }

  const tenant = await getTenantContext();

  try {
    await requirePermission(
      tenant.userId,
      tenant.organizationId,
      "role.view",
    );
  } catch {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">
            Access Denied
          </h1>

          <p className="mt-2 text-gray-600">
            You do not have permission to access RBAC management.
          </p>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}