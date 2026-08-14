import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function ERPLayout({
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

  return <>{children}</>;
}