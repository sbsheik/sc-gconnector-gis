"use client";

import { useState, useEffect, useCallback } from "react";
import { useGoogleAuth } from "@/components/providers/google-auth";
import { useMarketplaceClient } from "@/components/providers/marketplace";
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

const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY || "";
const GOOGLE_PICKER_ORIGIN = process.env.NEXT_PUBLIC_GOOGLE_PICKER_ORIGIN || (typeof window !== "undefined" ? window.location.origin : "");

interface PickedFile {
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
  viewId?: google.picker.ViewId | string;
  title?: string;
  autoUpdateField?: boolean;
  fieldId?: string;
  fieldName?: string;
}

export const GooglePicker = ({
  onFilePicked,
  multiSelect = false,
  title = "Select a file from Google Drive",
  autoUpdateField = false,
  fieldId,
  fieldName,
}: GooglePickerProps) => {
  const { accessToken, isConnected, isLoading } = useGoogleAuth();
  const client = useMarketplaceClient();
  const [pickerLoaded, setPickerLoaded] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<PickedFile[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Load Google Picker API
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    // Check if gapi script is already loaded
    const isGapiLoaded = () => {
      return window.gapi && window.gapi.load;
    };

    // Load the gapi script if not already loaded
    const loadGapiScript = () => {
      return new Promise<void>((resolve, reject) => {
        if (isGapiLoaded()) {
          resolve();
          return;
        }

        // Check if script is already being loaded
        const existingScript = document.querySelector('script[src*="apis.google.com/js/api.js"]');
        if (existingScript) {
          // Wait for it to load
          existingScript.addEventListener("load", () => resolve());
          existingScript.addEventListener("error", () => reject(new Error("Failed to load gapi script")));
          return;
        }

        // Load the gapi script
        const script = document.createElement("script");
        script.src = "https://apis.google.com/js/api.js";
        script.async = true;
        script.defer = true;
        script.onload = () => {
          // Wait a bit for gapi to initialize
          setTimeout(() => {
            if (isGapiLoaded()) {
              resolve();
            } else {
              reject(new Error("gapi object not available after script load"));
            }
          }, 100);
        };
        script.onerror = () => {
          reject(new Error("Failed to load gapi script"));
        };
        document.head.appendChild(script);
      });
    };

    // Load picker after gapi is ready
    const loadPicker = async () => {
      try {
        await loadGapiScript();
        
        if (window.gapi && window.gapi.load) {
          try {
            window.gapi.load("picker", () => {
              // Verify that google.picker is available
              if (window.google && window.google.picker) {
                setPickerLoaded(true);
              } else {
                // Wait a bit more for google.picker to be available
                setTimeout(() => {
                  if (window.google && window.google.picker) {
                    setPickerLoaded(true);
                  } else {
                    console.error("google.picker namespace not available");
                    setError("Google Picker API loaded but namespace not available. Please refresh the page.");
                  }
                }, 200);
              }
            });
          } catch (err) {
            console.error("Failed to load Google Picker API:", err);
            setError("Failed to load Google Picker API. Please refresh the page.");
          }
        } else {
          throw new Error("gapi.load is not available");
        }
      } catch (err) {
        console.error("Error loading Google Picker:", err);
        setError(`Failed to load Google Picker: ${err instanceof Error ? err.message : String(err)}`);
      }
    };

    loadPicker();
  }, []);

  const updateComponentField = useCallback(
    async (files: PickedFile[]) => {
      if (!autoUpdateField || !fieldId || !fieldName || files.length === 0) {
        return;
      }

      try {
        // This would typically call a Sitecore API to update the field
        // For now, we'll just log it
        console.log("Updating field:", {
          fieldId,
          fieldName,
          files: files.map((f) => ({ id: f.id, name: f.name, url: f.url })),
        });
      } catch (err) {
        console.error("Error updating field:", err);
        setError(`Failed to update field: ${err instanceof Error ? err.message : String(err)}`);
      }
    },
    [autoUpdateField, fieldId, fieldName]
  );

  // Define pickerCallback BEFORE openPicker since it's used there
  const pickerCallback = useCallback(
    (data: google.picker.ResponseObject) => {
      if (data.action === google.picker.Action.PICKED) {
        const files: PickedFile[] = data.docs.map((doc) => {
          // Check if it's a folder (folders have type 'application/vnd.google-apps.folder')
          const isFolder = doc.mimeType === "application/vnd.google-apps.folder";
          
          // Get preview URL from thumbnailLink if available, or construct from file ID
          const docWithExtras = doc as google.picker.Document & {
            thumbnailLink?: string;
          };
          
          let previewUrl: string | undefined;
          if (isFolder) {
            // For folders, use the folder view URL
            previewUrl = `https://drive.google.com/drive/folders/${doc.id}`;
          } else {
            previewUrl =
              docWithExtras.thumbnailLink ||
              docWithExtras.embedUrl ||
              (doc.mimeType?.includes("google-apps")
                ? `https://drive.google.com/file/d/${doc.id}/preview`
                : `https://drive.google.com/thumbnail?id=${doc.id}&sz=w1000`);
          }

          return {
            id: doc.id,
            name: doc.name,
            mimeType: doc.mimeType,
            url: doc.url,
            iconUrl: doc.iconUrl,
            previewUrl: previewUrl,
            sizeBytes: doc.sizeBytes,
            lastEditedUtc: doc.lastEditedUtc,
          };
        });
        setSelectedFiles(files);
        setError(null);
        onFilePicked?.(files);
        
        // Push JSON data to client.setValue
        if (client) {
          try {
            // Prepare JSON data - single file or array of files
            const jsonData = multiSelect || files.length > 1 ? files : files[0];
            const jsonString = JSON.stringify(jsonData, null, 2);
            
            // Set the value in the marketplace client
            client.setValue(jsonString, true);
            console.log("File data saved to client:", jsonData);
            
            // Close the app after setting the value
            client.closeApp();
          } catch (err) {
            console.error("Error saving file data to client:", err);
            setError(`Failed to save file data: ${err instanceof Error ? err.message : String(err)}`);
          }
        }
        
        // Auto-update field if enabled
        if (autoUpdateField) {
          updateComponentField(files);
        }
      } else if (data.action === google.picker.Action.CANCEL) {
        console.log("Picker was cancelled");
      }
    },
    [onFilePicked, autoUpdateField, updateComponentField, client, multiSelect]
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
      // Tab 1: Drive - Shows only root level folders and files initially
      // When a folder is selected/clicked, it navigates into that folder showing secondary level
      const driveView = new google.picker.DocsView(google.picker.ViewId.DOCS)
        .setIncludeFolders(true)
        .setSelectFolderEnabled(true)
        .setOwnedByMe(true); // Start with user's own files at root level

      // Tab 2: Spreadsheet - Only Google Sheets files (no folders)
      const spreadsheetView = new google.picker.DocsView(google.picker.ViewId.SPREADSHEETS)
        .setIncludeFolders(false)
        .setSelectFolderEnabled(false);

      // Tab 3: Presentation - Only Google Slides files (no folders)
      const presentationView = new google.picker.DocsView(google.picker.ViewId.PRESENTATIONS)
        .setIncludeFolders(false)
        .setSelectFolderEnabled(false);

      // Tab 4: Forms - Only Google Forms files (no folders)
      const formsView = new google.picker.DocsView(google.picker.ViewId.FORMS)
        .setIncludeFolders(false)
        .setSelectFolderEnabled(false);

      // Build picker with separate tabs for each type
      const pickerBuilder = new google.picker.PickerBuilder()
        .setTitle(title)
        .setOAuthToken(accessToken)
        .setDeveloperKey(GOOGLE_API_KEY)
        .addView(driveView) // Tab 1: Drive - shows folders and files, navigates into folders
        .addView(spreadsheetView) // Tab 2: Spreadsheet - only Sheets files
        .addView(presentationView) // Tab 3: Presentation - only Slides files
        .addView(formsView) // Tab 4: Forms - only Forms files
        .setOrigin(GOOGLE_PICKER_ORIGIN)
        .setCallback(pickerCallback);

      if (multiSelect) {
        pickerBuilder.enableFeature(google.picker.Feature.MULTISELECT_ENABLED);
      }

      const picker = pickerBuilder.build();
      picker.setVisible(true);
    } catch (err) {
      console.error("Error opening picker:", err);
      setError(`Failed to open Google Picker: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, [pickerLoaded, accessToken, isConnected, title, multiSelect, pickerCallback]);

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return "Unknown size";
    const sizes = ["Bytes", "KB", "MB", "GB"];
    if (bytes === 0) return "0 Bytes";
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + " " + sizes[i];
  };

  return (
    <Card style="outline">
      <CardHeader>
        <CardTitle>Google Drive Picker</CardTitle>
        <CardDescription>
          Select files from your Google Drive
        </CardDescription>
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

        {error && (
          <Alert variant="danger">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {selectedFiles.length > 0 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">
                Selected Items ({selectedFiles.length}):
              </p>
              <div className="space-y-2">
                {selectedFiles.map((file, index) => {
                  const isFolder = file.mimeType === "application/vnd.google-apps.folder";
                  return (
                    <div
                      key={file.id || index}
                      className="flex items-start gap-3 p-3 border rounded-lg"
                    >
                      <img
                        src={file.iconUrl}
                        alt={file.name}
                        className="w-6 h-6 mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{file.name}</p>
                          {isFolder && (
                            <Badge size="sm" colorScheme="primary">Folder</Badge>
                          )}
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

            {/* JSON Template Display */}
            <div className="space-y-2">
              <p className="text-sm font-medium">JSON Template:</p>
              <div className="p-4 bg-muted rounded-lg border overflow-auto">
                <pre className="text-xs font-mono whitespace-pre-wrap break-words">
                  {JSON.stringify(
                    selectedFiles.length === 1 ? selectedFiles[0] : selectedFiles,
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

