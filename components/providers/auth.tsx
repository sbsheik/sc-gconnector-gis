"use client";

import React from "react";
import {
  Auth0Provider,
  GetTokenSilentlyOptions,
  useAuth0,
  Auth0ContextInterface,
  withAuthenticationRequired,
} from "@auth0/auth0-react";

export const WithAuth = withAuthenticationRequired(
  ({ children }: { children: React.ReactNode }) => children
);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const authParams = {
    organization_id: process.env.NEXT_PUBLIC_SITECORE_ORGANIZATION_ID,
    tenant_id: process.env.NEXT_PUBLIC_SITECORE_TENANT_ID,
    product_codes: `mkp_${process.env.NEXT_PUBLIC_SITECORE_APP_ID}`,
    audience: process.env.NEXT_PUBLIC_AUTH0_AUDIENCE,
    redirect_uri: process.env.NEXT_PUBLIC_APP_BASE_URL,
    scope: process.env.NEXT_PUBLIC_AUTH0_SCOPE,
  };

  const domain = process.env.NEXT_PUBLIC_AUTH0_DOMAIN;
  const clientId = process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID;

  // If Auth0 is not configured, render children without Auth0Provider
  // This allows the app to build even if Auth0 env vars are missing
  if (!domain || !clientId) {
    if (typeof window !== "undefined") {
      console.warn("Auth0 domain and client ID are not configured. Auth0 features will be disabled.");
    }
    return <>{children}</>;
  }

  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        ...authParams,
      }}
    >
      <WithAuth>{children}</WithAuth>
    </Auth0Provider>
  );
};

export const useAuth = (): Auth0ContextInterface => {
  const { getAccessTokenSilently, ...rest } = useAuth0();

  const customGetAccessTokenSilently = (options?: GetTokenSilentlyOptions) => {
    return getAccessTokenSilently({
      ...options,
      authorizationParams: {
        ...options?.authorizationParams,
        organization_id: process.env.NEXT_PUBLIC_SITECORE_ORGANIZATION_ID,
        tenant_id: process.env.NEXT_PUBLIC_SITECORE_TENANT_ID,
      },
    });
  };

  return {
    ...rest,
    getAccessTokenSilently:
      customGetAccessTokenSilently as Auth0ContextInterface["getAccessTokenSilently"],
  };
};
