"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useUser } from "@clerk/nextjs";

type Role = {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  description: string | null;
  isSystemRole: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type Permission = {
  id: string;
  module: string;
  action: string;
  code: string;
  description: string | null;
  createdAt?: string;
};

type UserRole = {
  id: string;
  organizationId: string;
  userId: string;
  roleId: string;
  roleName: string;
  roleCode: string;
  isSystemRole: boolean;
  createdAt: string;
};

type Tab =
  | "roles"
  | "permissions"
  | "role_permissions"
  | "user_roles";

type RolesResponse = {
  success: boolean;
  data?: Role[];
  message?: string;
};

type PermissionsResponse = {
  success: boolean;
  data?: Permission[];
  message?: string;
};

type RolePermissionsResponse = {
  success: boolean;
  data?: {
    role: {
      id: string;
      name: string;
      code: string;
    };
    permissions: Permission[];
  };
  message?: string;
};

type UserRolesResponse = {
  success: boolean;
  data?: UserRole[];
  message?: string;
};

export default function RBACPage() {
  const { user, isLoaded } = useUser();

  const [activeTab, setActiveTab] =
    useState<Tab>("roles");

  // ============================================================
  // COMMON
  // ============================================================

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ============================================================
  // ROLES
  // ============================================================

  const [roles, setRoles] = useState<Role[]>([]);
  const [rolesLoading, setRolesLoading] =
    useState(true);

  const [roleName, setRoleName] = useState("");
  const [roleCode, setRoleCode] = useState("");
  const [roleDescription, setRoleDescription] =
    useState("");

  const [savingRole, setSavingRole] =
    useState(false);

  // ============================================================
  // PERMISSIONS
  // ============================================================

  const [permissions, setPermissions] =
    useState<Permission[]>([]);

  const [permissionsLoading, setPermissionsLoading] =
    useState(false);

  const [permissionModule, setPermissionModule] =
    useState("");

  const [permissionAction, setPermissionAction] =
    useState("");

  const [permissionCode, setPermissionCode] =
    useState("");

  const [
    permissionDescription,
    setPermissionDescription,
  ] = useState("");

  const [
    savingPermission,
    setSavingPermission,
  ] = useState(false);

  // ============================================================
  // ROLE PERMISSIONS
  // ============================================================

  const [selectedRoleId, setSelectedRoleId] =
    useState("");

  const [
    assignedPermissionIds,
    setAssignedPermissionIds,
  ] = useState<Set<string>>(new Set());

  const [
    originalPermissionIds,
    setOriginalPermissionIds,
  ] = useState<Set<string>>(new Set());

  const [
    rolePermissionsLoading,
    setRolePermissionsLoading,
  ] = useState(false);

  const [
    savingRolePermissions,
    setSavingRolePermissions,
  ] = useState(false);

  // ============================================================
  // USER ROLES
  // ============================================================

  const [
    selectedUserId,
    setSelectedUserId,
  ] = useState("");

  const [
    selectedUserRoleId,
    setSelectedUserRoleId,
  ] = useState("");

  const [
    userRoles,
    setUserRoles,
  ] = useState<UserRole[]>([]);

  const [
    userRolesLoading,
    setUserRolesLoading,
  ] = useState(false);

  const [
    savingUserRole,
    setSavingUserRole,
  ] = useState(false);

  // ============================================================
  // LOAD ROLES
  // ============================================================

  const loadRoles = useCallback(async () => {
    try {
      setRolesLoading(true);
      setError("");

      const response = await fetch(
        "/api/roles",
        {
          method: "GET",
          cache: "no-store",
          credentials: "include",
        },
      );

      const result: RolesResponse =
        await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            `Failed to load roles (${response.status})`,
        );
      }

      const loadedRoles = Array.isArray(
        result.data,
      )
        ? result.data
        : [];

      setRoles(loadedRoles);

      if (
        !selectedRoleId &&
        loadedRoles.length > 0
      ) {
        setSelectedRoleId(
          loadedRoles[0].id,
        );
      }
    } catch (err) {
      console.error(
        "RBAC load roles error:",
        err,
      );

      setRoles([]);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load roles",
      );
    } finally {
      setRolesLoading(false);
    }
  }, [selectedRoleId]);

  // ============================================================
  // LOAD PERMISSIONS
  // ============================================================

  const loadPermissions = useCallback(
    async () => {
      try {
        setPermissionsLoading(true);
        setError("");

        const response = await fetch(
          "/api/permissions",
          {
            method: "GET",
            cache: "no-store",
            credentials: "include",
          },
        );

        const result: PermissionsResponse =
          await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message ||
              `Failed to load permissions (${response.status})`,
          );
        }

        setPermissions(
          Array.isArray(result.data)
            ? result.data
            : [],
        );
      } catch (err) {
        console.error(
          "RBAC load permissions error:",
          err,
        );

        setPermissions([]);

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load permissions",
        );
      } finally {
        setPermissionsLoading(false);
      }
    },
    [],
  );

  // ============================================================
  // LOAD ROLE PERMISSIONS
  // ============================================================

  const loadRolePermissions = useCallback(
    async (roleId: string) => {
      if (!roleId) {
        setAssignedPermissionIds(
          new Set(),
        );

        setOriginalPermissionIds(
          new Set(),
        );

        return;
      }

      try {
        setRolePermissionsLoading(true);
        setError("");
        setSuccess("");

        const response = await fetch(
          `/api/role-permissions?roleId=${encodeURIComponent(
            roleId,
          )}`,
          {
            method: "GET",
            cache: "no-store",
            credentials: "include",
          },
        );

        const result: RolePermissionsResponse =
          await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message ||
              `Failed to load role permissions (${response.status})`,
          );
        }

        const ids = new Set<string>(
          (result.data?.permissions || []).map(
            (permission) => permission.id,
          ),
        );

        setAssignedPermissionIds(
          new Set(ids),
        );

        setOriginalPermissionIds(
          new Set(ids),
        );
      } catch (err) {
        console.error(
          "Load role permissions error:",
          err,
        );

        setAssignedPermissionIds(
          new Set(),
        );

        setOriginalPermissionIds(
          new Set(),
        );

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load role permissions",
        );
      } finally {
        setRolePermissionsLoading(false);
      }
    },
    [],
  );

  // ============================================================
  // LOAD USER ROLES
  // ============================================================

  const loadUserRoles = useCallback(
    async (userId: string) => {
      if (!userId) {
        setUserRoles([]);
        return;
      }

      try {
        setUserRolesLoading(true);
        setError("");
        setSuccess("");

        const response = await fetch(
          `/api/user-roles?userId=${encodeURIComponent(
            userId,
          )}`,
          {
            method: "GET",
            cache: "no-store",
            credentials: "include",
          },
        );

        const result: UserRolesResponse =
          await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message ||
              `Failed to load user roles (${response.status})`,
          );
        }

        setUserRoles(
          Array.isArray(result.data)
            ? result.data
            : [],
        );
      } catch (err) {
        console.error(
          "Load user roles error:",
          err,
        );

        setUserRoles([]);

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load user roles",
        );
      } finally {
        setUserRolesLoading(false);
      }
    },
    [],
  );

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    void loadRoles();
  }, [loadRoles]);

  useEffect(() => {
    if (
      activeTab === "permissions" ||
      activeTab === "role_permissions"
    ) {
      void loadPermissions();
    }
  }, [
    activeTab,
    loadPermissions,
  ]);

  useEffect(() => {
    if (
      activeTab === "role_permissions" &&
      selectedRoleId
    ) {
      void loadRolePermissions(
        selectedRoleId,
      );
    }
  }, [
    activeTab,
    selectedRoleId,
    loadRolePermissions,
  ]);

  useEffect(() => {
    if (
      activeTab === "user_roles" &&
      isLoaded &&
      user?.id
    ) {
      setSelectedUserId(user.id);
      void loadUserRoles(user.id);
    }
  }, [
    activeTab,
    isLoaded,
    user?.id,
    loadUserRoles,
  ]);

  // ============================================================
  // CREATE ROLE
  // ============================================================

  async function createRole(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!roleName.trim()) {
      setError("Role name is required");
      return;
    }

    if (!roleCode.trim()) {
      setError("Role code is required");
      return;
    }

    try {
      setSavingRole(true);

      const response = await fetch(
        "/api/roles",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            name: roleName.trim(),
            code: roleCode.trim(),
            description:
              roleDescription.trim() ||
              null,
          }),
        },
      );

      const result: {
        success: boolean;
        data?: Role;
        message?: string;
      } = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            `Failed to create role (${response.status})`,
        );
      }

      setRoleName("");
      setRoleCode("");
      setRoleDescription("");

      setSuccess(
        "Role created successfully.",
      );

      await loadRoles();
    } catch (err) {
      console.error(
        "Create role error:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to create role",
      );
    } finally {
      setSavingRole(false);
    }
  }

  // ============================================================
  // CREATE PERMISSION
  // ============================================================

  async function createPermission(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!permissionModule.trim()) {
      setError(
        "Permission module is required",
      );
      return;
    }

    if (!permissionAction.trim()) {
      setError(
        "Permission action is required",
      );
      return;
    }

    try {
      setSavingPermission(true);

      const response = await fetch(
        "/api/permissions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            module:
              permissionModule.trim(),
            action:
              permissionAction.trim(),
            code:
              permissionCode.trim() ||
              undefined,
            description:
              permissionDescription.trim() ||
              null,
          }),
        },
      );

      const result: {
        success: boolean;
        data?: Permission;
        message?: string;
      } = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            `Failed to create permission (${response.status})`,
        );
      }

      setPermissionModule("");
      setPermissionAction("");
      setPermissionCode("");
      setPermissionDescription("");

      setSuccess(
        "Permission created successfully.",
      );

      await loadPermissions();
    } catch (err) {
      console.error(
        "Create permission error:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to create permission",
      );
    } finally {
      setSavingPermission(false);
    }
  }

  // ============================================================
  // ROLE PERMISSION TOGGLE
  // ============================================================

  function togglePermission(
    permissionId: string,
  ) {
    setAssignedPermissionIds(
      (current) => {
        const next = new Set(current);

        if (next.has(permissionId)) {
          next.delete(permissionId);
        } else {
          next.add(permissionId);
        }

        return next;
      },
    );

    setSuccess("");
    setError("");
  }

  function selectAllPermissions() {
    setAssignedPermissionIds(
      new Set(
        permissions.map(
          (permission) => permission.id,
        ),
      ),
    );

    setSuccess("");
    setError("");
  }

  function clearAllPermissions() {
    setAssignedPermissionIds(
      new Set(),
    );

    setSuccess("");
    setError("");
  }

  // ============================================================
  // SAVE ROLE PERMISSIONS
  // ============================================================

  async function saveRolePermissions() {
    if (!selectedRoleId) {
      setError("Please select a role.");
      return;
    }

    try {
      setSavingRolePermissions(true);
      setError("");
      setSuccess("");

      const additions: string[] = [];

      assignedPermissionIds.forEach(
        (permissionId) => {
          if (
            !originalPermissionIds.has(
              permissionId,
            )
          ) {
            additions.push(permissionId);
          }
        },
      );

      const removals: string[] = [];

      originalPermissionIds.forEach(
        (permissionId) => {
          if (
            !assignedPermissionIds.has(
              permissionId,
            )
          ) {
            removals.push(permissionId);
          }
        },
      );

      for (
        let i = 0;
        i < additions.length;
        i += 1
      ) {
        const response = await fetch(
          "/api/role-permissions",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            credentials: "include",
            body: JSON.stringify({
              roleId: selectedRoleId,
              permissionId:
                additions[i],
            }),
          },
        );

        const result: {
          success: boolean;
          message?: string;
        } = await response.json();

        if (
          !response.ok ||
          !result.success
        ) {
          throw new Error(
            result.message ||
              "Failed to assign permission",
          );
        }
      }

      for (
        let i = 0;
        i < removals.length;
        i += 1
      ) {
        const response = await fetch(
          "/api/role-permissions",
          {
            method: "DELETE",
            headers: {
              "Content-Type":
                "application/json",
            },
            credentials: "include",
            body: JSON.stringify({
              roleId: selectedRoleId,
              permissionId:
                removals[i],
            }),
          },
        );

        const result: {
          success: boolean;
          message?: string;
        } = await response.json();

        if (
          !response.ok ||
          !result.success
        ) {
          throw new Error(
            result.message ||
              "Failed to remove permission",
          );
        }
      }

      setOriginalPermissionIds(
        new Set(assignedPermissionIds),
      );

      setSuccess(
        "Role permissions updated successfully.",
      );

      await loadRolePermissions(
        selectedRoleId,
      );
    } catch (err) {
      console.error(
        "Save role permissions error:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to save role permissions",
      );

      await loadRolePermissions(
        selectedRoleId,
      );
    } finally {
      setSavingRolePermissions(false);
    }
  }

  // ============================================================
  // ASSIGN USER ROLE
  // ============================================================

  async function assignUserRole() {
    if (!selectedUserId) {
      setError("User ID is required.");
      return;
    }

    if (!selectedUserRoleId) {
      setError("Please select a role.");
      return;
    }

    try {
      setSavingUserRole(true);
      setError("");
      setSuccess("");

      const response = await fetch(
        "/api/user-roles",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            userId: selectedUserId,
            roleId: selectedUserRoleId,
          }),
        },
      );

      const result: {
        success: boolean;
        message?: string;
      } = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            `Failed to assign role (${response.status})`,
        );
      }

      setSuccess(
        "Role assigned to user successfully.",
      );

      await loadUserRoles(
        selectedUserId,
      );
    } catch (err) {
      console.error(
        "Assign user role error:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to assign user role",
      );
    } finally {
      setSavingUserRole(false);
    }
  }

  // ============================================================
  // REMOVE USER ROLE
  // ============================================================

  async function removeUserRole(
    roleId: string,
  ) {
    if (!selectedUserId) {
      setError("User ID is required.");
      return;
    }

    try {
      setSavingUserRole(true);
      setError("");
      setSuccess("");

      const response = await fetch(
        "/api/user-roles",
        {
          method: "DELETE",
          headers: {
            "Content-Type":
              "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            userId: selectedUserId,
            roleId,
          }),
        },
      );

      const result: {
        success: boolean;
        message?: string;
      } = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            `Failed to remove role (${response.status})`,
        );
      }

      setSuccess(
        "Role removed from user successfully.",
      );

      await loadUserRoles(
        selectedUserId,
      );
    } catch (err) {
      console.error(
        "Remove user role error:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to remove user role",
      );
    } finally {
      setSavingUserRole(false);
    }
  }

  // ============================================================
  // GROUP PERMISSIONS
  // ============================================================

  const groupedPermissions = useMemo(() => {
    const groups: Record<
      string,
      Permission[]
    > = {};

    permissions.forEach((permission) => {
      if (!groups[permission.module]) {
        groups[permission.module] = [];
      }

      groups[permission.module].push(
        permission,
      );
    });

    return Object.entries(groups).sort(
      ([a], [b]) =>
        a.localeCompare(b),
    );
  }, [permissions]);

  // ============================================================
  // SELECTED ROLE
  // ============================================================

  const selectedRole = useMemo(
    () =>
      roles.find(
        (role) =>
          role.id === selectedRoleId,
      ),
    [roles, selectedRoleId],
  );

  // ============================================================
  // DIRTY STATE
  // ============================================================

  const hasPermissionChanges =
    assignedPermissionIds.size !==
      originalPermissionIds.size ||
    Array.from(
      assignedPermissionIds,
    ).some(
      (id) =>
        !originalPermissionIds.has(id),
    );

  // ============================================================
  // TAB
  // ============================================================

  function selectTab(tab: Tab) {
    setActiveTab(tab);
    setError("");
    setSuccess("");
  }

  // ============================================================
  // UI
  // ============================================================

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            RBAC Management
          </h1>

          <p className="mt-1 text-sm text-gray-600">
            Manage roles and access permissions
            for your organization.
          </p>
        </div>

        {/* TABS */}

        <div className="mb-6 flex gap-2 overflow-x-auto rounded-lg border bg-white p-2">
          <button
            type="button"
            onClick={() =>
              selectTab("roles")
            }
            className={`rounded-md px-4 py-2 text-sm font-medium ${
              activeTab === "roles"
                ? "bg-black text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Roles
          </button>

          <button
            type="button"
            onClick={() =>
              selectTab("permissions")
            }
            className={`rounded-md px-4 py-2 text-sm font-medium ${
              activeTab === "permissions"
                ? "bg-black text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Permissions
          </button>

          <button
            type="button"
            onClick={() =>
              selectTab(
                "role_permissions",
              )
            }
            className={`rounded-md px-4 py-2 text-sm font-medium ${
              activeTab ===
              "role_permissions"
                ? "bg-black text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Role Permissions
          </button>

          <button
            type="button"
            onClick={() =>
              selectTab("user_roles")
            }
            className={`rounded-md px-4 py-2 text-sm font-medium ${
              activeTab === "user_roles"
                ? "bg-black text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            User Roles
          </button>
        </div>

        {/* ERROR */}

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* SUCCESS */}

        {success && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        )}

        {/* ================================================== */}
        {/* ROLES */}
        {/* ================================================== */}

        {activeTab === "roles" && (
          <div className="grid gap-6 lg:grid-cols-3">
            <section className="rounded-xl border bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">
                Create Role
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Create a custom role for this
                organization.
              </p>

              <form
                onSubmit={createRole}
                className="mt-6 space-y-4"
              >
                <div>
                  <label
                    htmlFor="role-name"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Role Name
                  </label>

                  <input
                    id="role-name"
                    value={roleName}
                    onChange={(event) =>
                      setRoleName(
                        event.target.value,
                      )
                    }
                    placeholder="Example: Sales Manager"
                    className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label
                    htmlFor="role-code"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Role Code
                  </label>

                  <input
                    id="role-code"
                    value={roleCode}
                    onChange={(event) =>
                      setRoleCode(
                        event.target.value,
                      )
                    }
                    placeholder="Example: sales_manager"
                    className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label
                    htmlFor="role-description"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Description
                  </label>

                  <textarea
                    id="role-description"
                    value={
                      roleDescription
                    }
                    onChange={(event) =>
                      setRoleDescription(
                        event.target.value,
                      )
                    }
                    placeholder="Describe this role"
                    rows={4}
                    className="w-full resize-none rounded-lg border px-3 py-2 text-sm outline-none focus:border-black"
                  />
                </div>

                <button
                  type="submit"
                  disabled={savingRole}
                  className="w-full rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
                >
                  {savingRole
                    ? "Creating..."
                    : "Create Role"}
                </button>
              </form>
            </section>

            <section className="rounded-xl border bg-white shadow-sm lg:col-span-2">
              <div className="flex items-center justify-between border-b px-6 py-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Roles
                  </h2>

                  <p className="text-sm text-gray-500">
                    {rolesLoading
                      ? "Loading..."
                      : `${roles.length} role${
                          roles.length ===
                          1
                            ? ""
                            : "s"
                        } found`}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    void loadRoles()
                  }
                  disabled={rolesLoading}
                  className="rounded-lg border px-3 py-2 text-sm font-medium disabled:opacity-50"
                >
                  Refresh
                </button>
              </div>

              {rolesLoading ? (
                <div className="p-6 text-sm text-gray-500">
                  Loading roles...
                </div>
              ) : roles.length === 0 ? (
                <div className="p-6 text-sm text-gray-500">
                  No roles found.
                </div>
              ) : (
                <div className="divide-y">
                  {roles.map((role) => (
                    <div
                      key={role.id}
                      className="flex flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">
                            {role.name}
                          </h3>

                          {role.isSystemRole && (
                            <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                              System
                            </span>
                          )}
                        </div>

                        <p className="mt-1 font-mono text-xs text-gray-500">
                          {role.code}
                        </p>

                        {role.description && (
                          <p className="mt-2 text-sm text-gray-600">
                            {
                              role.description
                            }
                          </p>
                        )}
                      </div>

                      <span className="text-xs text-gray-400">
                        {role.isSystemRole
                          ? "System Role"
                          : "Custom Role"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* ================================================== */}
        {/* PERMISSIONS */}
        {/* ================================================== */}

        {activeTab === "permissions" && (
          <div className="grid gap-6 lg:grid-cols-3">
            <section className="rounded-xl border bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">
                Create Permission
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Create a permission using the
                module.action format.
              </p>

              <form
                onSubmit={
                  createPermission
                }
                className="mt-6 space-y-4"
              >
                <div>
                  <label
                    htmlFor="permission-module"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Module
                  </label>

                  <input
                    id="permission-module"
                    value={
                      permissionModule
                    }
                    onChange={(event) =>
                      setPermissionModule(
                        event.target.value,
                      )
                    }
                    placeholder="Example: ledger"
                    className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label
                    htmlFor="permission-action"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Action
                  </label>

                  <input
                    id="permission-action"
                    value={
                      permissionAction
                    }
                    onChange={(event) =>
                      setPermissionAction(
                        event.target.value,
                      )
                    }
                    placeholder="Example: view"
                    className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label
                    htmlFor="permission-code"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Code
                  </label>

                  <input
                    id="permission-code"
                    value={
                      permissionCode
                    }
                    onChange={(event) =>
                      setPermissionCode(
                        event.target.value,
                      )
                    }
                    placeholder="Auto: ledger.view"
                    className="w-full rounded-lg border px-3 py-2 text-sm font-mono outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label
                    htmlFor="permission-description"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Description
                  </label>

                  <textarea
                    id="permission-description"
                    value={
                      permissionDescription
                    }
                    onChange={(event) =>
                      setPermissionDescription(
                        event.target.value,
                      )
                    }
                    rows={4}
                    placeholder="Describe this permission"
                    className="w-full resize-none rounded-lg border px-3 py-2 text-sm outline-none focus:border-black"
                  />
                </div>

                <button
                  type="submit"
                  disabled={
                    savingPermission
                  }
                  className="w-full rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
                >
                  {savingPermission
                    ? "Creating..."
                    : "Create Permission"}
                </button>
              </form>
            </section>

            <section className="rounded-xl border bg-white shadow-sm lg:col-span-2">
              <div className="flex items-center justify-between border-b px-6 py-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Permissions
                  </h2>

                  <p className="text-sm text-gray-500">
                    {permissions.length}{" "}
                    permissions found
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    void loadPermissions()
                  }
                  disabled={
                    permissionsLoading
                  }
                  className="rounded-lg border px-3 py-2 text-sm font-medium disabled:opacity-50"
                >
                  Refresh
                </button>
              </div>

              {permissionsLoading ? (
                <div className="p-6 text-sm text-gray-500">
                  Loading permissions...
                </div>
              ) : permissions.length ===
                0 ? (
                <div className="p-6 text-sm text-gray-500">
                  No permissions found.
                </div>
              ) : (
                <div className="divide-y">
                  {groupedPermissions.map(
                    ([module, items]) => (
                      <div
                        key={module}
                        className="px-6 py-5"
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <h3 className="text-base font-semibold capitalize">
                            {module.replace(
                              /_/g,
                              " ",
                            )}
                          </h3>

                          <span className="rounded-full bg-gray-100 px-2 py-1 text-xs">
                            {items.length}
                          </span>
                        </div>

                        <div className="grid gap-2 sm:grid-cols-2">
                          {items.map(
                            (permission) => (
                              <div
                                key={
                                  permission.id
                                }
                                className="rounded-lg border bg-gray-50 p-3"
                              >
                                <div className="font-mono text-sm font-medium">
                                  {
                                    permission.code
                                  }
                                </div>

                                <div className="mt-1 text-xs capitalize text-gray-500">
                                  {
                                    permission.action
                                  }
                                </div>

                                {permission.description && (
                                  <div className="mt-2 text-xs text-gray-500">
                                    {
                                      permission.description
                                    }
                                  </div>
                                )}
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    ),
                  )}
                </div>
              )}
            </section>
          </div>
        )}

        {/* ================================================== */}
        {/* ROLE PERMISSIONS */}
        {/* ================================================== */}

        {activeTab ===
          "role_permissions" && (
          <div className="space-y-6">
            <section className="rounded-xl border bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div className="w-full md:max-w-md">
                  <label
                    htmlFor="selected-role"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Select Role
                  </label>

                  <select
                    id="selected-role"
                    value={selectedRoleId}
                    onChange={(event) =>
                      setSelectedRoleId(
                        event.target.value,
                      )
                    }
                    disabled={
                      rolesLoading ||
                      savingRolePermissions
                    }
                    className="w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none focus:border-black"
                  >
                    <option value="">
                      Select a role
                    </option>

                    {roles.map((role) => (
                      <option
                        key={role.id}
                        value={role.id}
                      >
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedRole && (
                  <div className="rounded-lg bg-gray-50 px-4 py-3">
                    <p className="text-sm font-semibold text-gray-900">
                      {selectedRole.name}
                    </p>

                    <p className="mt-1 font-mono text-xs text-gray-500">
                      {selectedRole.code}
                    </p>
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-xl border bg-white shadow-sm">
              <div className="flex flex-col gap-4 border-b px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Role Permissions
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Select permissions for the
                    selected role.
                  </p>

                  {selectedRole && (
                    <p className="mt-2 text-sm font-medium text-gray-700">
                      {
                        assignedPermissionIds.size
                      }{" "}
                      of {permissions.length}{" "}
                      permissions selected
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={
                      selectAllPermissions
                    }
                    disabled={
                      !selectedRoleId ||
                      rolePermissionsLoading ||
                      savingRolePermissions
                    }
                    className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
                  >
                    Select All
                  </button>

                  <button
                    type="button"
                    onClick={
                      clearAllPermissions
                    }
                    disabled={
                      !selectedRoleId ||
                      rolePermissionsLoading ||
                      savingRolePermissions
                    }
                    className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
                  >
                    Clear All
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      void saveRolePermissions()
                    }
                    disabled={
                      !selectedRoleId ||
                      rolePermissionsLoading ||
                      savingRolePermissions ||
                      !hasPermissionChanges
                    }
                    className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {savingRolePermissions
                      ? "Saving..."
                      : "Save Permissions"}
                  </button>
                </div>
              </div>

              {!selectedRoleId ? (
                <div className="p-8 text-center text-sm text-gray-500">
                  Please select a role.
                </div>
              ) : rolePermissionsLoading ? (
                <div className="p-8 text-center text-sm text-gray-500">
                  Loading role permissions...
                </div>
              ) : permissionsLoading ? (
                <div className="p-8 text-center text-sm text-gray-500">
                  Loading permissions...
                </div>
              ) : permissions.length ===
                0 ? (
                <div className="p-8 text-center text-sm text-gray-500">
                  No permissions found.
                </div>
              ) : (
                <div className="divide-y">
                  {groupedPermissions.map(
                    ([module, items]) => {
                      const selectedCount =
                        items.filter(
                          (permission) =>
                            assignedPermissionIds.has(
                              permission.id,
                            ),
                        ).length;

                      return (
                        <div
                          key={module}
                          className="px-6 py-5"
                        >
                          <div className="mb-4 flex items-center justify-between">
                            <div>
                              <h3 className="text-base font-semibold capitalize text-gray-900">
                                {module.replace(
                                  /_/g,
                                  " ",
                                )}
                              </h3>

                              <p className="mt-1 text-xs text-gray-500">
                                {selectedCount}{" "}
                                of {items.length}{" "}
                                selected
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                const moduleIds =
                                  items.map(
                                    (
                                      permission,
                                    ) =>
                                      permission.id,
                                  );

                                const allSelected =
                                  moduleIds.every(
                                    (id) =>
                                      assignedPermissionIds.has(
                                        id,
                                      ),
                                  );

                                setAssignedPermissionIds(
                                  (current) => {
                                    const next =
                                      new Set(
                                        current,
                                      );

                                    if (
                                      allSelected
                                    ) {
                                      moduleIds.forEach(
                                        (id) =>
                                          next.delete(
                                            id,
                                          ),
                                      );
                                    } else {
                                      moduleIds.forEach(
                                        (id) =>
                                          next.add(
                                            id,
                                          ),
                                      );
                                    }

                                    return next;
                                  },
                                );

                                setError("");
                                setSuccess("");
                              }}
                              disabled={
                                savingRolePermissions
                              }
                              className="text-xs font-medium text-gray-600 hover:text-black disabled:opacity-50"
                            >
                              {selectedCount ===
                              items.length
                                ? "Clear Module"
                                : "Select Module"}
                            </button>
                          </div>

                          <div className="grid gap-3 md:grid-cols-2">
                            {items.map(
                              (permission) => {
                                const checked =
                                  assignedPermissionIds.has(
                                    permission.id,
                                  );

                                return (
                                  <label
                                    key={
                                      permission.id
                                    }
                                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition ${
                                      checked
                                        ? "border-black bg-gray-50"
                                        : "hover:bg-gray-50"
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={
                                        checked
                                      }
                                      onChange={() =>
                                        togglePermission(
                                          permission.id,
                                        )
                                      }
                                      disabled={
                                        savingRolePermissions
                                      }
                                      className="mt-1 h-4 w-4"
                                    />

                                    <div className="min-w-0">
                                      <p className="font-mono text-sm font-medium text-gray-900">
                                        {
                                          permission.code
                                        }
                                      </p>

                                      <p className="mt-1 text-xs capitalize text-gray-500">
                                        {
                                          permission.action
                                        }
                                      </p>

                                      {permission.description && (
                                        <p className="mt-2 text-xs text-gray-500">
                                          {
                                            permission.description
                                          }
                                        </p>
                                      )}
                                    </div>
                                  </label>
                                );
                              },
                            )}
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>
              )}
            </section>
          </div>
        )}

        {/* ================================================== */}
        {/* USER ROLES */}
        {/* ================================================== */}

        {activeTab === "user_roles" && (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* ASSIGN ROLE */}

            <section className="rounded-xl border bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">
                Assign User Role
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Assign a role to a Clerk user in
                the current organization.
              </p>

              <div className="mt-6 space-y-5">
                <div>
                  <label
                    htmlFor="user-id"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    User ID
                  </label>

                  <input
                    id="user-id"
                    value={selectedUserId}
                    onChange={(event) =>
                      setSelectedUserId(
                        event.target.value,
                      )
                    }
                    placeholder="user_xxxxxxxxx"
                    className="w-full rounded-lg border px-3 py-2 text-sm font-mono outline-none focus:border-black"
                  />

                  {user?.id &&
                    selectedUserId ===
                      user.id && (
                      <p className="mt-2 text-xs text-green-600">
                        Current signed-in user
                      </p>
                    )}
                </div>

                <div>
                  <label
                    htmlFor="user-role"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Role
                  </label>

                  <select
                    id="user-role"
                    value={
                      selectedUserRoleId
                    }
                    onChange={(event) =>
                      setSelectedUserRoleId(
                        event.target.value,
                      )
                    }
                    disabled={
                      savingUserRole ||
                      rolesLoading
                    }
                    className="w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:border-black"
                  >
                    <option value="">
                      Select a role
                    </option>

                    {roles.map((role) => (
                      <option
                        key={role.id}
                        value={role.id}
                      >
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    void assignUserRole()
                  }
                  disabled={
                    savingUserRole ||
                    !selectedUserId ||
                    !selectedUserRoleId
                  }
                  className="w-full rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {savingUserRole
                    ? "Assigning..."
                    : "Assign Role"}
                </button>
              </div>
            </section>

            {/* CURRENT USER ROLES */}

            <section className="rounded-xl border bg-white shadow-sm lg:col-span-2">
              <div className="flex flex-col gap-3 border-b px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Current User Roles
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    {selectedUserId
                      ? `Roles assigned to ${selectedUserId}`
                      : "Enter a user ID to view assigned roles."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    void loadUserRoles(
                      selectedUserId,
                    )
                  }
                  disabled={
                    userRolesLoading ||
                    !selectedUserId
                  }
                  className="rounded-lg border px-3 py-2 text-sm font-medium disabled:opacity-50"
                >
                  Refresh
                </button>
              </div>

              {!isLoaded ? (
                <div className="p-8 text-center text-sm text-gray-500">
                  Loading user...
                </div>
              ) : !selectedUserId ? (
                <div className="p-8 text-center text-sm text-gray-500">
                  Please enter a User ID.
                </div>
              ) : userRolesLoading ? (
                <div className="p-8 text-center text-sm text-gray-500">
                  Loading user roles...
                </div>
              ) : userRoles.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-sm text-gray-500">
                    No roles assigned to this
                    user.
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {userRoles.map(
                    (userRole) => (
                      <div
                        key={userRole.id}
                        className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900">
                              {
                                userRole.roleName
                              }
                            </h3>

                            {userRole.isSystemRole && (
                              <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                                System
                              </span>
                            )}
                          </div>

                          <p className="mt-1 font-mono text-xs text-gray-500">
                            {
                              userRole.roleCode
                            }
                          </p>

                          <p className="mt-2 text-xs text-gray-400">
                            Role ID:{" "}
                            {
                              userRole.roleId
                            }
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            void removeUserRole(
                              userRole.roleId,
                            )
                          }
                          disabled={
                            savingUserRole
                          }
                          className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          {savingUserRole
                            ? "Removing..."
                            : "Remove"}
                        </button>
                      </div>
                    ),
                  )}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </main>
  );
}