import { NextRequest, NextResponse } from "next/server";
import { getAdminSdkErrorMessage, getCustomerId, getDirectoryClient } from "@/lib/google-admin";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const type = (url.searchParams.get("type") || "all").toLowerCase();

  try {
    const directory = getDirectoryClient();
    const customerId = getCustomerId();

    const res = await directory.orgunits.list({
      customerId,
      type: type === "children" ? "children" : "all",
    });

    const orgUnits =
      res.data.organizationUnits?.map((ou) => ({
        orgUnitId: ou.orgUnitId,
        name: ou.name,
        orgUnitPath: ou.orgUnitPath,
        parentOrgUnitPath: ou.parentOrgUnitPath,
      })) ?? [];

    return NextResponse.json({ orgUnits });
  } catch (e) {
    const msg = getAdminSdkErrorMessage(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

