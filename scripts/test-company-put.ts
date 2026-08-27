import { config } from "dotenv";

config({
  path: ".env.local",
});

const companyId =
  "7968788c-d0f4-4a8b-a077-04b2723b83ac";

async function main() {
  const response = await fetch(
    `http://localhost:3000/api/companies/${companyId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "FAATPRO Test Company Updated",
        phone: "9876543210",
      }),
    },
  );

  const text = await response.text();

  console.log("HTTP Status:", response.status);
  console.log("Response:", text);
}

void main();