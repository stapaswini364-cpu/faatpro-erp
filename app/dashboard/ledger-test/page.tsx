"use client";

import { useState } from "react";

type LedgerData = {
  id: string;
  organizationId?: string;
  ledgerCode?: string;
  ledgerName?: string;
  description?: string | null;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type LedgerResponse = {
  success: boolean;
  message?: string;
  data?: LedgerData;
};

export default function LedgerTestPage() {
  const [ledgerId, setLedgerId] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  // ============================================================
  // CREATE LEDGER
  // ============================================================

  async function createLedger() {
    setLoading(true);
    setResult("Creating ledger...");

    try {
      const response = await fetch("/api/ledgers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ledgerCode: `LED-${Date.now()}`,
          ledgerName: "Tenant Test Ledger",
          description: "RBAC Test Ledger",
        }),
      });

      const data: LedgerResponse =
        await response.json();

      setResult(
        `Status: ${response.status}\n\n${JSON.stringify(
          data,
          null,
          2,
        )}`,
      );

      if (response.ok && data.data?.id) {
        setLedgerId(data.data.id);
      }
    } catch (error) {
      setResult(
        `Request failed:\n${String(error)}`,
      );
    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // GET LEDGER
  // ============================================================

  async function getLedger() {
    if (!ledgerId) {
      setResult("Please create a ledger first.");
      return;
    }

    setLoading(true);
    setResult("Loading ledger...");

    try {
      const response = await fetch(
        `/api/ledgers/${ledgerId}`,
        {
          method: "GET",
        },
      );

      const data: LedgerResponse =
        await response.json();

      setResult(
        `Status: ${response.status}\n\n${JSON.stringify(
          data,
          null,
          2,
        )}`,
      );
    } catch (error) {
      setResult(
        `Request failed:\n${String(error)}`,
      );
    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // UPDATE LEDGER
  // ============================================================

  async function updateLedger() {
    if (!ledgerId) {
      setResult("Please create a ledger first.");
      return;
    }

    setLoading(true);
    setResult("Updating ledger...");

    try {
      const response = await fetch(
        `/api/ledgers/${ledgerId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ledgerCode: "LED-UPDATED",
            ledgerName: "Updated Tenant Ledger",
            description: "Updated RBAC Test Ledger",
          }),
        },
      );

      const data: LedgerResponse =
        await response.json();

      setResult(
        `Status: ${response.status}\n\n${JSON.stringify(
          data,
          null,
          2,
        )}`,
      );
    } catch (error) {
      setResult(
        `Request failed:\n${String(error)}`,
      );
    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // DELETE LEDGER
  // ============================================================

  async function deleteLedger() {
    if (!ledgerId) {
      setResult("Please create a ledger first.");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this ledger?",
    );

    if (!confirmed) {
      return;
    }

    setLoading(true);
    setResult("Deleting ledger...");

    // Keep the ID even after deletion.
    // We need it to verify that GET returns 404.
    const deletedLedgerId = ledgerId;

    try {
      // --------------------------------------------------------
      // STEP 1: DELETE
      // --------------------------------------------------------

      const deleteResponse = await fetch(
        `/api/ledgers/${deletedLedgerId}`,
        {
          method: "DELETE",
        },
      );

      const deleteData: LedgerResponse =
        await deleteResponse.json();

      // If delete failed, stop here.
      if (!deleteResponse.ok) {
        setResult(
          `Delete Status: ${deleteResponse.status}\n\n${JSON.stringify(
            deleteData,
            null,
            2,
          )}`,
        );

        return;
      }

      // --------------------------------------------------------
      // STEP 2: VERIFY DELETION
      // --------------------------------------------------------

      setResult(
        `Delete Status: ${deleteResponse.status}\n\n` +
          `${JSON.stringify(
            deleteData,
            null,
            2,
          )}\n\n` +
          `Verifying deletion...`,
      );

      const verifyResponse = await fetch(
        `/api/ledgers/${deletedLedgerId}`,
        {
          method: "GET",
        },
      );

      const verifyData: LedgerResponse =
        await verifyResponse.json();

      // --------------------------------------------------------
      // FINAL RESULT
      // --------------------------------------------------------

      setResult(
        `Delete Status: ${deleteResponse.status}\n\n` +
          `${JSON.stringify(
            deleteData,
            null,
            2,
          )}\n\n` +
          `Verification GET Status: ${verifyResponse.status}\n\n` +
          `${JSON.stringify(
            verifyData,
            null,
            2,
          )}`,
      );
    } catch (error) {
      setResult(
        `Request failed:\n${String(error)}`,
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
        maxWidth: "900px",
        margin: "40px auto",
        padding: "20px",
      }}
    >
      <h1>Ledger API Test</h1>

      <p>
        Test Ledger CRUD and RBAC permissions.
      </p>

      {/* ======================================================
          CURRENT LEDGER ID
          ====================================================== */}

      <div
        style={{
          marginTop: "25px",
          marginBottom: "25px",
        }}
      >
        <label
          htmlFor="ledgerId"
          style={{
            display: "block",
            fontWeight: 600,
            marginBottom: "8px",
          }}
        >
          Current Ledger ID
        </label>

        <input
          id="ledgerId"
          value={ledgerId}
          onChange={(event) =>
            setLedgerId(event.target.value)
          }
          placeholder="Ledger ID will appear automatically"
          style={{
            width: "100%",
            padding: "10px",
            border: "1px solid #ccc",
            borderRadius: "6px",
          }}
        />
      </div>

      {/* ======================================================
          ACTION BUTTONS
          ====================================================== */}

      <div
        style={{
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
        }}
      >
        <button
          type="button"
          onClick={createLedger}
          disabled={loading}
        >
          {loading
            ? "Processing..."
            : "Create Test Ledger"}
        </button>

        <button
          type="button"
          onClick={getLedger}
          disabled={loading || !ledgerId}
        >
          Get Ledger
        </button>

        <button
          type="button"
          onClick={updateLedger}
          disabled={loading || !ledgerId}
        >
          Update Ledger
        </button>

        <button
          type="button"
          onClick={deleteLedger}
          disabled={loading || !ledgerId}
        >
          Delete Ledger
        </button>
      </div>

      {/* ======================================================
          RESPONSE
          ====================================================== */}

      <div
        style={{
          marginTop: "30px",
        }}
      >
        <h2>Response</h2>

        <pre
          style={{
            background: "#f5f5f5",
            padding: "20px",
            borderRadius: "8px",
            overflowX: "auto",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {result || "No request made yet."}
        </pre>
      </div>
    </main>
  );
}