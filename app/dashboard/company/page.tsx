"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";

type Country = {
  id: string;
  name: string;
  isoCode?: string | null;
};

type State = {
  id: string;
  name: string;
  code?: string | null;
  countryId: string;
};

type City = {
  id: string;
  name: string;
  code?: string | null;
  countryId: string;
  stateId: string;
};

type Currency = {
  id: string;
  name: string;
  code: string;
  symbol?: string | null;
};

type Company = {
  id: string;
  name: string;
  legalName?: string | null;
  registrationNumber?: string | null;
  gstin?: string | null;
  pan?: string | null;
  email?: string | null;
  phone?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  postalCode?: string | null;
  country?: string | null;
  state?: string | null;
  city?: string | null;
  baseCurrencyCode?: string | null;
  countryId?: string | null;
  stateId?: string | null;
  cityId?: string | null;
  currencyId?: string | null;
  financialYearStart?: string | null;
  financialYearEnd?: string | null;
  isActive?: boolean;
};

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
  count?: number;
};

type CompanyForm = {
  name: string;
  legalName: string;
  registrationNumber: string;
  gstin: string;
  pan: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  postalCode: string;
  countryId: string;
  stateId: string;
  cityId: string;
  currencyId: string;
  financialYearStart: string;
  financialYearEnd: string;
};

const emptyForm: CompanyForm = {
  name: "",
  legalName: "",
  registrationNumber: "",
  gstin: "",
  pan: "",
  email: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  postalCode: "",
  countryId: "",
  stateId: "",
  cityId: "",
  currencyId: "",
  financialYearStart: "",
  financialYearEnd: "",
};

