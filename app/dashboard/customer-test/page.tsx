"use client";

import { useState } from "react";

type CustomerResponse = {
  success?: boolean;
  message?: string;
  data?: {
    id?: string;
    organizationId?: string;
    customerCode?: string;
    customerName?: string;
  };
};

export default function CustomerTestPage() {
  const [customerId, setCustomerId] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  // ============================================================
  // HELPER
  // ============================================================

  function displayResult(
    response: Response,
    data: CustomerResponse,
  ) {
    setResult(
      `Status: ${response.status}\n\n${JSON.stringify(
        data,
        null,
        2,
      )}`,
    );
  }

  // ============================================================
  // CREATE CUSTOMER
  // ============================================================

  async function createCustomer() {
    setLoading(true);
    setResult("Creating customer...");

    try {
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerCode: `CUS-${Date.now()}`,
          customerName: "Tenant Test Customer",
          mobile: "9999999999",
          email: "tenant-test@example.com",
          address: "Test Address",
          city: "Kolkata",
          state: "West Bengal",
          pinCode: "700001",
        }),
      });

      const data: CustomerResponse =
        await response.json();

      displayResult(response, data);

      // Automatically save newly-created customer ID
      if (response.ok && data.data?.id) {
        setCustomerId(data.data.id);
      }
    } catch (error) {
      setResult(
        error instanceof Error
          ? error.message
          : "Request failed",
      );
    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // GET CUSTOMER
  // ============================================================

  async function getCustomer() {
    if (!customerId) {
      setResult(
        "Please create a customer first.",
      );
      return;
    }

    setLoading(true);
    setResult("Loading customer...");

    try {
      const response = await fetch(
        `/api/customers/${customerId}`,
      );

      const data: CustomerResponse =
        await response.json();

      displayResult(response, data);
    } catch (error) {
      setResult(
        error instanceof Error
          ? error.message
          : "Request failed",
      );
    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // UPDATE CUSTOMER
  // ============================================================

  async function updateCustomer() {
    if (!customerId) {
      setResult(
        "Please create a customer first.",
      );
      return;
    }

    setLoading(true);
    setResult("Updating customer...");

    try {
      const response = await fetch(
        `/api/customers/${customerId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            customerCode: "TENANT-UPDATED",
            customerName: "Updated Tenant Customer",
            mobile: "8888888888",
            email: "updated-tenant@example.com",
            address: "Updated Address",
            city: "Bhubaneswar",
            state: "Odisha",
            pinCode: "751001",
            isActive: true,
          }),
        },
      );

      const data: CustomerResponse =
        await response.json();

      displayResult(response, data);
    } catch (error) {
      setResult(
        error instanceof Error
          ? error.message
          : "Request failed",
      );
    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // DELETE CUSTOMER
  // ============================================================

  async function deleteCustomer() {
    if (!customerId) {
      setResult(
        "Please create a customer first.",
      );
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this customer?",
    );

    if (!confirmed) {
      return;
    }

    setLoading(true);
    setResult("Deleting customer...");

    try {
      const response = await fetch(
        `/api/customers/${customerId}`,
        {
          method: "DELETE",
        },
      );

      const data: CustomerResponse =
        await response.json();

      displayResult(response, data);

      // Clear ID after successful deletion
      if (response.ok) {
        setCustomerId("");
      }
    } catch (error) {
      setResult(
        error instanceof Error
          ? error.message
          : "Request failed",
      );
    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // UI
  // ============================================================

  return (
    <main
      style={{
        padding: 40,
        fontFamily: "Arial, sans-serif",
        maxWidth: 1000,
        margin: "0 auto",
      }}
    >
      <h1>Customer API Test</h1>

      <div
        style={{
          marginTop: 20,
          marginBottom: 20,
        }}
      >
        <label
          htmlFor="customerId"
          style={{
            display: "block",
            marginBottom: 8,
            fontWeight: "bold",
          }}
        >
          Current Customer ID
        </label>

        <input
          id="customerId"
          value={customerId}
          onChange={(event) =>
            setCustomerId(event.target.value)
          }
          placeholder="Customer ID will appear automatically"
          style={{
            width: "100%",
            padding: 10,
            border: "1px solid #ccc",
            borderRadius: 4,
          }}
        />
      </div>

      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={createCustomer}
          disabled={loading}
          style={{
            padding: "10px 16px",
            cursor: loading
              ? "not-allowed"
              : "pointer",
          }}
        >
          Create Test Customer
        </button>

        <button
          onClick={getCustomer}
          disabled={loading || !customerId}
          style={{
            padding: "10px 16px",
            cursor:
              loading || !customerId
                ? "not-allowed"
                : "pointer",
          }}
        >
          Get Customer
        </button>

        <button
          onClick={updateCustomer}
          disabled={loading || !customerId}
          style={{
            padding: "10px 16px",
            cursor:
              loading || !customerId
                ? "not-allowed"
                : "pointer",
          }}
        >
          Update Customer
        </button>

        <button
          onClick={deleteCustomer}
          disabled={loading || !customerId}
          style={{
            padding: "10px 16px",
            cursor:
              loading || !customerId
                ? "not-allowed"
                : "pointer",
          }}
        >
          Delete Customer
        </button>
      </div>

      <pre
        style={{
          marginTop: 30,
          padding: 20,
          background: "#f4f4f4",
          whiteSpace: "pre-wrap",
          overflowX: "auto",
        }}
      >
        {result}
      </pre>
    </main>
  );
}