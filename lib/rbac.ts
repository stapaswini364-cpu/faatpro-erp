import { and, eq } from "drizzle-orm";

import { getDb } from "@/db/connection";

import { permissions } from "@/db/schema/permissions";
import { rolePermissions } from "@/db/schema/role-permissions";
import { roles } from "@/db/schema/roles";
import { userRoles } from "@/db/schema/user-roles";

// ============================================================
// HAS PERMISSION
// ============================================================

export async function hasPermission(
  userId: string,
  organizationId: string,
  permissionCode: string,
): Promise<boolean> {
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
    const error = new Error(
      `Forbidden: missing permission '${permissionCode}'`,
    );

    (
      error as Error & {
        status?: number;
      }
    ).status = 403;

    throw error;
  }
}

// ============================================================
// GET USER PERMISSIONS
// ============================================================

export async function getUserPermissions(
  userId: string,
  organizationId: string,
): Promise<string[]> {
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

  const codes: string[] = [];

  for (const item of result) {
    if (item.code) {
      codes.push(item.code);
    }
  }

  return Array.from(
    new Set(codes),
  );
}