export default function CompanyPage() {
  const [countries, setCountries] =
    useState<Country[]>([]);

  const [states, setStates] =
    useState<State[]>([]);

  const [cities, setCities] =
    useState<City[]>([]);

  const [currencies, setCurrencies] =
    useState<Currency[]>([]);

  const [companies, setCompanies] =
    useState<Company[]>([]);

  const [form, setForm] =
    useState<CompanyForm>({
      ...emptyForm,
    });

  const [editingCompanyId, setEditingCompanyId] =
    useState<string | null>(null);

  const [loadingMasters, setLoadingMasters] =
    useState(true);

  const [loadingStates, setLoadingStates] =
    useState(false);

  const [loadingCities, setLoadingCities] =
    useState(false);

  const [loadingCompanies, setLoadingCompanies] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [deletingCompanyId, setDeletingCompanyId] =
    useState<string | null>(null);

  const [error, setError] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  // ==========================================================
  // LOAD COMPANIES
  // ==========================================================

  const loadCompanies = useCallback(
    async () => {
      try {
        setLoadingCompanies(true);

        const response = await fetch(
          "/api/companies",
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          },
        );

        const result =
          (await response.json()) as ApiResponse<
            Company[]
          >;

        if (
          !response.ok ||
          !result.success
        ) {
          throw new Error(
            result.message ??
              "Failed to load companies",
          );
        }

        setCompanies(
          Array.isArray(result.data)
            ? result.data
            : [],
        );
      } catch (err) {
        console.error(
          "Load companies error:",
          err,
        );

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load companies",
        );
      } finally {
        setLoadingCompanies(false);
      }
    },
    [],
  );

  // ==========================================================
  // LOAD COUNTRIES + CURRENCIES
  // ==========================================================

  const loadMasterData =
    useCallback(async () => {
      try {
        setLoadingMasters(true);
        setError("");

        const [
          countriesResponse,
          currenciesResponse,
        ] = await Promise.all([
          fetch(
            "/api/countries",
            {
              credentials: "include",
              cache: "no-store",
            },
          ),
          fetch(
            "/api/currencies",
            {
              credentials: "include",
              cache: "no-store",
            },
          ),
        ]);

        const countriesResult =
          (await countriesResponse.json()) as ApiResponse<
            Country[]
          >;

        const currenciesResult =
          (await currenciesResponse.json()) as ApiResponse<
            Currency[]
          >;

        if (
          !countriesResponse.ok ||
          !countriesResult.success
        ) {
          throw new Error(
            countriesResult.message ??
              "Failed to load countries",
          );
        }

        if (
          !currenciesResponse.ok ||
          !currenciesResult.success
        ) {
          throw new Error(
            currenciesResult.message ??
              "Failed to load currencies",
          );
        }

        setCountries(
          Array.isArray(
            countriesResult.data,
          )
            ? countriesResult.data
            : [],
        );

        setCurrencies(
          Array.isArray(
            currenciesResult.data,
          )
            ? currenciesResult.data
            : [],
        );
      } catch (err) {
        console.error(
          "Load master data error:",
          err,
        );

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load master data",
        );
      } finally {
        setLoadingMasters(false);
      }
    }, []);

  useEffect(() => {
    void loadMasterData();
    void loadCompanies();
  }, [
    loadMasterData,
    loadCompanies,
  ]);

  // ==========================================================
  // GENERIC CHANGE
  // ==========================================================

  const handleChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement
    >,
  ) => {
    const {
      name,
      value,
    } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setError("");
    setSuccessMessage("");
  };

  // ==========================================================
  // LOAD STATES
  // ==========================================================

  const loadStates = async (
    countryId: string,
  ) => {
    if (!countryId) {
      setStates([]);
      return;
    }

    try {
      setLoadingStates(true);

      const response = await fetch(
        `/api/states?countryId=${encodeURIComponent(
          countryId,
        )}`,
        {
          credentials: "include",
          cache: "no-store",
        },
      );

      const result =
        (await response.json()) as ApiResponse<
          State[]
        >;

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.message ??
            "Failed to load states",
        );
      }

      setStates(
        Array.isArray(result.data)
          ? result.data
          : [],
      );
    } catch (err) {
      console.error(
        "Load states error:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load states",
      );
    } finally {
      setLoadingStates(false);
    }
  };

  // ==========================================================
  // LOAD CITIES
  // ==========================================================

  const loadCities = async (
    stateId: string,
  ) => {
    if (!stateId) {
      setCities([]);
      return;
    }

    try {
      setLoadingCities(true);

      const response = await fetch(
        `/api/cities?stateId=${encodeURIComponent(
          stateId,
        )}`,
        {
          credentials: "include",
          cache: "no-store",
        },
      );

      const result =
        (await response.json()) as ApiResponse<
          City[]
        >;

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.message ??
            "Failed to load cities",
        );
      }

      setCities(
        Array.isArray(result.data)
          ? result.data
          : [],
      );
    } catch (err) {
      console.error(
        "Load cities error:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load cities",
      );
    } finally {
      setLoadingCities(false);
    }
  };

  // ==========================================================
  // COUNTRY CHANGE
  // ==========================================================

  const handleCountryChange = async (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const countryId =
      event.target.value;

    setForm((current) => ({
      ...current,
      countryId,
      stateId: "",
      cityId: "",
    }));

    setStates([]);
    setCities([]);
    setError("");
    setSuccessMessage("");

    await loadStates(countryId);
  };

  // ==========================================================
  // STATE CHANGE
  // ==========================================================

  const handleStateChange = async (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const stateId =
      event.target.value;

    setForm((current) => ({
      ...current,
      stateId,
      cityId: "",
    }));

    setCities([]);
    setError("");
    setSuccessMessage("");

    await loadCities(stateId);
  };

  // ==========================================================
  // RESET FORM
  // ==========================================================

  const resetForm = () => {
    setForm({
      ...emptyForm,
    });

    setStates([]);
    setCities([]);
    setEditingCompanyId(null);
    setError("");
    setSuccessMessage("");
  };

  // ==========================================================
  // EDIT COMPANY
  // ==========================================================

  const handleEdit = async (
    company: Company,
  ) => {
    setError("");
    setSuccessMessage("");

    setEditingCompanyId(
      company.id,
    );

    setForm({
      name: company.name ?? "",
      legalName:
        company.legalName ?? "",
      registrationNumber:
        company.registrationNumber ??
        "",
      gstin:
        company.gstin ?? "",
      pan:
        company.pan ?? "",
      email:
        company.email ?? "",
      phone:
        company.phone ?? "",
      addressLine1:
        company.addressLine1 ??
        "",
      addressLine2:
        company.addressLine2 ??
        "",
      postalCode:
        company.postalCode ?? "",
      countryId:
        company.countryId ?? "",
      stateId:
        company.stateId ?? "",
      cityId:
        company.cityId ?? "",
      currencyId:
        company.currencyId ?? "",
      financialYearStart:
        company.financialYearStart ??
        "",
      financialYearEnd:
        company.financialYearEnd ??
        "",
    });

    setStates([]);
    setCities([]);

    if (company.countryId) {
      await loadStates(
        company.countryId,
      );
    }

    if (company.stateId) {
      await loadCities(
        company.stateId,
      );
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ==========================================================
  // CREATE / UPDATE COMPANY
  // ==========================================================

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setError("");
    setSuccessMessage("");

    if (!form.name.trim()) {
      setError(
        "Company Name is required.",
      );
      return;
    }

    if (!form.countryId) {
      setError(
        "Country is required.",
      );
      return;
    }

    if (!form.currencyId) {
      setError(
        "Currency is required.",
      );
      return;
    }

    try {
      setSaving(true);

      const isEditing =
        Boolean(editingCompanyId);

      const url = isEditing
        ? `/api/companies/${editingCompanyId}`
        : "/api/companies";

      const method = isEditing
        ? "PUT"
        : "POST";

      const response = await fetch(
        url,
        {
          method,
          credentials: "include",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            name:
              form.name.trim(),

            legalName:
              form.legalName.trim() ||
              null,

            registrationNumber:
              form.registrationNumber.trim() ||
              null,

            gstin:
              form.gstin.trim() ||
              null,

            pan:
              form.pan.trim() ||
              null,

            email:
              form.email.trim() ||
              null,

            phone:
              form.phone.trim() ||
              null,

            addressLine1:
              form.addressLine1.trim() ||
              null,

            addressLine2:
              form.addressLine2.trim() ||
              null,

            postalCode:
              form.postalCode.trim() ||
              null,

            countryId:
              form.countryId,

            stateId:
              form.stateId ||
              null,

            cityId:
              form.cityId ||
              null,

            currencyId:
              form.currencyId,

            financialYearStart:
              form.financialYearStart ||
              null,

            financialYearEnd:
              form.financialYearEnd ||
              null,
          }),
        },
      );

      const result =
        (await response.json()) as ApiResponse<Company>;

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.message ??
            (isEditing
              ? "Failed to update company"
              : "Failed to create company"),
        );
      }

      setSuccessMessage(
        isEditing
          ? "Company updated successfully."
          : "Company created successfully.",
      );

      resetForm();

      await loadCompanies();
    } catch (err) {
      console.error(
        "Save company error:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to save company",
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================================
  // DELETE COMPANY
  // ==========================================================

  const handleDelete = async (
    company: Company,
  ) => {
    const confirmed =
      window.confirm(
        `Are you sure you want to delete "${company.name}"?`,
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingCompanyId(
        company.id,
      );

      setError("");
      setSuccessMessage("");

      const response = await fetch(
        `/api/companies/${company.id}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );

      const result =
        (await response.json()) as ApiResponse<Company>;

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.message ??
            "Failed to delete company",
        );
      }

      setSuccessMessage(
        "Company deleted successfully.",
      );

      if (
        editingCompanyId ===
        company.id
      ) {
        resetForm();
      }

      await loadCompanies();
    } catch (err) {
      console.error(
        "Delete company error:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete company",
      );
    } finally {
      setDeletingCompanyId(
        null,
      );
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* ======================================================
            PAGE HEADER
        ====================================================== */}

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Company Management
          </h1>

          <p className="mt-2 text-sm text-gray-600">
            Manage companies, addresses,
            contacts, currency and
            location masters for your
            organization.
          </p>
        </div>

        {/* ======================================================
            MESSAGES
        ====================================================== */}

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {successMessage}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px]">
          {/* ====================================================
              FORM
          ==================================================== */}

          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingCompanyId
                    ? "Edit Company"
                    : "Create Company"}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {editingCompanyId
                    ? "Update company information."
                    : "Enter company and location details."}
                </p>
              </div>

              {editingCompanyId && (
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={saving}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel Edit
                </button>
              )}
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-8"
            >
              {/* =================================================
                  COMPANY INFORMATION
              ================================================= */}

              <section>
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-700">
                  Company Information
                </h3>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label
                      htmlFor="name"
                      className="mb-1.5 block text-sm font-medium text-gray-700"
                    >
                      Company Name{" "}
                      <span className="text-red-500">
                        *
                      </span>
                    </label>

                    <input
                      id="name"
                      name="name"
                      value={form.name}
                      onChange={
                        handleChange
                      }
                      placeholder="Enter company name"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="legalName"
                      className="mb-1.5 block text-sm font-medium text-gray-700"
                    >
                      Legal Name
                    </label>

                    <input
                      id="legalName"
                      name="legalName"
                      value={
                        form.legalName
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Enter legal name"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="registrationNumber"
                      className="mb-1.5 block text-sm font-medium text-gray-700"
                    >
                      Registration Number
                    </label>

                    <input
                      id="registrationNumber"
                      name="registrationNumber"
                      value={
                        form.registrationNumber
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Enter registration number"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="gstin"
                      className="mb-1.5 block text-sm font-medium text-gray-700"
                    >
                      GSTIN
                    </label>

                    <input
                      id="gstin"
                      name="gstin"
                      value={form.gstin}
                      onChange={
                        handleChange
                      }
                      maxLength={15}
                      placeholder="Enter GSTIN"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm uppercase outline-none focus:border-black focus:ring-1 focus:ring-black"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="pan"
                      className="mb-1.5 block text-sm font-medium text-gray-700"
                    >
                      PAN
                    </label>

                    <input
                      id="pan"
                      name="pan"
                      value={form.pan}
                      onChange={
                        handleChange
                      }
                      maxLength={10}
                      placeholder="Enter PAN"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm uppercase outline-none focus:border-black focus:ring-1 focus:ring-black"
                    />
                  </div>
                </div>
              </section>

              {/* =================================================
                  ADDRESS
              ================================================= */}

              <section>
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-700">
                  Address
                </h3>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label
                      htmlFor="addressLine1"
                      className="mb-1.5 block text-sm font-medium text-gray-700"
                    >
                      Address Line 1
                    </label>

                    <input
                      id="addressLine1"
                      name="addressLine1"
                      value={
                        form.addressLine1
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Enter address"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label
                      htmlFor="addressLine2"
                      className="mb-1.5 block text-sm font-medium text-gray-700"
                    >
                      Address Line 2
                    </label>

                    <input
                      id="addressLine2"
                      name="addressLine2"
                      value={
                        form.addressLine2
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Apartment, area, landmark"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="countryId"
                      className="mb-1.5 block text-sm font-medium text-gray-700"
                    >
                      Country{" "}
                      <span className="text-red-500">
                        *
                      </span>
                    </label>

                    <select
                      id="countryId"
                      name="countryId"
                      value={
                        form.countryId
                      }
                      onChange={
                        handleCountryChange
                      }
                      disabled={
                        loadingMasters ||
                        saving
                      }
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black disabled:bg-gray-100"
                      required
                    >
                      <option value="">
                        {loadingMasters
                          ? "Loading countries..."
                          : "Select country"}
                      </option>

                      {countries.map(
                        (country) => (
                          <option
                            key={
                              country.id
                            }
                            value={
                              country.id
                            }
                          >
                            {country.name}
                            {country.isoCode
                              ? ` (${country.isoCode})`
                              : ""}
                          </option>
                        ),
                      )}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="stateId"
                      className="mb-1.5 block text-sm font-medium text-gray-700"
                    >
                      State
                    </label>

                    <select
                      id="stateId"
                      name="stateId"
                      value={
                        form.stateId
                      }
                      onChange={
                        handleStateChange
                      }
                      disabled={
                        !form.countryId ||
                        loadingStates ||
                        saving
                      }
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black disabled:bg-gray-100"
                    >
                      <option value="">
                        {!form.countryId
                          ? "Select country first"
                          : loadingStates
                            ? "Loading states..."
                            : "Select state"}
                      </option>

                      {states.map(
                        (state) => (
                          <option
                            key={
                              state.id
                            }
                            value={
                              state.id
                            }
                          >
                            {state.name}
                          </option>
                        ),
                      )}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="cityId"
                      className="mb-1.5 block text-sm font-medium text-gray-700"
                    >
                      City
                    </label>

                    <select
                      id="cityId"
                      name="cityId"
                      value={
                        form.cityId
                      }
                      onChange={
                        handleChange
                      }
                      disabled={
                        !form.stateId ||
                        loadingCities ||
                        saving
                      }
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black disabled:bg-gray-100"
                    >
                      <option value="">
                        {!form.stateId
                          ? "Select state first"
                          : loadingCities
                            ? "Loading cities..."
                            : "Select city"}
                      </option>

                      {cities.map(
                        (city) => (
                          <option
                            key={
                              city.id
                            }
                            value={
                              city.id
                            }
                          >
                            {city.name}
                          </option>
                        ),
                      )}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="postalCode"
                      className="mb-1.5 block text-sm font-medium text-gray-700"
                    >
                      Postal Code
                    </label>

                    <input
                      id="postalCode"
                      name="postalCode"
                      value={
                        form.postalCode
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Enter postal code"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="currencyId"
                      className="mb-1.5 block text-sm font-medium text-gray-700"
                    >
                      Currency{" "}
                      <span className="text-red-500">
                        *
                      </span>
                    </label>

                    <select
                      id="currencyId"
                      name="currencyId"
                      value={
                        form.currencyId
                      }
                      onChange={
                        handleChange
                      }
                      disabled={
                        loadingMasters ||
                        saving
                      }
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black disabled:bg-gray-100"
                      required
                    >
                      <option value="">
                        {loadingMasters
                          ? "Loading currencies..."
                          : "Select currency"}
                      </option>

                      {currencies.map(
                        (currency) => (
                          <option
                            key={
                              currency.id
                            }
                            value={
                              currency.id
                            }
                          >
                            {currency.name} (
                            {
                              currency.code
                            }
                            )
                            {currency.symbol
                              ? ` ${currency.symbol}`
                              : ""}
                          </option>
                        ),
                      )}
                    </select>
                  </div>
                </div>
              </section>

              {/* =================================================
                  CONTACT
              ================================================= */}

              <section>
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-700">
                  Contact
                </h3>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label
                      htmlFor="email"
                      className="mb-1.5 block text-sm font-medium text-gray-700"
                    >
                      Email
                    </label>

                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={
                        handleChange
                      }
                      placeholder="company@example.com"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="phone"
                      className="mb-1.5 block text-sm font-medium text-gray-700"
                    >
                      Phone
                    </label>

                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={form.phone}
                      onChange={
                        handleChange
                      }
                      placeholder="Enter phone number"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
                    />
                  </div>
                </div>
              </section>

              {/* =================================================
                  FINANCIAL YEAR
              ================================================= */}

              <section>
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-700">
                  Financial Year
                </h3>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label
                      htmlFor="financialYearStart"
                      className="mb-1.5 block text-sm font-medium text-gray-700"
                    >
                      Financial Year Start
                    </label>

                    <input
                      id="financialYearStart"
                      name="financialYearStart"
                      type="date"
                      value={
                        form.financialYearStart
                      }
                      onChange={
                        handleChange
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="financialYearEnd"
                      className="mb-1.5 block text-sm font-medium text-gray-700"
                    >
                      Financial Year End
                    </label>

                    <input
                      id="financialYearEnd"
                      name="financialYearEnd"
                      type="date"
                      value={
                        form.financialYearEnd
                      }
                      onChange={
                        handleChange
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
                    />
                  </div>
                </div>
              </section>

              {/* =================================================
                  FORM BUTTONS
              ================================================= */}

              <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-6 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={saving}
                  className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {editingCompanyId
                    ? "Cancel"
                    : "Reset"}
                </button>

                <button
                  type="submit"
                  disabled={
                    saving ||
                    loadingMasters
                  }
                  className="rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? editingCompanyId
                      ? "Updating..."
                      : "Creating..."
                    : editingCompanyId
                      ? "Update Company"
                      : "Create Company"}
                </button>
              </div>
            </form>
          </section>

          {/* ====================================================
              COMPANY LIST
          ==================================================== */}

          <section className="h-fit rounded-xl border border-gray-200 bg-white p-6 shadow-sm lg:sticky lg:top-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Companies
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {companies.length}{" "}
                  {companies.length === 1
                    ? "company"
                    : "companies"}{" "}
                  found
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  void loadCompanies()
                }
                disabled={
                  loadingCompanies
                }
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                {loadingCompanies
                  ? "Refreshing..."
                  : "Refresh"}
              </button>
            </div>

            {loadingCompanies ? (
              <div className="rounded-lg bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
                Loading companies...
              </div>
            ) : companies.length ===
              0 ? (
              <div className="rounded-lg bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
                No companies found.
              </div>
            ) : (
              <div className="space-y-3">
                {companies.map(
                  (company) => (
                    <article
                      key={company.id}
                      className="rounded-lg border border-gray-200 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {company.name}
                          </h3>

                          {company.legalName && (
                            <p className="mt-0.5 text-xs text-gray-500">
                              {
                                company.legalName
                              }
                            </p>
                          )}
                        </div>

                        <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                          Active
                        </span>
                      </div>

                      <div className="mt-3 space-y-1.5 text-sm text-gray-600">
                        {company.gstin && (
                          <p>
                            <span className="font-medium text-gray-800">
                              GSTIN:
                            </span>{" "}
                            {company.gstin}
                          </p>
                        )}

                        {company.pan && (
                          <p>
                            <span className="font-medium text-gray-800">
                              PAN:
                            </span>{" "}
                            {company.pan}
                          </p>
                        )}

                        {company.email && (
                          <p>
                            <span className="font-medium text-gray-800">
                              Email:
                            </span>{" "}
                            {company.email}
                          </p>
                        )}

                        {company.phone && (
                          <p>
                            <span className="font-medium text-gray-800">
                              Phone:
                            </span>{" "}
                            {company.phone}
                          </p>
                        )}

                        {(company.city ||
                          company.state ||
                          company.country) && (
                          <p>
                            <span className="font-medium text-gray-800">
                              Location:
                            </span>{" "}
                            {[
                              company.city,
                              company.state,
                              company.country,
                            ]
                              .filter(Boolean)
                              .join(
                                ", ",
                              )}
                          </p>
                        )}

                        {company.baseCurrencyCode && (
                          <p>
                            <span className="font-medium text-gray-800">
                              Currency:
                            </span>{" "}
                            {
                              company.baseCurrencyCode
                            }
                          </p>
                        )}
                      </div>

                      {/* =================================================
                          ACTION BUTTONS
                      ================================================= */}

                      <div className="mt-4 flex gap-2 border-t border-gray-100 pt-4">
                        <button
                          type="button"
                          onClick={() =>
                            void handleEdit(
                              company,
                            )
                          }
                          disabled={
                            deletingCompanyId ===
                              company.id ||
                            saving
                          }
                          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            void handleDelete(
                              company,
                            )
                          }
                          disabled={
                            deletingCompanyId ===
                              company.id ||
                            saving
                          }
                          className="flex-1 rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {deletingCompanyId ===
                          company.id
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      </div>
                    </article>
                  ),
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}