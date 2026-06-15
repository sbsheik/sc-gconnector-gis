"use client";

import { useState, useEffect, useCallback } from "react";
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
import { Badge } from "@/components/ui/badge";
import { useMarketplaceValue } from "../use-marketplace-value";

const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY || "";
const GOOGLE_PICKER_ORIGIN =
  process.env.NEXT_PUBLIC_GOOGLE_PICKER_ORIGIN ||
  (typeof window !== "undefined" ? window.location.origin : "");

export interface PickedFile {
  id: string;
  name: string;
  mimeType: string;
  url: string;
  iconUrl: string;
  previewUrl?: string;
  sizeBytes?: number;
  lastEditedUtc?: number;
}

interface GooglePickerProps {
  onFilePicked?: (files: PickedFile[]) => void;
  multiSelect?: boolean;
  title?: string;
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return "Unknown size";
  const sizes = ["Bytes", "KB", "MB", "GB"];
  if (bytes === 0) return "0 Bytes";
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${Math.round((bytes / Math.pow(1024, i)) * 100) / 100} ${sizes[i]}`;
}

function getPreviewUrl(doc: google.picker.Document): string | undefined {
  const isFolder = doc.mimeType === "application/vnd.google-apps.folder";
  const docWithExtras = doc as google.picker.Document & { thumbnailLink?: string };

  if (isFolder) {
    return `https://drive.google.com/drive/folders/${doc.id}`;
  }

  return (
    docWithExtras.thumbnailLink ||
    docWithExtras.embedUrl ||
    (doc.mimeType?.includes("google-apps")
      ? `https://drive.google.com/file/d/${doc.id}/preview`
      : `https://drive.google.com/thumbnail?id=${doc.id}&sz=w1000`)
  );
}

