import { NextRequest, NextResponse } from "next/server";

const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_BASE_URL || "https://googlepicker.app";

export async function GET(request: NextRequest) {
  // For implicit flow, the token comes in the URL fragment (#access_token=...)
  // But URL fragments are not sent to the server, so we need a client-side handler
  // This route just redirects to the callback page
  
  const url = new URL(request.url);
  
  // If there's an error from Google
  const error = url.searchParams.get("error");
  if (error) {
    return NextResponse.redirect(`${APP_BASE_URL}?google_error=${error}`);
  }

  // Redirect to a client-side page that will handle the token from the URL fragment
  return NextResponse.redirect(`${APP_BASE_URL}/auth/google/callback${url.search}`);
}

