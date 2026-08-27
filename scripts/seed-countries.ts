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

const countries = [
  {
    name: "India",
    isoCode: "IN",
    iso3Code: "IND",
    phoneCode: "+91",
  },
  {
    name: "United States",
    isoCode: "US",
    iso3Code: "USA",
    phoneCode: "+1",
  },
  {
    name: "United Arab Emirates",
    isoCode: "AE",
    iso3Code: "ARE",
    phoneCode: "+971",
  },
  {
    name: "United Kingdom",
    isoCode: "GB",
    iso3Code: "GBR",
    phoneCode: "+44",
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
        `Seeding countries for: ${organization.name}`,
      );

      for (const country of countries) {
        await client.query(
          `
            INSERT INTO countries (
              organization_id,
              name,
              iso_code,
              iso3_code,
              phone_code,
              is_active
            )
            SELECT
              $1::uuid,
              $2::varchar(100),
              $3::varchar(2),
              $4::varchar(3),
              $5::varchar(10),
              true
            WHERE NOT EXISTS (
              SELECT 1
              FROM countries
              WHERE organization_id = $1::uuid
                AND iso_code = $3::varchar(2)
            )
          `,
          [
            organization.id,
            country.name,
            country.isoCode,
            country.iso3Code,
            country.phoneCode,
          ],
        );
      }
    }

    const result =
      await client.query<{
        organization_id: string;
        name: string;
        iso_code: string | null;
        iso3_code: string | null;
        phone_code: string | null;
      }>(
        `
          SELECT
            organization_id,
            name,
            iso_code,
            iso3_code,
            phone_code
          FROM countries
          ORDER BY organization_id, name
        `,
      );

    console.table(result.rows);

    console.log(
      "Country seed completed successfully.",
    );
  } catch (error) {
    console.error(
      "Country seed failed:",
      error,
    );

    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

void main();