export const GooglePicker = ({
  onFilePicked,
  multiSelect = false,
  title = "Select a file from Google Drive",
}: GooglePickerProps) => {
  const { accessToken, isConnected, isLoading } = useGoogleAuth();
  const { commitValue, error: marketplaceError, setError: setMarketplaceError } = useMarketplaceValue();
  const [pickerLoaded, setPickerLoaded] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<PickedFile[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const isGapiLoaded = () => Boolean(window.gapi?.load);

    const loadGapiScript = () =>
      new Promise<void>((resolve, reject) => {
        if (isGapiLoaded()) {
          resolve();
          return;
        }

        const existingScript = document.querySelector('script[src*="apis.google.com/js/api.js"]');
        if (existingScript) {
          existingScript.addEventListener("load", () => resolve());
          existingScript.addEventListener("error", () => reject(new Error("Failed to load gapi script")));
          return;
        }

        const script = document.createElement("script");
        script.src = "https://apis.google.com/js/api.js";
        script.async = true;
        script.defer = true;
        script.onload = () => {
          setTimeout(() => {
            if (isGapiLoaded()) resolve();
            else reject(new Error("gapi object not available after script load"));
          }, 100);
        };
        script.onerror = () => reject(new Error("Failed to load gapi script"));
        document.head.appendChild(script);
      });

    const loadPicker = async () => {
      try {
        await loadGapiScript();
        if (!window.gapi?.load) {
          throw new Error("gapi.load is not available");
        }

        window.gapi.load("picker", () => {
          const ready = () => Boolean(window.google?.picker);
          if (ready()) {
            setPickerLoaded(true);
            return;
          }

          setTimeout(() => {
            if (ready()) setPickerLoaded(true);
            else {
              setError("Google Picker API loaded but namespace not available. Please refresh the page.");
            }
          }, 200);
        });
      } catch (err) {
        setError(`Failed to load Google Picker: ${err instanceof Error ? err.message : String(err)}`);
      }
    };

    void loadPicker();
  }, []);

  const pickerCallback = useCallback(
    (data: google.picker.ResponseObject) => {
      if (data.action !== google.picker.Action.PICKED) {
        return;
      }

      const files: PickedFile[] = data.docs.map((doc) => ({
        id: doc.id,
        name: doc.name,
        mimeType: doc.mimeType,
        url: doc.url,
        iconUrl: doc.iconUrl,
        previewUrl: getPreviewUrl(doc),
        sizeBytes: doc.sizeBytes,
        lastEditedUtc: doc.lastEditedUtc,
      }));

      setSelectedFiles(files);
      setError(null);
      setMarketplaceError(null);
      onFilePicked?.(files);
      commitValue(files, multiSelect);
    },
    [commitValue, multiSelect, onFilePicked, setMarketplaceError]
  );

  const openPicker = useCallback(() => {
    if (!pickerLoaded) {
      setError("Google Picker is not loaded yet. Please wait...");
      return;
    }

    if (!accessToken || !isConnected) {
      setError("Please connect your Google account first");
      return;
    }

    if (!window.google?.picker) {
      setError("Google Picker API is not available");
      return;
    }

    try {
      const myDriveView = new google.picker.DocsView(google.picker.ViewId.DOCS)
        .setIncludeFolders(true)
        .setSelectFolderEnabled(true);
      const documentsView = new google.picker.DocsView(google.picker.ViewId.DOCUMENTS).setIncludeFolders(true);
      const spreadsheetView = new google.picker.DocsView(google.picker.ViewId.SPREADSHEETS).setIncludeFolders(true);
      const presentationView = new google.picker.DocsView(google.picker.ViewId.PRESENTATIONS).setIncludeFolders(true);
      const formsView = new google.picker.DocsView(google.picker.ViewId.FORMS).setIncludeFolders(true);

      const pickerBuilder = new google.picker.PickerBuilder()
        .setTitle(title)
        .setOAuthToken(accessToken)
        .setDeveloperKey(GOOGLE_API_KEY)
        .addView(myDriveView)
        .addView(documentsView)
        .addView(spreadsheetView)
        .addView(presentationView)
        .addView(formsView)
        .setOrigin(GOOGLE_PICKER_ORIGIN)
        .setCallback(pickerCallback);

      if (multiSelect) {
        pickerBuilder.enableFeature(google.picker.Feature.MULTISELECT_ENABLED);
      }

      pickerBuilder.build().setVisible(true);
    } catch (err) {
      setError(`Failed to open Google Picker: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, [accessToken, isConnected, multiSelect, pickerCallback, pickerLoaded, title]);

  const displayError = error || marketplaceError;

  return (
    <Card style="outline">
      <CardHeader>
        <CardTitle>Google Drive Picker</CardTitle>
        <CardDescription>Select files from your Google Drive</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isConnected && (
          <Alert variant="warning">
            <AlertDescription>
              Please connect your Google account first to use the picker.
            </AlertDescription>
          </Alert>
        )}

        <Button
          onClick={openPicker}
          disabled={!isConnected || !pickerLoaded || isLoading}
          className="w-full sm:w-auto"
        >
          {!isConnected
            ? "Connect Google First"
            : !pickerLoaded
              ? "Loading Picker..."
              : "Open Google Picker"}
        </Button>

        {displayError && (
          <Alert variant="danger">
            <AlertDescription>{displayError}</AlertDescription>
          </Alert>
        )}

        {selectedFiles.length > 0 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Selected Items ({selectedFiles.length}):</p>
              <div className="space-y-2">
                {selectedFiles.map((file, index) => {
                  const isFolder = file.mimeType === "application/vnd.google-apps.folder";
                  return (
                    <div key={file.id || index} className="flex items-start gap-3 p-3 border rounded-lg">
                      {/* eslint-disable-next-line @next/next/no-img-element -- dynamic external icon URL from Google */}
                      <img src={file.iconUrl} alt={file.name} className="w-6 h-6 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{file.name}</p>
                          {isFolder && <Badge size="sm" colorScheme="primary">Folder</Badge>}
                        </div>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {!isFolder && (
                            <>
                              <Badge size="sm">{file.mimeType}</Badge>
                              {file.sizeBytes && (
                                <Badge size="sm" colorScheme="neutral">
                                  {formatFileSize(file.sizeBytes)}
                                </Badge>
                              )}
                            </>
                          )}
                        </div>
                        {file.previewUrl && (
                          <a
                            href={file.previewUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary mt-1 hover:underline"
                          >
                            {isFolder ? "Open Folder" : "Preview"}
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">JSON Template:</p>
              <div className="p-4 bg-muted rounded-lg border overflow-auto">
                <pre className="text-xs font-mono whitespace-pre-wrap break-words">
                  {JSON.stringify(
                    multiSelect || selectedFiles.length > 1 ? selectedFiles : selectedFiles[0],
                    null,
                    2
                  )}
                </pre>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
