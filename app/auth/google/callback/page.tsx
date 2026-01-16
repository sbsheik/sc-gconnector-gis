"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function GoogleCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
  const [message, setMessage] = useState("Processing Google Sign-In...");

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      // Token comes in URL fragment: #access_token=...&token_type=Bearer&expires_in=3600
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);

      const accessToken = params.get("access_token");
      const errorParam = params.get("error");
      const state = params.get("state");

      // Check for errors
      if (errorParam) {
        throw new Error(errorParam);
      }

      // Verify state to prevent CSRF
      const savedState = sessionStorage.getItem("google_oauth_state");
      if (state && savedState && state !== savedState) {
        throw new Error("Invalid state parameter - possible CSRF attack");
      }
      sessionStorage.removeItem("google_oauth_state");

      if (!accessToken) {
        throw new Error("No access token received from Google");
      }

      setMessage("Verifying credentials...");

      // Fetch user info
      const response = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!response.ok) {
        throw new Error("Failed to verify Google credentials");
      }

      const userInfo = await response.json();

      // Store in localStorage
      localStorage.setItem("google_access_token", accessToken);
      localStorage.setItem("google_user", JSON.stringify({
        id: userInfo.id,
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
      }));

      setStatus("success");
      setMessage(`Welcome, ${userInfo.name}! Redirecting...`);

      // Redirect to home
      setTimeout(() => {
        router.push("/");
      }, 1500);

    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Authentication failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
        {status === "processing" && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h1 className="text-xl font-semibold">Signing in with Google</h1>
            <p className="text-gray-500 mt-2">{message}</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-green-600">Success!</h1>
            <p className="text-gray-500 mt-2">{message}</p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-red-600">Authentication Failed</h1>
            <p className="text-gray-500 mt-2">{message}</p>
            <button
              onClick={() => router.push("/")}
              className="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Go Back
            </button>
          </>
        )}
      </div>
    </div>
  );
}
