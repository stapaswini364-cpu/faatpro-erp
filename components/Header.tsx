"use client";

import { UserButton } from "@clerk/nextjs";

export default function Header() {
  return (
    <header className="flex items-center justify-between border-b p-4">
      <h1 className="text-xl font-semibold">FAATPRO ERP</h1>

      <div>
        <UserButton />
      </div>
    </header>
  );
}