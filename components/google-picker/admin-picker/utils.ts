import type {
  AdminGroup,
  AdminOrgUnit,
  AdminUser,
  DirectorySelectionOutput,
  Selection,
} from "./types";

export function selectionToJsonOutput(selection: Selection): DirectorySelectionOutput {
  switch (selection.kind) {
    case "user":
      return {
        type: "user",
        id: selection.value.id,
        email: selection.value.primaryEmail,
        name: selection.value.name,
      };
    case "group":
      return {
        type: "group",
        id: selection.value.id,
        email: selection.value.email,
        name: selection.value.name,
      };
    case "orgUnit":
      return {
        type: "org",
        orgUnitId: selection.value.orgUnitId,
        orgUnitPath: selection.value.orgUnitPath,
        name: selection.value.name,
      };
  }
}

export function userKey(u: AdminUser): string {
  return `user:${u.id || u.primaryEmail || ""}`;
}

export function userLabel(u: AdminUser): string {
  return u.name || u.primaryEmail || userKey(u);
}

export function groupKey(g: AdminGroup): string {
  return `group:${g.id || g.email || ""}`;
}

export function groupLabel(g: AdminGroup): string {
  return g.name || g.email || groupKey(g);
}

export function orgUnitKey(ou: AdminOrgUnit): string {
  return `orgUnit:${ou.orgUnitId || ou.orgUnitPath || ""}`;
}

export function orgUnitLabel(ou: AdminOrgUnit): string {
  return ou.name || ou.orgUnitPath || orgUnitKey(ou);
}
