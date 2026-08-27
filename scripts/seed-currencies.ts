import { config } from "dotenv";
import pg from "pg";

config({
  path: ".env.local",
});

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is missing from .env.local",
  );
}

const currencies = [
  {
    name: "Indian Rupee",
    code: "INR",
    symbol: "₹",
  },
  {
    name: "United States Dollar",
    code: "USD",
    symbol: "$",
  },
  {
    name: "Euro",
    code: "EUR",
    symbol: "€",
  },
  {
    name: "British Pound",
    code: "GBP",
    symbol: "£",
  },
  {
    name: "United Arab Emirates Dirham",
    code: "AED",
    symbol: "د.إ",
  },
];

async function main() {
  const client = new pg.Client({
    connectionString: databaseUrl,
  });

  try {
    await client.connect();

    const organizationsResult =
      await client.query<{
        id: string;
        name: string;
      }>(
        `
          SELECT id, name
          FROM organizations
          ORDER BY name
        `,
      );

    if (
      organizationsResult.rows.length === 0
    ) {
      throw new Error(
        "No organizations found.",
      );
    }

    for (const organization of
      organizationsResult.rows) {
      console.log(
        `Seeding currencies for: ${organization.name}`,
      );

      for (const currency of currencies) {
        await client.query(
          `
            INSERT INTO currencies (
              organization_id,
              name,
              code,
              symbol,
              is_active
            )
            SELECT
              $1::uuid,
              $2::varchar(100),
              $3::varchar(3),
              $4::varchar(10),
              true
            WHERE NOT EXISTS (
              SELECT 1
              FROM currencies
              WHERE organization_id = $1::uuid
                AND code = $3::varchar(3)
            )
          `,
          [
            organization.id,
            currency.name,
            currency.code,
            currency.symbol,
          ],
        );
      }
    }

    const result =
      await client.query<{
        organization_id: string;
        name: string;
        code: string;
        symbol: string | null;
      }>(
        `
          SELECT
            organization_id,
            name,
            code,
            symbol
          FROM currencies
          ORDER BY organization_id, code
        `,
      );

    console.table(result.rows);

    console.log(
      "Currency seed completed successfully.",
    );
  } catch (error) {
    console.error(
      "Currency seed failed:",
      error,
    );

    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

void main();