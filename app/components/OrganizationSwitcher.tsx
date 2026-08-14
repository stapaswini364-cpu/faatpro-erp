"use client";

import { OrganizationSwitcher } from "@clerk/nextjs";

export default function OrganizationSwitcherComponent() {
  return (
    <OrganizationSwitcher
      afterCreateOrganizationUrl="/dashboard"
      afterSelectOrganizationUrl="/dashboard"
    />
  );
}