import { clerkClient } from "@clerk/nextjs/server";
import { getTenantContext } from "../../lib/tenant";
import OrganizationSwitcherComponent from "../components/OrganizationSwitcher";

export default async function DashboardPage() {
  const {
    userId,
    organizationId,
    organizationRole,
  } = await getTenantContext();

  const client = await clerkClient();

  const organization = await client.organizations.getOrganization({
    organizationId,
  });

  return (
    <main className="p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          FAATPRO ERP
        </h1>

        <OrganizationSwitcherComponent />
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold">
          FAATPRO ERP Dashboard
        </h2>

        <p className="mt-2">
          Welcome to FAATPRO ERP.
        </p>

        <div className="mt-6 rounded-lg border p-4">
          <p>
            <strong>User ID:</strong> {userId}
          </p>

          <p>
            <strong>Tenant ID:</strong> {organizationId}
          </p>

          <p>
            <strong>Organization:</strong> {organization.name}
          </p>

          <p>
            <strong>Role:</strong> {organizationRole}
          </p>
        </div>
      </div>
    </main>
  );
}