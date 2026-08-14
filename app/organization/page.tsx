"use client";

import { OrganizationSwitcher } from "@clerk/nextjs";

export default function OrganizationPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md rounded-lg border p-6">
        <h1 className="text-2xl font-bold">
          Select Organization
        </h1>

        <p className="mt-2 text-gray-600">
          Select an organization to continue to FAATPRO ERP.
        </p>

        <div className="mt-6">
          <OrganizationSwitcher
            afterSelectOrganizationUrl="/dashboard"
            afterCreateOrganizationUrl="/dashboard"
          />
        </div>
      </div>
    </main>
  );
}