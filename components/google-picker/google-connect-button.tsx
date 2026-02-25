"use client";

import { useGoogleAuth } from "@/components/providers/google-auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const GoogleConnectButton = () => {
  const { isConnected, isLoading, user, connectGoogle, disconnectGoogle, error } = useGoogleAuth();

  if (isConnected && user) {
    return (
      <Card style="outline">
        <CardHeader>
          <CardTitle>Google Account Connected</CardTitle>
          <CardDescription>
            You are connected as {user.email}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Name: {user.name}</p>
            <p className="text-sm font-medium">Email: {user.email}</p>
            {user.picture && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Picture:</span>
                {/* eslint-disable-next-line @next/next/no-img-element -- external user avatar URL */}
                <img
                  src={user.picture}
                  alt={user.name || "User"}
                  className="w-8 h-8 rounded-full"
                />
              </div>
            )}
          </div>
          <Button
            onClick={disconnectGoogle}
            variant="outline"
            colorScheme="danger"
            disabled={isLoading}
          >
            Disconnect Google
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card style="outline">
      <CardHeader>
        <CardTitle>Connect Google Account</CardTitle>
        <CardDescription>
          Connect your Google account to access Google Drive files
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="danger">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Button
          onClick={connectGoogle}
          disabled={isLoading}
          className="w-full sm:w-auto"
        >
          {isLoading ? "Connecting..." : "Connect Google Account"}
        </Button>
      </CardContent>
    </Card>
  );
};

