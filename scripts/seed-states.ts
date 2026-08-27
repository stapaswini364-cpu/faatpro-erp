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

const indianStates = [
  ["Andhra Pradesh", "AP"],
  ["Arunachal Pradesh", "AR"],
  ["Assam", "AS"],
  ["Bihar", "BR"],
  ["Chhattisgarh", "CG"],
  ["Goa", "GA"],
  ["Gujarat", "GJ"],
  ["Haryana", "HR"],
  ["Himachal Pradesh", "HP"],
  ["Jharkhand", "JH"],
  ["Karnataka", "KA"],
  ["Kerala", "KL"],
  ["Madhya Pradesh", "MP"],
  ["Maharashtra", "MH"],
  ["Manipur", "MN"],
  ["Meghalaya", "ML"],
  ["Mizoram", "MZ"],
  ["Nagaland", "NL"],
  ["Odisha", "OD"],
  ["Punjab", "PB"],
  ["Rajasthan", "RJ"],
  ["Sikkim", "SK"],
  ["Tamil Nadu", "TN"],
  ["Telangana", "TS"],
  ["Tripura", "TR"],
  ["Uttar Pradesh", "UP"],
  ["Uttarakhand", "UK"],
  ["West Bengal", "WB"],
  ["Andaman and Nicobar Islands", "AN"],
  ["Chandigarh", "CH"],
  ["Dadra and Nagar Haveli and Daman and Diu", "DN"],
  ["Delhi", "DL"],
  ["Jammu and Kashmir", "JK"],
  ["Ladakh", "LA"],
  ["Lakshadweep", "LD"],
  ["Puducherry", "PY"],
] as const;

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

    if (organizationsResult.rows.length === 0) {
      throw new Error(
        "No organizations found.",
      );
    }

    const countriesResult =
      await client.query<{
        id: string;
        organization_id: string;
      }>(
        `
          SELECT id, organization_id
          FROM countries
          WHERE iso_code = 'IN'
        `,
      );

    for (const organization of organizationsResult.rows) {
      const country = countriesResult.rows.find(
        (item) =>
          item.organization_id ===
          organization.id,
      );

      if (!country) {
        console.warn(
          `India not found for ${organization.name}`,
        );
        continue;
      }

      console.log(
        `Seeding states for: ${organization.name}`,
      );

      for (const [name, code] of indianStates) {
        await client.query(
          `
            INSERT INTO states (
              organization_id,
              country_id,
              name,
              code,
              is_active
            )
            SELECT
              $1::uuid,
              $2::uuid,
              $3::varchar(100),
              $4::varchar(20),
              true
            WHERE NOT EXISTS (
              SELECT 1
              FROM states
              WHERE organization_id = $1::uuid
                AND country_id = $2::uuid
                AND code = $4::varchar(20)
            )
          `,
          [
            organization.id,
            country.id,
            name,
            code,
          ],
        );
      }
    }

    const result =
      await client.query(
        `
          SELECT
            organization_id,
            country_id,
            name,
            code
          FROM states
          ORDER BY organization_id, name
        `,
      );

    console.table(result.rows);

    console.log(
      "State seed completed successfully.",
    );
  } catch (error) {
    console.error(
      "State seed failed:",
      error,
    );

    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

void main();