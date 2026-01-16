"use client";

import { useState, useCallback, useEffect } from "react";
import { useGoogleAuth } from "@/components/providers/google-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface PickedFile {
  id: string;
  name: string;
  mimeType: string;
  url: string;
  iconUrl: string;
  sizeBytes?: number;
  lastEditedUtc?: number;
}

interface GooglePickerProps {
  onFilePicked?: (files: PickedFile[]) => void;
  multiSelect?: boolean;
  viewId?: "DOCS" | "DOCS_IMAGES" | "DOCS_VIDEOS" | "DOCUMENTS" | "DRAWINGS" | "FOLDERS" | "FORMS" | "PDFS" | "PRESENTATIONS" | "SPREADSHEETS";
  title?: string;
}

const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
const GOOGLE_APP_ID = process.env.NEXT_PUBLIC_GOOGLE_APP_ID;

export const GooglePicker = ({ 
  onFilePicked, 
  multiSelect = false,
  viewId = "DOCS",
  title = "Select a file from Google Drive"
}: GooglePickerProps) => {
  const { accessToken, isConnected } = useGoogleAuth();
  const [pickerLoaded, setPickerLoaded] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<PickedFile[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Load Google Picker API
  useEffect(() => {
    if (typeof window === "undefined") return;

    const loadPicker = () => {
      if (window.gapi) {
        window.gapi.load("picker", () => {
          setPickerLoaded(true);
        });
      }
    };

    // Check if gapi is already loaded
    if (window.gapi) {
      loadPicker();
      return;
    }

    // Load the gapi script
    const script = document.createElement("script");
    script.src = "https://apis.google.com/js/api.js";
    script.async = true;
    script.defer = true;
    script.onload = loadPicker;
    document.body.appendChild(script);

    return () => {
      // Cleanup if needed
    };
  }, []);

  // Define pickerCallback BEFORE openPicker since it's used there
  const pickerCallback = useCallback((data: google.picker.ResponseObject) => {
    if (data.action === google.picker.Action.PICKED) {
      const files: PickedFile[] = data.docs.map((doc) => ({
        id: doc.id,
        name: doc.name,
        mimeType: doc.mimeType,
        url: doc.url,
        iconUrl: doc.iconUrl,
        sizeBytes: doc.sizeBytes,
        lastEditedUtc: doc.lastEditedUtc,
      }));
      
      setSelectedFiles(files);
      setError(null);
      onFilePicked?.(files);
    }
  }, [onFilePicked]);

  const openPicker = useCallback(() => {
    if (!pickerLoaded) {
      setError("Picker not loaded yet. Please wait...");
      return;
    }
    
    if (!accessToken) {
      setError("Not authenticated with Google. Please reconnect your Google account.");
      return;
    }

    if (!GOOGLE_API_KEY) {
      setError("Google API Key is not configured. Add NEXT_PUBLIC_GOOGLE_API_KEY to .env.local");
      return;
    }

    try {
      const google = window.google;
      
      if (!google || !google.picker) {
        setError("Google Picker library not loaded properly");
        return;
      }

      const viewType = google.picker.ViewId[viewId] || google.picker.ViewId.DOCS;
      const view = new google.picker.DocsView(viewType)
        .setIncludeFolders(true)
        .setSelectFolderEnabled(false);

      const pickerBuilder = new google.picker.PickerBuilder()
        .setTitle(title)
        .setOAuthToken(accessToken)
        .setDeveloperKey(GOOGLE_API_KEY)
        .addView(view)
        .addView(new google.picker.DocsUploadView())
        .setOrigin(window.location.origin)
        .setCallback(pickerCallback);

      // Temporarily disabled App ID for testing
      // if (GOOGLE_APP_ID) {
      //   pickerBuilder.setAppId(GOOGLE_APP_ID);
      // }

      if (multiSelect) {
        pickerBuilder.enableFeature(google.picker.Feature.MULTISELECT_ENABLED);
      }

      const picker = pickerBuilder.build();
      picker.setVisible(true);
    } catch (err) {
      console.error("Error opening picker:", err);
      setError(`Failed to open Google Picker: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, [pickerLoaded, accessToken, title, multiSelect, pickerCallback, viewId]);

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "Unknown size";
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes("folder")) return "📁";
    if (mimeType.includes("document")) return "📄";
    if (mimeType.includes("spreadsheet")) return "📊";
    if (mimeType.includes("presentation")) return "📽️";
    if (mimeType.includes("image")) return "🖼️";
    if (mimeType.includes("video")) return "🎬";
    if (mimeType.includes("audio")) return "🎵";
    if (mimeType.includes("pdf")) return "📕";
    return "📎";
  };

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Google Drive Picker</CardTitle>
          <CardDescription>Please connect your Google account first</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <svg className="w-6 h-6" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
            <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
            <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
            <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
            <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
            <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
            <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
          </svg>
          Google Drive Picker
        </CardTitle>
        <CardDescription>
          Select files from your Google Drive
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
            {error}
          </div>
        )}

        <Button 
          onClick={openPicker} 
          disabled={!pickerLoaded}
          className="w-full"
        >
          {pickerLoaded ? "Open Google Drive" : "Loading Picker..."}
        </Button>

        {selectedFiles.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-muted-foreground">Selected Files:</h4>
            <div className="space-y-2">
              {selectedFiles.map((file) => (
                <div 
                  key={file.id} 
                  className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border"
                >
                  <span className="text-2xl">{getFileIcon(file.mimeType)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(file.sizeBytes)}
                    </p>
                  </div>
                  <a 
                    href={file.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Open
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

