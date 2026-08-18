"use client";

import { useState } from "react";

type ApiResponseData = {
  id?: string;
  [key: string]: unknown;
};

type ApiResponse = {
  success: boolean;
  message?: string;
  data?: ApiResponseData;
};

export default function VoucherTestPage() {
  const [voucherId, setVoucherId] = useState("");
  const [result, setResult] = useState(
    "No request made yet.",
  );
  const [loading, setLoading] = useState(false);

  const [ledgerId1, setLedgerId1] =
    useState("");
  const [ledgerId2, setLedgerId2] =
    useState("");

  const [debitAmount, setDebitAmount] =
    useState("10000");

  const [voucherNumber, setVoucherNumber] =
    useState("");

  async function handleResponse(
    response: Response,
  ) {
    const text = await response.text();

    let data: ApiResponse;

    try {
      data = JSON.parse(text) as ApiResponse;
    } catch {
      throw new Error(
        `Server returned non-JSON response (${response.status})`,
      );
    }

    setResult(
      `Status: ${response.status}\n\n${JSON.stringify(
        data,
        null,
        2,
      )}`,
    );

    return data;
  }

  // ============================================================
  // CREATE
  // ============================================================

  async function createVoucher() {
    if (!ledgerId1 || !ledgerId2) {
      setResult(
        "Please enter two valid Ledger IDs.",
      );
      return;
    }

    if (ledgerId1 === ledgerId2) {
      setResult(
        "Debit and Credit ledger IDs must be different.",
      );
      return;
    }

    const amount = Number(debitAmount);

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      setResult(
        "Please enter a valid amount.",
      );
      return;
    }

    setLoading(true);
    setResult("Creating voucher...");

    try {
      const generatedNumber =
        `JV-${Date.now()}`;

      setVoucherNumber(
        generatedNumber,
      );

      const response = await fetch(
        "/api/vouchers",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            voucherNumber:
              generatedNumber,

            voucherType: "journal",

            voucherDate:
              new Date().toISOString(),

            narration:
              "Voucher API Test",

            entries: [
              {
                ledgerId: ledgerId1,
                debitAmount:
                  amount.toFixed(2),
                creditAmount: "0",
                narration:
                  "Test Debit",
              },
              {
                ledgerId: ledgerId2,
                debitAmount: "0",
                creditAmount:
                  amount.toFixed(2),
                narration:
                  "Test Credit",
              },
            ],
          }),
        },
      );

      const data =
        await handleResponse(
          response,
        );

      if (
        response.ok &&
        data.data?.id
      ) {
        setVoucherId(
          data.data.id,
        );
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
  // GET
  // ============================================================

  async function getVoucher() {
    if (!voucherId) {
      setResult(
        "Please create a voucher first.",
      );
      return;
    }

    setLoading(true);
    setResult("Loading voucher...");

    try {
      const response =
        await fetch(
          `/api/vouchers/${voucherId}`,
        );

      await handleResponse(
        response,
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
  // UPDATE
  // ============================================================

  async function updateVoucher() {
    if (!voucherId) {
      setResult(
        "Please create a voucher first.",
      );
      return;
    }

    setLoading(true);
    setResult("Updating voucher...");

    try {
      const response =
        await fetch(
          `/api/vouchers/${voucherId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              narration:
                "Updated Voucher API Test",
            }),
          },
        );

      await handleResponse(
        response,
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
  // POST
  // ============================================================

  async function postVoucher() {
    if (!voucherId) {
      setResult(
        "Please create a voucher first.",
      );
      return;
    }

    setLoading(true);
    setResult("Posting voucher...");

    try {
      const response =
        await fetch(
          `/api/vouchers/${voucherId}/post`,
          {
            method: "POST",
          },
        );

      await handleResponse(
        response,
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
  // CANCEL
  // ============================================================

  async function cancelVoucher() {
    if (!voucherId) {
      setResult(
        "Please create a voucher first.",
      );
      return;
    }

    const confirmed =
      window.confirm(
        "Are you sure you want to cancel this voucher?",
      );

    if (!confirmed) {
      return;
    }

    setLoading(true);
    setResult("Cancelling voucher...");

    try {
      const response =
        await fetch(
          `/api/vouchers/${voucherId}/cancel`,
          {
            method: "POST",
          },
        );

      await handleResponse(
        response,
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
  // DELETE
  // ============================================================

  async function deleteVoucher() {
    if (!voucherId) {
      setResult(
        "Please create a voucher first.",
      );
      return;
    }

    const confirmed =
      window.confirm(
        "Delete this draft voucher?",
      );

    if (!confirmed) {
      return;
    }

    setLoading(true);
    setResult("Deleting voucher...");

    try {
      const response =
        await fetch(
          `/api/vouchers/${voucherId}`,
          {
            method: "DELETE",
          },
        );

      const data =
        await handleResponse(
          response,
        );

      if (response.ok) {
        setVoucherId("");
      }

      return data;
    } catch (error) {
      setResult(
        `Request failed:\n${String(error)}`,
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        maxWidth: "1000px",
        margin: "40px auto",
        padding: "20px",
        fontFamily:
          "Arial, sans-serif",
      }}
    >
      <h1>Voucher API Test</h1>

      <p>
        Test Voucher CRUD, Post and
        Cancel operations.
      </p>

      <hr />

      {/* ======================================================
          VOUCHER ID
      ======================================================= */}

      <div
        style={{
          marginTop: "25px",
        }}
      >
        <label
          style={{
            display: "block",
            fontWeight: 600,
            marginBottom: "8px",
          }}
        >
          Current Voucher ID
        </label>

        <input
          value={voucherId}
          onChange={(e) =>
            setVoucherId(
              e.target.value,
            )
          }
          placeholder="Voucher ID will appear after creation"
          style={{
            width: "100%",
            padding: "10px",
            border:
              "1px solid #ccc",
            borderRadius: "6px",
          }}
        />
      </div>

      {/* ======================================================
          LEDGER 1
      ======================================================= */}

      <div
        style={{
          marginTop: "20px",
        }}
      >
        <label
          style={{
            display: "block",
            fontWeight: 600,
            marginBottom: "8px",
          }}
        >
          Debit Ledger ID
        </label>

        <input
          value={ledgerId1}
          onChange={(e) =>
            setLedgerId1(
              e.target.value,
            )
          }
          placeholder="Enter existing ledger UUID"
          style={{
            width: "100%",
            padding: "10px",
            border:
              "1px solid #ccc",
            borderRadius: "6px",
          }}
        />
      </div>

      {/* ======================================================
          LEDGER 2
      ======================================================= */}

      <div
        style={{
          marginTop: "20px",
        }}
      >
        <label
          style={{
            display: "block",
            fontWeight: 600,
            marginBottom: "8px",
          }}
        >
          Credit Ledger ID
        </label>

        <input
          value={ledgerId2}
          onChange={(e) =>
            setLedgerId2(
              e.target.value,
            )
          }
          placeholder="Enter another existing ledger UUID"
          style={{
            width: "100%",
            padding: "10px",
            border:
              "1px solid #ccc",
            borderRadius: "6px",
          }}
        />
      </div>

      {/* ======================================================
          AMOUNT
      ======================================================= */}

      <div
        style={{
          marginTop: "20px",
        }}
      >
        <label
          style={{
            display: "block",
            fontWeight: 600,
            marginBottom: "8px",
          }}
        >
          Amount
        </label>

        <input
          type="number"
          min="0"
          step="0.01"
          value={debitAmount}
          onChange={(e) =>
            setDebitAmount(
              e.target.value,
            )
          }
          style={{
            width: "100%",
            padding: "10px",
            border:
              "1px solid #ccc",
            borderRadius: "6px",
          }}
        />
      </div>

      {/* ======================================================
          VOUCHER NUMBER
      ======================================================= */}

      <div
        style={{
          marginTop: "20px",
        }}
      >
        <label
          style={{
            display: "block",
            fontWeight: 600,
            marginBottom: "8px",
          }}
        >
          Voucher Number
        </label>

        <input
          value={voucherNumber}
          readOnly
          placeholder="Generated automatically"
          style={{
            width: "100%",
            padding: "10px",
            border:
              "1px solid #ccc",
            borderRadius: "6px",
            background:
              "#f5f5f5",
          }}
        />
      </div>

      {/* ======================================================
          BUTTONS
      ======================================================= */}

      <div
        style={{
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
          marginTop: "30px",
        }}
      >
        <button
          onClick={createVoucher}
          disabled={loading}
        >
          Create Test Voucher
        </button>

        <button
          onClick={getVoucher}
          disabled={
            loading || !voucherId
          }
        >
          Get Voucher
        </button>

        <button
          onClick={updateVoucher}
          disabled={
            loading || !voucherId
          }
        >
          Update Draft
        </button>

        <button
          onClick={postVoucher}
          disabled={
            loading || !voucherId
          }
        >
          Post Voucher
        </button>

        <button
          onClick={cancelVoucher}
          disabled={
            loading || !voucherId
          }
        >
          Cancel Voucher
        </button>

        <button
          onClick={deleteVoucher}
          disabled={
            loading || !voucherId
          }
        >
          Delete Draft
        </button>
      </div>

      {/* ======================================================
          RESPONSE
      ======================================================= */}

      <div
        style={{
          marginTop: "35px",
        }}
      >
        <h2>Response</h2>

        <pre
          style={{
            background:
              "#f5f5f5",
            padding: "20px",
            borderRadius: "8px",
            overflowX: "auto",
            whiteSpace:
              "pre-wrap",
            minHeight: "200px",
          }}
        >
          {result}
        </pre>
      </div>
    </main>
  );
}