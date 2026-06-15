export type AdminUser = {
  id?: string | null;
  primaryEmail?: string | null;
  name?: string | null;
  givenName?: string | null;
  familyName?: string | null;
  thumbnailPhotoUrl?: string | null;
  suspended?: boolean | null;
  orgUnitPath?: string | null;
};

export type AdminGroup = {
  id?: string | null;
  email?: string | null;
  name?: string | null;
  description?: string | null;
};

export type AdminOrgUnit = {
  orgUnitId?: string | null;
  name?: string | null;
  orgUnitPath?: string | null;
  parentOrgUnitPath?: string | null;
};

export type DirectoryTab = "users" | "groups" | "orgUnits";

export type Selection =
  | { kind: "user"; key: string; label: string; value: AdminUser }
  | { kind: "group"; key: string; label: string; value: AdminGroup }
  | { kind: "orgUnit"; key: string; label: string; value: AdminOrgUnit };

export type DirectoryUserOutput = {
  type: "user";
  id?: string | null;
  email?: string | null;
  name?: string | null;
};

export type DirectoryGroupOutput = {
  type: "group";
  id?: string | null;
  email?: string | null;
  name?: string | null;
};

export type DirectoryOrgOutput = {
  type: "org";
  orgUnitId?: string | null;
  orgUnitPath?: string | null;
  name?: string | null;
};

export type DirectorySelectionOutput =
  | DirectoryUserOutput
  | DirectoryGroupOutput
  | DirectoryOrgOutput;

export type GoogleAdminDirectorySelectorProps = {
  onSelected?: (items: DirectorySelectionOutput[]) => void;
  multiSelect?: boolean;
};
