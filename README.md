# Sitecore Marketplace App - Google Integration

A Next.js application that integrates with Sitecore XM Cloud Marketplace and Google OAuth for accessing Google services, including Google Drive Picker functionality.

## Features

- 🔐 **Sitecore Authentication** - Auth0-based authentication for Sitecore XM Cloud
- 🌐 **Google OAuth** - Secondary authentication for Google API access
- 📦 **Marketplace SDK** - Integration with Sitecore Marketplace SDK
- 📁 **Google Drive Picker** - Select files and folders from Google Drive with hierarchical navigation
- ⚡ **Next.js 16** - Built with the latest Next.js and React 19
- 🔄 **Auto-close** - Automatically closes and pushes selected file data to Sitecore Marketplace

## Prerequisites

- Node.js 18+
- Sitecore XM Cloud account with Marketplace access
- Google Cloud Console project with OAuth credentials
- Google Picker API enabled in Google Cloud Console

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
# Sitecore Auth0 Configuration
NEXT_PUBLIC_AUTH0_DOMAIN=https://auth.sitecorecloud.io
NEXT_PUBLIC_AUTH0_AUDIENCE=https://api-webapp.sitecorecloud.io
NEXT_PUBLIC_AUTH0_SCOPE=openid profile email offline_access
NEXT_PUBLIC_AUTH0_CLIENT_ID=your-auth0-client-id

# Sitecore Marketplace Configuration
NEXT_PUBLIC_SITECORE_APP_ID=your-marketplace-app-id
NEXT_PUBLIC_SITECORE_ORGANIZATION_ID=org_xxxxxxxxxxxxx
NEXT_PUBLIC_SITECORE_TENANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# App Configuration
NEXT_PUBLIC_APP_BASE_URL=https://localhost:3000

# Google OAuth Configuration
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
NEXT_PUBLIC_GOOGLE_SCOPES=email profile https://www.googleapis.com/auth/drive

# Google Picker Configuration
NEXT_PUBLIC_GOOGLE_API_KEY=your-google-api-key
NEXT_PUBLIC_GOOGLE_PICKER_ORIGIN=https://localhost:3000

# Google Workspace Admin SDK (server-side)
# IMPORTANT: these must NOT be NEXT_PUBLIC_ vars.
# Provide either raw JSON or base64 JSON for a service account that has Domain-Wide Delegation enabled.
GOOGLE_WORKSPACE_ADMIN_SUBJECT=admin@your-domain.com
GOOGLE_WORKSPACE_CUSTOMER_ID=my_customer
GOOGLE_WORKSPACE_SERVICE_ACCOUNT_JSON_BASE64=base64-of-service-account-json
# or:
# GOOGLE_WORKSPACE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

### 3. Set Up Google OAuth and Picker API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - **Google Identity Services API**
   - **Google Picker API**
   - **Google Drive API**
   - **Admin SDK API** (required for Workspace directory Users/Groups/Org Units)
4. Navigate to **APIs & Services** → **Credentials**
5. Create an **API Key** for Google Picker API
6. Click **Create Credentials** → **OAuth client ID**
7. Select **Web application**
8. Add **Authorized JavaScript origins**:
   - `https://localhost:3000` (for local development)
   - Your production domain
9. Add **Authorized redirect URIs**:
   - `https://localhost:3000` (for local development)
10. Copy the **Client ID** and **API Key** and add them to your `.env.local`

### 4. Run the Development Server

```bash
npm run dev
```

