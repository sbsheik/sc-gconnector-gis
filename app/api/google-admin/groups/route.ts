import { NextRequest, NextResponse } from "next/server";
import {
  buildDirectorySearchQuery,
  getAdminSdkErrorMessage,
  getCustomerId,
  getDirectoryClient,
} from "@/lib/google-admin";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") || "").trim();
  const maxResults = Math.min(Number(url.searchParams.get("maxResults") || "50"), 200);
  const pageToken = url.searchParams.get("pageToken") || undefined;

  try {
    const directory = getDirectoryClient();
    const customer = getCustomerId();

    const res = await directory.groups.list({
      customer,
      maxResults,
      pageToken,
      query: buildDirectorySearchQuery(q, "groups"),
    });

    const groups =
      res.data.groups?.map((g) => ({
        id: g.id,
        email: g.email,
        name: g.name,
        description: g.description,
      })) ?? [];

    return NextResponse.json({
      groups,
      nextPageToken: res.data.nextPageToken ?? null,
    });
  } catch (e) {
    const msg = getAdminSdkErrorMessage(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

