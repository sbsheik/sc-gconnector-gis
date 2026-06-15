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

    const res = await directory.users.list({
      customer,
      maxResults,
      pageToken,
      orderBy: "email",
      query: buildDirectorySearchQuery(q, "users"),
    });

    const users =
      res.data.users?.map((u) => ({
        id: u.id,
        primaryEmail: u.primaryEmail,
        name: u.name?.fullName,
        givenName: u.name?.givenName,
        familyName: u.name?.familyName,
        thumbnailPhotoUrl: u.thumbnailPhotoUrl,
        suspended: u.suspended,
        orgUnitPath: u.orgUnitPath,
      })) ?? [];

    return NextResponse.json({
      users,
      nextPageToken: res.data.nextPageToken ?? null,
    });
  } catch (e) {
    const msg = getAdminSdkErrorMessage(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