Open [https://localhost:3000](https://localhost:3000) with your browser.

> **Note:** The app runs on HTTPS by default. You may need to accept the self-signed certificate warning in your browser.

## Authentication Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     Authentication Flow                      │
│                                                             │
│  1. User visits app                                         │
│           ↓                                                 │
│  2. Sitecore Auth (Auth0) → Primary login required          │
│           ↓                                                 │
│  3. Google Auth → Secondary login for Google API access     │
│           ↓                                                 │
│  4. Google Picker → Select files/folders from Google Drive │
│           ↓                                                 │
│  5. Data pushed to Marketplace → client.setValue()         │
│           ↓                                                 │
│  6. App closes automatically                               │
└─────────────────────────────────────────────────────────────┘
```

## Google Drive Picker

The Google Picker component provides a user-friendly interface to select files and folders from Google Drive.

### Features

- **Tab 1 (Drive)**: Hierarchical navigation - shows root level folders and files, navigates into folders when selected
- **Tab 2 (Spreadsheet)**: Google Sheets files only
- **Tab 3 (Presentation)**: Google Slides files only
- **Tab 4 (Forms)**: Google Forms files only
- **Multi-select**: Support for selecting multiple files
- **JSON Display**: Shows selected file data in JSON format
- **Auto-close**: Automatically closes and pushes data to Sitecore Marketplace

## Google Workspace Directory (Admin SDK)

This project includes a `GoogleAdminDirectorySelector` component that can list/select:

- **Users**
- **Groups**
- **Org Units** (directory “folders”)

### Requirements

- **Enable API**: Admin SDK API
- **Service account**: create a service account and enable **Domain-wide delegation**
- **Admin console**: grant the service account access to these scopes:
  - `https://www.googleapis.com/auth/admin.directory.user.readonly`
  - `https://www.googleapis.com/auth/admin.directory.group.readonly`
  - `https://www.googleapis.com/auth/admin.directory.orgunit.readonly`
- **Env vars** (server-side): set `GOOGLE_WORKSPACE_ADMIN_SUBJECT` to an admin email in your Workspace domain, and provide the
  service account JSON via `GOOGLE_WORKSPACE_SERVICE_ACCOUNT_JSON` or `GOOGLE_WORKSPACE_SERVICE_ACCOUNT_JSON_BASE64`.

### PickedFile Interface

```typescript
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
```

### Usage

```tsx
import { GooglePicker } from "@/components/google-picker";

function MyComponent() {
  return (
    <GooglePicker 
      onFilePicked={(files) => console.log("Files picked:", files)}
      multiSelect={true}
    />
  );
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onFilePicked` | `(files: PickedFile[]) => void` | - | Callback when files are selected |
| `multiSelect` | `boolean` | `false` | Enable multi-file selection |
| `title` | `string` | `"Select a file from Google Drive"` | Picker dialog title |
| `autoUpdateField` | `boolean` | `false` | Auto-update Sitecore field (legacy) |
| `fieldId` | `string` | - | Sitecore field ID (legacy) |
| `fieldName` | `string` | - | Sitecore field name (legacy) |

### Data Flow

When a file or folder is selected:

1. **File data is collected** in `PickedFile` format
2. **JSON is generated** (single object for one file, array for multiple)
3. **Data is pushed** to Sitecore Marketplace via `client.setValue(jsonString, true)`
4. **App closes automatically** via `client.closeApp()`

## Project Structure

```
google-integration/
├── app/
│   ├── api/                    # API routes
│   ├── layout.tsx              # Root layout with providers
│   └── page.tsx                # Main page
├── components/
│   ├── google-picker/
│   │   ├── index.ts                          # Barrel exports
│   │   ├── google-connect-button.tsx         # Shared: Google OAuth connect
│   │   ├── use-marketplace-value.ts          # Shared: Marketplace setValue helper
│   │   ├── selection-preview.tsx             # Shared: JSON preview + Select button
│   │   ├── drive-picker/
│   │   │   └── google-picker.tsx             # Google Drive Picker
│   │   └── admin-picker/                     # Workspace Directory (Admin SDK)
│   │       ├── google-admin-directory-selector.tsx
│   │       ├── types.ts
│   │       ├── utils.ts
│   │       ├── api.ts
│   │       └── directory-tiles.tsx
│   ├── providers/
│   │   ├── auth.tsx            # Sitecore Auth0 provider
│   │   ├── google-auth.tsx     # Google OAuth provider
│   │   └── marketplace.tsx    # Marketplace SDK provider
│   ├── examples/               # SDK usage examples
│   └── ui/                     # UI components (shadcn/ui)
├── types/
│   └── google.d.ts             # Google Identity Services & Picker types
└── certificates/               # SSL certificates (auto-generated)
```

## Using Google Auth in Components

```tsx
import { useGoogleAuth } from "@/components/providers/google-auth";

function MyComponent() {
  const { 
    isConnected,      // boolean - is Google connected?
    user,             // { id, email, name, picture }
    accessToken,      // Google access token for API calls
    connectGoogle,    // function to trigger Google login
    disconnectGoogle  // function to disconnect
  } = useGoogleAuth();

  // Use accessToken to call Google APIs
  if (isConnected && accessToken) {
    // Make requests to Google Drive, Calendar, Sheets, etc.
  }
}
```

## Using Marketplace Client

```tsx
import { useMarketplaceClient } from "@/components/providers/marketplace";

function MyComponent() {
  const client = useMarketplaceClient();
  
  // Push data to Sitecore Marketplace
  const saveData = (data: any) => {
    const jsonString = JSON.stringify(data, null, 2);
    client.setValue(jsonString, true);
    client.closeApp(); // Close the app after saving
  };
}
```

## Configuration Options

### Make Google Auth Optional

To make Google login optional instead of required, update `app/layout.tsx`:

```tsx
// Remove <RequireGoogleAuth> wrapper
<AuthProvider>
  <GoogleAuthProvider>
    <MarketplaceProvider>{children}</MarketplaceProvider>
  </GoogleAuthProvider>
</AuthProvider>
```

### Add More Google Scopes

For additional Google API access, update the scopes:

```env
# Example: Add Google Drive and Calendar access
NEXT_PUBLIC_GOOGLE_SCOPES=email profile https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/calendar.readonly
```

### Configure Picker Origin

Set the origin for Google Picker API:

```env
NEXT_PUBLIC_GOOGLE_PICKER_ORIGIN=https://your-domain.com
```

If not set, it defaults to `window.location.origin`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with HTTPS |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Sitecore XM Cloud](https://doc.sitecore.com/xmc)
- [Sitecore Marketplace SDK](https://developers.sitecore.com)
- [Google Identity Services](https://developers.google.com/identity)
- [Google Picker API](https://developers.google.com/picker)

## License

Private - Sitecore Marketplace App
