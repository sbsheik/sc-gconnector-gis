"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";

interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture: string;
}

interface GoogleAuthContextType {
  isConnected: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  user: GoogleUser | null;
  accessToken: string | null;
  grantedScopes: string[];
  connectGoogle: () => void;
  disconnectGoogle: () => void;
  error: string | null;
}

const GoogleAuthContext = createContext<GoogleAuthContextType | null>(null);

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const GOOGLE_SCOPES = process.env.NEXT_PUBLIC_GOOGLE_SCOPES || "email profile https://www.googleapis.com/auth/drive";

export const GoogleAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [grantedScopes, setGrantedScopes] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const tokenClientRef = useRef<google.accounts.oauth2.TokenClient | null>(null);
  const hasInitialized = useRef(false);

  // Load Google Identity Services script
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const handleTokenResponse = async (response: google.accounts.oauth2.TokenResponse) => {
      if (response.access_token) {
        try {
          const userResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
            headers: { Authorization: `Bearer ${response.access_token}` },
          });

          if (userResponse.ok) {
            const userInfo = await userResponse.json();
            const googleUser: GoogleUser = {
              id: userInfo.id,
              email: userInfo.email,
              name: userInfo.name,
              picture: userInfo.picture,
            };

            setAccessToken(response.access_token);
            setUser(googleUser);
            setIsConnected(true);
            setError(null);
            const scopes = (response.scope || "")
              .split(" ")
              .map((s) => s.trim())
              .filter(Boolean);
            setGrantedScopes(scopes);

            localStorage.setItem("google_access_token", response.access_token);
            localStorage.setItem("google_user", JSON.stringify(googleUser));
            localStorage.setItem("google_granted_scopes", JSON.stringify(scopes));
          } else {
            throw new Error("Failed to fetch user info");
          }
        } catch (err) {
          console.error("Error handling token response:", err);
          setError("Failed to complete Google authentication");
        }
      }
      setIsLoading(false);
    };

    const loadGoogleScript = () => {
      if (window.google?.accounts?.oauth2) {
        initializeTokenClient();
        return;
      }

      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initializeTokenClient;
      script.onerror = () => {
        setError("Failed to load Google Identity Services");
        setIsLoading(false);
        setIsInitialized(true);
      };
      document.head.appendChild(script);
    };

    const initializeTokenClient = () => {
      if (!GOOGLE_CLIENT_ID) {
        setError("Google Client ID not configured");
        setIsLoading(false);
        setIsInitialized(true);
        return;
      }

      try {
        tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: GOOGLE_SCOPES,
          callback: handleTokenResponse,
          error_callback: (err) => {
            console.error("Google OAuth error:", err);
            setError(err.message || "Google authentication failed");
            setIsLoading(false);
          },
        });

        checkExistingAuth();
      } catch (err) {
        console.error("Failed to initialize Google token client:", err);
        setError("Failed to initialize Google authentication");
        setIsLoading(false);
        setIsInitialized(true);
      }
    };

    const checkExistingAuth = async () => {
      const storedToken = localStorage.getItem("google_access_token");
      const storedUser = localStorage.getItem("google_user");
      const storedScopes = localStorage.getItem("google_granted_scopes");

      if (storedToken && storedUser) {
        try {
          const response = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
            headers: { Authorization: `Bearer ${storedToken}` },
          });

          if (response.ok) {
            setAccessToken(storedToken);
            setUser(JSON.parse(storedUser));
            setIsConnected(true);
            if (storedScopes) {
              try {
                const parsed = JSON.parse(storedScopes);
                if (Array.isArray(parsed)) setGrantedScopes(parsed.filter((s) => typeof s === "string"));
              } catch {
                // ignore
              }
            }
          } else {
            localStorage.removeItem("google_access_token");
            localStorage.removeItem("google_user");
            localStorage.removeItem("google_granted_scopes");
          }
        } catch {
          localStorage.removeItem("google_access_token");
          localStorage.removeItem("google_user");
          localStorage.removeItem("google_granted_scopes");
        }
      }

      setIsLoading(false);
      setIsInitialized(true);
    };

    loadGoogleScript();
  }, []);

  // POPUP FLOW: Use Google Identity Services token client
  const connectGoogle = useCallback(() => {
    if (!tokenClientRef.current) {
      setError("Google authentication not initialized");
      return;
    }

    setIsLoading(true);
    setError(null);

    // select_account: always show Google account chooser (not just the logged-in browser account)
    tokenClientRef.current.requestAccessToken({ prompt: "select_account consent" });
  }, []);

  const disconnectGoogle = useCallback(() => {
    if (accessToken) {
      // Revoke the token
      window.google?.accounts?.oauth2?.revoke(accessToken, () => {
        console.log("Google token revoked");
      });
    }

    setAccessToken(null);
    setUser(null);
    setIsConnected(false);
    setGrantedScopes([]);
    localStorage.removeItem("google_access_token");
    localStorage.removeItem("google_user");
    localStorage.removeItem("google_granted_scopes");
  }, [accessToken]);

  return (
    <GoogleAuthContext.Provider
      value={{
        isConnected,
        isLoading,
        isInitialized,
        user,
        accessToken,
        grantedScopes,
        connectGoogle,
        disconnectGoogle,
        error,
      }}
    >
      {children}
    </GoogleAuthContext.Provider>
  );
};

export const useGoogleAuth = (): GoogleAuthContextType => {
  const context = useContext(GoogleAuthContext);
  if (!context) {
    throw new Error("useGoogleAuth must be used within a GoogleAuthProvider");
  }
  return context;
};
