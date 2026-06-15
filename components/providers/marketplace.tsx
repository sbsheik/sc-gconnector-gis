"use client";

import React, {
  useEffect,
  useState,
  ReactNode,
  createContext,
  useContext,
} from "react";
import {
  ApplicationContext,
  ClientSDK,
} from "@sitecore-marketplace-sdk/client";
import { XMC } from "@sitecore-marketplace-sdk/xmc";

interface ClientSDKProviderProps {
  children: ReactNode;
}

const ClientSDKContext = createContext<ClientSDK | null>(null);
const AppContextContext = createContext<ApplicationContext | null>(null);

const INIT_TIMEOUT_MS = 15_000;
const EMPTY_APP_CONTEXT = {} as ApplicationContext;

function isStandaloneWindow() {
  return typeof window !== "undefined" && window.self === window.top;
}

function shouldSkipMarketplaceSdk() {
  return process.env.NEXT_PUBLIC_SKIP_MARKETPLACE_SDK === "true" || isStandaloneWindow();
}

export const MarketplaceProvider: React.FC<ClientSDKProviderProps> = ({
  children,
}) => {
  const [client, setClient] = useState<ClientSDK | null>(null);
  const [appContext, setAppContext] = useState<ApplicationContext | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    if (client) {
      client.query("application.context").then((res) => {
        if (res?.data) {
          setAppContext(res.data);
          console.log("appContext", res.data);
        }
      });
    }
  }, [client]);

  useEffect(() => {
    if (shouldSkipMarketplaceSdk()) {
      setStandalone(true);
      setLoading(false);
      return;
    }

    const init = async () => {
      const config = {
        target: window.parent,
        modules: [XMC],
      };

      try {
        setLoading(true);
        const sdkClient = await Promise.race([
          ClientSDK.init(config),
          new Promise<never>((_, reject) => {
            window.setTimeout(
              () => reject(new Error("Marketplace SDK handshake timed out")),
              INIT_TIMEOUT_MS
            );
          }),
        ]);
        setClient(sdkClient);
      } catch (err) {
        console.error("Error initializing client SDK", err);
        setError(err instanceof Error ? err.message : "Error initializing client SDK");
      } finally {
        setLoading(false);
      }
    };

    void init();
  }, []);

  if (loading) {
    return <div>Attempting to connect to Sitecore Marketplace...</div>;
  }

  if (standalone) {
    return (
      <ClientSDKContext.Provider value={null}>
        <AppContextContext.Provider value={EMPTY_APP_CONTEXT}>
          {children}
        </AppContextContext.Provider>
      </ClientSDKContext.Provider>
    );
  }

  if (error) {
    return (
      <div>
        <h1>Error initializing Marketplace SDK</h1>
        <div>{error}</div>
        <div>
          Please check if the client SDK is loaded inside Sitecore Marketplace
          parent window and you have properly set your app&apos;s extension points.
        </div>
      </div>
    );
  }

  return (
    <ClientSDKContext.Provider value={client}>
      <AppContextContext.Provider value={appContext ?? EMPTY_APP_CONTEXT}>
        {children}
      </AppContextContext.Provider>
    </ClientSDKContext.Provider>
  );
};

export const useOptionalMarketplaceClient = () => useContext(ClientSDKContext);

export const useMarketplaceClient = () => {
  const context = useOptionalMarketplaceClient();
  if (!context) {
    throw new Error(
      "useMarketplaceClient must be used within a ClientSDKProvider with an active Marketplace connection"
    );
  }
  return context;
};

export const useAppContext = () => {
  const context = useContext(AppContextContext);
  if (!context) {
    throw new Error("useAppContext must be used within a ClientSDKProvider");
  }
  return context;
};
