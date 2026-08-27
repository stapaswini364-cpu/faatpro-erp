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

const cities = [
  ["Odisha", "OD", "Bhubaneswar", "BBSR"],
  ["Odisha", "OD", "Cuttack", "CTC"],
  ["Maharashtra", "MH", "Mumbai", "MUM"],
  ["Maharashtra", "MH", "Pune", "PUN"],
  ["Karnataka", "KA", "Bengaluru", "BLR"],
  ["Tamil Nadu", "TN", "Chennai", "CHE"],
  ["Telangana", "TS", "Hyderabad", "HYD"],
  ["West Bengal", "WB", "Kolkata", "KOL"],
  ["Delhi", "DL", "New Delhi", "DEL"],
  ["Gujarat", "GJ", "Ahmedabad", "AMD"],
  ["Rajasthan", "RJ", "Jaipur", "JAI"],
  ["Uttar Pradesh", "UP", "Lucknow", "LKO"],
  ["Bihar", "BR", "Patna", "PAT"],
  ["Jharkhand", "JH", "Ranchi", "RAN"],
  ["Madhya Pradesh", "MP", "Bhopal", "BHO"],
  ["Kerala", "KL", "Thiruvananthapuram", "TRV"],
  ["Andhra Pradesh", "AP", "Visakhapatnam", "VSKP"],
  ["Punjab", "PB", "Chandigarh", "CDG"],
] as const;

async function main() {
  const client = new pg.Client({
    connectionString: databaseUrl,
  });

  try {
    await client.connect();

    const organizations =
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

    for (const organization of organizations.rows) {
      console.log(
        `Seeding cities for: ${organization.name}`,
      );

      for (const [
        stateName,
        stateCode,
        cityName,
        cityCode,
      ] of cities) {
        const stateResult =
          await client.query<{
            id: string;
          }>(
            `
              SELECT id
              FROM states
              WHERE organization_id = $1::uuid
                AND code = $2::varchar(20)
              LIMIT 1
            `,
            [
              organization.id,
              stateCode,
            ],
          );

        if (stateResult.rows.length === 0) {
          console.warn(
            `State not found: ${stateName} (${stateCode}) for ${organization.name}`,
          );
          continue;
        }

        const countryResult =
          await client.query<{
            id: string;
          }>(
            `
              SELECT id
              FROM countries
              WHERE organization_id = $1::uuid
                AND iso_code = 'IN'
              LIMIT 1
            `,
            [organization.id],
          );

        if (countryResult.rows.length === 0) {
          console.warn(
            `India not found for ${organization.name}`,
          );
          continue;
        }

        await client.query(
          `
            INSERT INTO cities (
              organization_id,
              country_id,
              state_id,
              name,
              code,
              is_active
            )
            SELECT
              $1::uuid,
              $2::uuid,
              $3::uuid,
              $4::varchar(100),
              $5::varchar(20),
              true
            WHERE NOT EXISTS (
              SELECT 1
              FROM cities
              WHERE organization_id = $1::uuid
                AND state_id = $3::uuid
                AND code = $5::varchar(20)
            )
          `,
          [
            organization.id,
            countryResult.rows[0].id,
            stateResult.rows[0].id,
            cityName,
            cityCode,
          ],
        );
      }
    }

    const result =
      await client.query(
        `
          SELECT
            organization_id,
            name,
            code
          FROM cities
          ORDER BY organization_id, name
        `,
      );

    console.table(result.rows);

    console.log(
      "City seed completed successfully.",
    );
  } catch (error) {
    console.error(
      "City seed failed:",
      error,
    );

    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

void main();