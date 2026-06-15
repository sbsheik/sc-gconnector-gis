"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FolderTree, User, UserRound, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useGoogleAuth } from "@/components/providers/google-auth";
import { SelectionPreview } from "../selection-preview";
import { useMarketplaceValue } from "../use-marketplace-value";
import { fetchAllGroups, fetchAllOrgUnits, fetchAllUsers } from "./api";
import { DIRECTORY_GRID_STYLE, DirectoryTile, SelectedTile } from "./directory-tiles";
import type {
  AdminGroup,
  AdminOrgUnit,
  AdminUser,
  DirectorySelectionOutput,
  DirectoryTab,
  GoogleAdminDirectorySelectorProps,
  Selection,
} from "./types";
import {
  groupKey,
  groupLabel,
  orgUnitKey,
  orgUnitLabel,
  selectionToJsonOutput,
  userKey,
  userLabel,
} from "./utils";

export type {
  DirectoryGroupOutput,
  DirectoryOrgOutput,
  DirectorySelectionOutput,
  DirectoryUserOutput,
  GoogleAdminDirectorySelectorProps,
} from "./types";

export const GoogleAdminDirectorySelector = ({
  onSelected,
  multiSelect = true,
}: GoogleAdminDirectorySelectorProps = {}) => {
  const { isConnected, isLoading: googleLoading, connectGoogle } = useGoogleAuth();
  const { commitValue, error: selectError, setError: setSelectError } = useMarketplaceValue();

  const [mode, setMode] = useState<DirectoryTab>("users");
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [groups, setGroups] = useState<AdminGroup[]>([]);
  const [orgUnits, setOrgUnits] = useState<AdminOrgUnit[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadProgress, setLoadProgress] = useState<number | null>(null);
  const [selected, setSelected] = useState<Record<string, Selection>>({});

  const selectedList = useMemo(() => Object.values(selected), [selected]);
  const selectedUsers = useMemo(
    () => selectedList.filter((s): s is Extract<Selection, { kind: "user" }> => s.kind === "user"),
    [selectedList]
  );
  const selectedGroups = useMemo(
    () => selectedList.filter((s): s is Extract<Selection, { kind: "group" }> => s.kind === "group"),
    [selectedList]
  );
  const selectedOrgUnits = useMemo(
    () => selectedList.filter((s): s is Extract<Selection, { kind: "orgUnit" }> => s.kind === "orgUnit"),
    [selectedList]
  );

  const currentTabSelections = useMemo((): DirectorySelectionOutput[] => {
    if (mode === "users") return selectedUsers.map(selectionToJsonOutput);
    if (mode === "groups") return selectedGroups.map(selectionToJsonOutput);
    return selectedOrgUnits.map(selectionToJsonOutput);
  }, [mode, selectedUsers, selectedGroups, selectedOrgUnits]);

  const confirmSelection = useCallback(() => {
    if (currentTabSelections.length === 0) {
      return;
    }

    onSelected?.(currentTabSelections);
    commitValue(currentTabSelections, multiSelect);
  }, [commitValue, currentTabSelections, multiSelect, onSelected]);

  const clearSelectedByKind = useCallback((kind: Selection["kind"]) => {
    setSelected((prev) => Object.fromEntries(Object.entries(prev).filter(([, v]) => v.kind !== kind)));
  }, []);

  const removeSelected = useCallback((key: string) => {
    setSelected((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const toggleUser = useCallback((u: AdminUser) => {
    const key = userKey(u);
    const label = userLabel(u);
    setSelected((prev) => {
      const next = { ...prev };
      if (next[key]) delete next[key];
      else next[key] = { kind: "user", key, label, value: u };
      return next;
    });
  }, []);

  const toggleGroup = useCallback((g: AdminGroup) => {
    const key = groupKey(g);
    const label = groupLabel(g);
    setSelected((prev) => {
      const next = { ...prev };
      if (next[key]) delete next[key];
      else next[key] = { kind: "group", key, label, value: g };
      return next;
    });
  }, []);

  const toggleOrgUnit = useCallback((ou: AdminOrgUnit) => {
    const key = orgUnitKey(ou);
    const label = orgUnitLabel(ou);
    setSelected((prev) => {
      const next = { ...prev };
      if (next[key]) delete next[key];
      else next[key] = { kind: "orgUnit", key, label, value: ou };
      return next;
    });
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setLoadProgress(null);

    try {
      if (mode === "users") {
        setLoadProgress(0);
        setUsers(await fetchAllUsers(query.trim(), setLoadProgress));
      } else if (mode === "groups") {
        setLoadProgress(0);
        setGroups(await fetchAllGroups(query.trim(), setLoadProgress));
      } else {
        setOrgUnits(await fetchAllOrgUnits());
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
      setLoadProgress(null);
    }
  }, [mode, query]);

  useEffect(() => {
    if (!isConnected) {
      setUsers([]);
      setGroups([]);
      setOrgUnits([]);
      setError(null);
      setSelectError(null);
      return;
    }
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, isConnected]);

  const loadingLabel =
    loading && loadProgress != null ? `Loading... (${loadProgress})` : "Loading...";

  return (
    <Card style="outline">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserRound className="h-5 w-5" />
          Google Workspace Directory (Admin SDK)
        </CardTitle>
        <CardDescription>
          Browse Users, Groups, and Org Units via Admin SDK Directory API.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isConnected && (
          <Alert variant="warning">
            <AlertDescription>
              Please connect your Google account first to browse the Workspace directory.
            </AlertDescription>
          </Alert>
        )}

        {!isConnected ? (
          <Button onClick={connectGoogle} disabled={googleLoading} className="w-full sm:w-auto">
            {googleLoading ? "Connecting..." : "Connect Google First"}
          </Button>
        ) : (
          <>
            {selectError && (
              <Alert variant="danger">
                <AlertDescription>{selectError}</AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="danger">
                <AlertDescription className="space-y-2">
                  <div className="font-medium">Admin SDK error</div>
                  <div className="text-sm">{error}</div>
                  <div className="text-xs text-muted-foreground">
                    Most common causes: service account not configured, domain-wide delegation not
                    granted, or the delegated subject isn&apos;t an admin.
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex gap-2">
                <Button variant={mode === "users" ? "default" : "outline"} onClick={() => setMode("users")}>
                  <User className="h-4 w-4 mr-1" />
                  Users
                </Button>
                <Button variant={mode === "groups" ? "default" : "outline"} onClick={() => setMode("groups")}>
                  <Users className="h-4 w-4 mr-1" />
                  Groups
                </Button>
                <Button variant={mode === "orgUnits" ? "default" : "outline"} onClick={() => setMode("orgUnits")}>
                  <FolderTree className="h-4 w-4 mr-1" />
                  Org Units
                </Button>
              </div>

              {(mode === "users" || mode === "groups") && (
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground">Search</label>
                  <div className="mt-1">
                    <input
                      className="w-full rounded-md border px-3 py-2 text-sm bg-transparent"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") void load();
                      }}
                      placeholder={
                        mode === "users" ? "Search by name or email..." : "Search group name or email..."
                      }
                    />
                  </div>
                </div>
              )}

              <Button onClick={load} disabled={loading}>
                {loading ? loadingLabel : mode === "orgUnits" ? "Refresh" : "Search"}
              </Button>
            </div>

            {mode === "users" && selectedUsers.length > 0 && (
              <SelectedSection
                title={`Selected people (${selectedUsers.length})`}
                icon={UserRound}
                onClear={() => clearSelectedByKind("user")}
                items={selectedUsers}
                tileIcon={UserRound}
                onRemove={removeSelected}
              />
            )}

            {mode === "groups" && selectedGroups.length > 0 && (
              <SelectedSection
                title={`Selected groups (${selectedGroups.length})`}
                icon={Users}
                onClear={() => clearSelectedByKind("group")}
                items={selectedGroups}
                tileIcon={Users}
                onRemove={removeSelected}
              />
            )}

            {mode === "orgUnits" && selectedOrgUnits.length > 0 && (
              <SelectedSection
                title={`Selected org units (${selectedOrgUnits.length})`}
                icon={FolderTree}
                onClear={() => clearSelectedByKind("orgUnit")}
                items={selectedOrgUnits}
                tileIcon={FolderTree}
                onRemove={removeSelected}
              />
            )}

            {mode === "users" && (
              <DirectoryGrid
                icon={User}
                countLabel={
                  loading && loadProgress != null
                    ? `Loading users... (${loadProgress} loaded)`
                    : `${users.length} user${users.length === 1 ? "" : "s"}`
                }
                selectedCount={selectedUsers.length}
                loading={loading}
                emptyMessage="No users found."
                items={users.map((u) => ({
                  key: userKey(u),
                  label: userLabel(u),
                  checked: Boolean(selected[userKey(u)]),
                  onClick: () => toggleUser(u),
                }))}
                tileIcon={UserRound}
              />
            )}

            {mode === "groups" && (
              <DirectoryGrid
                icon={Users}
                countLabel={
                  loading && loadProgress != null
                    ? `Loading groups... (${loadProgress} loaded)`
                    : `${groups.length} group${groups.length === 1 ? "" : "s"}`
                }
                selectedCount={selectedGroups.length}
                loading={loading}
                emptyMessage="No groups found."
                items={groups.map((g) => ({
                  key: groupKey(g),
                  label: groupLabel(g),
                  checked: Boolean(selected[groupKey(g)]),
                  onClick: () => toggleGroup(g),
                }))}
                tileIcon={Users}
              />
            )}

            {mode === "orgUnits" && (
              <DirectoryGrid
                icon={FolderTree}
                countLabel={
                  loading ? "Loading org units..." : `${orgUnits.length} org unit${orgUnits.length === 1 ? "" : "s"}`
                }
                selectedCount={selectedOrgUnits.length}
                loading={loading}
                emptyMessage="No org units found."
                items={orgUnits.map((ou) => ({
                  key: orgUnitKey(ou),
                  label: orgUnitLabel(ou),
                  checked: Boolean(selected[orgUnitKey(ou)]),
                  onClick: () => toggleOrgUnit(ou),
                }))}
                tileIcon={FolderTree}
              />
            )}

            {currentTabSelections.length > 0 && (
              <SelectionPreview
                value={currentTabSelections}
                multiSelect={multiSelect}
                onSelect={confirmSelection}
              />
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

function SelectedSection({
  title,
  icon: HeaderIcon,
  onClear,
  items,
  tileIcon,
  onRemove,
}: {
  title: string;
  icon: typeof UserRound;
  onClear: () => void;
  items: Selection[];
  tileIcon: typeof UserRound;
  onRemove: (key: string) => void;
}) {
  return (
    <div className="space-y-2 rounded-md border p-3 bg-muted/30">
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-medium flex items-center gap-2">
          <HeaderIcon className="h-4 w-4" />
          {title}
        </div>
        <Button variant="outline" size="sm" onClick={onClear}>
          Clear all
        </Button>
      </div>
      <div style={DIRECTORY_GRID_STYLE}>
        {items.map((s) => (
          <SelectedTile key={s.key} label={s.label} icon={tileIcon} onRemove={() => onRemove(s.key)} />
        ))}
      </div>
    </div>
  );
}

function DirectoryGrid({
  icon: CountIcon,
  countLabel,
  selectedCount,
  loading,
  emptyMessage,
  items,
  tileIcon,
}: {
  icon: typeof User;
  countLabel: string;
  selectedCount: number;
  loading: boolean;
  emptyMessage: string;
  items: { key: string; label: string; checked: boolean; onClick: () => void }[];
  tileIcon: typeof UserRound;
}) {
  return (
    <div className="space-y-2">
      <div className="text-sm text-muted-foreground flex items-center gap-2">
        <CountIcon className="h-4 w-4" />
        {countLabel}
        {selectedCount > 0 && <Badge colorScheme="primary">{selectedCount} selected</Badge>}
      </div>
      <div className="max-h-[420px] overflow-y-auto pr-1" style={DIRECTORY_GRID_STYLE}>
        {items.map((item) => (
          <DirectoryTile
            key={item.key}
            label={item.label}
            checked={item.checked}
            icon={tileIcon}
            onClick={item.onClick}
          />
        ))}
        {!loading && items.length === 0 && (
          <div className="text-sm text-muted-foreground text-center py-8" style={{ gridColumn: "1 / -1" }}>
            {emptyMessage}
          </div>
        )}
      </div>
    </div>
  );
}
