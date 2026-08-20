"use client";

import {
  useEffect,
  useState,
  type ReactNode,
} from "react";

type PermissionGateProps = {
  permission: string;
  children: ReactNode;
  fallback?: ReactNode;
};

export default function PermissionGate({
  permission,
  children,
  fallback = null,
}: PermissionGateProps) {
  const [allowed, setAllowed] =
    useState(false);
  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    let active = true;

    async function checkPermission() {
      try {
        const response = await fetch(
          "/api/rbac-check",
          {
            method: "GET",
            cache: "no-store",
            credentials: "include",
          },
        );

        const result: {
          success: boolean;
          permissions?: string[];
        } = await response.json();

        if (!active) {
          return;
        }

        setAllowed(
          response.ok &&
            result.success &&
            Array.isArray(
              result.permissions,
            ) &&
            result.permissions.includes(
              permission,
            ),
        );
      } catch (error) {
        console.error(
          "Permission check failed:",
          error,
        );

        if (active) {
          setAllowed(false);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void checkPermission();

    return () => {
      active = false;
    };
  }, [permission]);

  if (loading) {
    return null;
  }

  return allowed
    ? children
    : fallback;
}