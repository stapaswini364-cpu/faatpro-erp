import { and, eq } from "drizzle-orm";

import { getDb } from "@/db/connection";

import { permissions } from "@/db/schema/permissions";
import { rolePermissions } from "@/db/schema/role-permissions";
import { roles } from "@/db/schema/roles";
import { userRoles } from "@/db/schema/user-roles";

// ============================================================
// RBAC ERROR
// ============================================================

export class PermissionError extends Error {
  status: number;
  permissionCode: string;

  constructor(permissionCode: string) {
    super(
      `Forbidden: missing permission '${permissionCode}'`,
    );

    this.name = "PermissionError";
    this.status = 403;
    this.permissionCode = permissionCode;
  }
}

// ============================================================
// HAS PERMISSION
// ============================================================

export async function hasPermission(
  userId: string,
  organizationId: string,
  permissionCode: string,
): Promise<boolean> {
  if (
    !userId ||
    !organizationId ||
    !permissionCode
  ) {
    return false;
  }

  const db = getDb();

  const result = await db
    .select({
      permissionId: permissions.id,
    })
    .from(userRoles)
    .innerJoin(
      roles,
      eq(
        userRoles.roleId,
        roles.id,
      ),
    )
    .innerJoin(
      rolePermissions,
      eq(
        rolePermissions.roleId,
        roles.id,
      ),
    )
    .innerJoin(
      permissions,
      eq(
        rolePermissions.permissionId,
        permissions.id,
      ),
    )
    .where(
      and(
        eq(
          userRoles.userId,
          userId,
        ),
        eq(
          userRoles.organizationId,
          organizationId,
        ),
        eq(
          roles.organizationId,
          organizationId,
        ),
        eq(
          roles.isActive,
          true,
        ),
        eq(
          permissions.code,
          permissionCode,
        ),
      ),
    )
    .limit(1);

  return result.length > 0;
}

// ============================================================
// REQUIRE PERMISSION
// ============================================================

export async function requirePermission(
  userId: string,
  organizationId: string,
  permissionCode: string,
): Promise<void> {
  const allowed =
    await hasPermission(
      userId,
      organizationId,
      permissionCode,
    );

  if (!allowed) {
    throw new PermissionError(
      permissionCode,
    );
  }
}

// ============================================================
// GET USER PERMISSIONS
// ============================================================

export async function getUserPermissions(
  userId: string,
  organizationId: string,
): Promise<string[]> {
  if (
    !userId ||
    !organizationId
  ) {
    return [];
  }

  const db = getDb();

  const result = await db
    .select({
      code: permissions.code,
    })
    .from(userRoles)
    .innerJoin(
      roles,
      eq(
        userRoles.roleId,
        roles.id,
      ),
    )
    .innerJoin(
      rolePermissions,
      eq(
        rolePermissions.roleId,
        roles.id,
      ),
    )
    .innerJoin(
      permissions,
      eq(
        rolePermissions.permissionId,
        permissions.id,
      ),
    )
    .where(
      and(
        eq(
          userRoles.userId,
          userId,
        ),
        eq(
          userRoles.organizationId,
          organizationId,
        ),
        eq(
          roles.organizationId,
          organizationId,
        ),
        eq(
          roles.isActive,
          true,
        ),
      ),
    );

  const codes = result
    .map(
      (item) => item.code,
    )
    .filter(
      (
        code,
      ): code is string =>
        Boolean(code),
    );

  return Array.from(
    new Set(codes),
  );
}

// ============================================================
// HAS ANY PERMISSION
// ============================================================

export async function hasAnyPermission(
  userId: string,
  organizationId: string,
  permissionCodes: string[],
): Promise<boolean> {
  if (
    !userId ||
    !organizationId ||
    permissionCodes.length === 0
  ) {
    return false;
  }

  const userPermissions =
    new Set(
      await getUserPermissions(
        userId,
        organizationId,
      ),
    );

  return permissionCodes.some(
    (code) =>
      userPermissions.has(code),
  );
}

// ============================================================
// HAS ALL PERMISSIONS
// ============================================================

export async function hasAllPermissions(
  userId: string,
  organizationId: string,
  permissionCodes: string[],
): Promise<boolean> {
  if (
    !userId ||
    !organizationId ||
    permissionCodes.length === 0
  ) {
    return false;
  }

  const userPermissions =
    new Set(
      await getUserPermissions(
        userId,
        organizationId,
      ),
    );

  return permissionCodes.every(
    (code) =>
      userPermissions.has(code),
  );
}

// ============================================================
// REQUIRE ANY PERMISSION
// ============================================================

export async function requireAnyPermission(
  userId: string,
  organizationId: string,
  permissionCodes: string[],
): Promise<void> {
  const allowed =
    await hasAnyPermission(
      userId,
      organizationId,
      permissionCodes,
    );

  if (!allowed) {
    throw new PermissionError(
      permissionCodes.join(", "),
    );
  }
}

// ============================================================
// REQUIRE ALL PERMISSIONS
// ============================================================

export async function requireAllPermissions(
  userId: string,
  organizationId: string,
  permissionCodes: string[],
): Promise<void> {
  const allowed =
    await hasAllPermissions(
      userId,
      organizationId,
      permissionCodes,
    );

  if (!allowed) {
    throw new PermissionError(
      permissionCodes.join(", "),
    );
  }
}