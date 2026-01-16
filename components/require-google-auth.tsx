"use client";

interface RequireGoogleAuthProps {
  children: React.ReactNode;
}

/**
 * RequireGoogleAuth - Makes Google authentication optional
 * Always renders children, allowing the page to show Google sign-in as an option
 * rather than blocking access. The GoogleConnectButton component handles the UI.
 */
export const RequireGoogleAuth = ({ children }: RequireGoogleAuthProps) => {
  // Always render children - Google auth is optional
  // The page can show GoogleConnectButton as an option
  return <>{children}</>;
};

