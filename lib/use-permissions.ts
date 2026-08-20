"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

type RbacCheckResponse = {
  success: boolean;
  permissions?: string[];
  message?: string;
};

export function usePermissions() {
  const [permissions, setPermissions] =
    useState<string[]>([]);
  const [loading, setLoading] =
    useState(true);

  const loadPermissions =
    useCallback(async () => {
      try {
        setLoading(true);

        const response = await fetch(
          "/api/rbac-check",
          {
            method: "GET",
            cache: "no-store",
            credentials: "include",
          },
        );

        const result =
          (await response.json()) as RbacCheckResponse;

        if (
          !response.ok ||
          !result.success
        ) {
          setPermissions([]);
          return;
        }

        setPermissions(
          Array.isArray(result.permissions)
            ? result.permissions
            : [],
        );
      } catch (error) {
        console.error(
          "Failed to load user permissions:",
          error,
        );

        setPermissions([]);
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    void loadPermissions();
  }, [loadPermissions]);

  const can = useCallback(
    (permission: string) =>
      permissions.includes(permission),
    [permissions],
  );

  const canAny = useCallback(
    (required: string[]) =>
      required.some((permission) =>
        permissions.includes(permission),
      ),
    [permissions],
  );

  const canAll = useCallback(
    (required: string[]) =>
      required.every((permission) =>
        permissions.includes(permission),
      ),
    [permissions],
  );

  return {
    permissions,
    loading,
    can,
    canAny,
    canAll,
    reload: loadPermissions,
  };
}