import Header from "@/components/Header";

export default function DashboardPage() {
  return (
    <>
      <Header />

      <main className="p-6">
        <h1 className="text-2xl font-bold">
          FAATPRO ERP Dashboard
        </h1>

        <p className="mt-2">
          Welcome to FAATPRO ERP.
        </p>
      </main>
    </>
  );
}