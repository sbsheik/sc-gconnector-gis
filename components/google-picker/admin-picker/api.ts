import type { AdminGroup, AdminOrgUnit, AdminUser } from "./types";

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    try {
      const parsed = JSON.parse(text) as { error?: string };
      if (typeof parsed.error === "string") {
        throw new Error(parsed.error);
      }
    } catch (e) {
      if (e instanceof SyntaxError) {
        throw new Error(text || res.statusText);
      }
      throw e;
    }
    throw new Error(text || res.statusText);
  }
  return (await res.json()) as T;
}

async function fetchAllPaginated<T>(
  basePath: string,
  collectionKey: "users" | "groups",
  q: string,
  onProgress?: (count: number) => void
): Promise<T[]> {
  const all: T[] = [];
  let pageToken: string | undefined;
  let pages = 0;
  const maxPages = 5;

  do {
    const params = new URLSearchParams({ maxResults: "200" });
    if (q) params.set("q", q);
    if (pageToken) params.set("pageToken", pageToken);

    const data = await fetchJson<Record<string, T[] | string | null>>(
      `${basePath}?${params}`
    );
    const page = (data[collectionKey] as T[] | undefined) ?? [];
    all.push(...page);
    onProgress?.(all.length);
    pageToken = (data.nextPageToken as string | null | undefined) ?? undefined;
    pages += 1;
  } while (pageToken && pages < maxPages);

  return all;
}

export function fetchAllUsers(q: string, onProgress?: (count: number) => void) {
  return fetchAllPaginated<AdminUser>("/api/google-admin/users", "users", q, onProgress);
}

export function fetchAllGroups(q: string, onProgress?: (count: number) => void) {
  return fetchAllPaginated<AdminGroup>("/api/google-admin/groups", "groups", q, onProgress);
}

export function fetchAllOrgUnits() {
  return fetchJson<{ orgUnits: AdminOrgUnit[] }>("/api/google-admin/orgunits?type=all").then(
    (data) => data.orgUnits ?? []
  );
}
