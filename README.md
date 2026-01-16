# Sitecore Marketplace App - Google Integration

A Next.js application that integrates with Sitecore XM Cloud Marketplace and provides Google OAuth authentication with Google Drive Picker functionality using a popup-based authentication flow.

## Features

- 🔐 **Sitecore Authentication** - Auth0-based authentication for Sitecore XM Cloud
- 🌐 **Google OAuth (Popup Flow)** - Google Identity Services with popup-based authentication
- 📁 **Google Drive Picker** - Native Google Drive file picker integration
- 📦 **Marketplace SDK** - Full integration with Sitecore Marketplace SDK
- ⚡ **Next.js 16** - Built with Next.js 16.1.1 and React 19
- 🎨 **Modern UI** - Tailwind CSS 4 with shadcn/ui components

## Prerequisites

- Node.js 18+
- Sitecore XM Cloud account with Marketplace access
- Google Cloud Console project with OAuth credentials and Picker API enabled

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
NEXT_PUBLIC_APP_BASE_URL=https://googlepicker.localhost:3000

# Google OAuth Configuration
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
NEXT_PUBLIC_GOOGLE_SCOPES=email profile https://www.googleapis.com/auth/drive

# Google Picker Configuration (required for Drive Picker)
NEXT_PUBLIC_GOOGLE_API_KEY=your-google-api-key
NEXT_PUBLIC_GOOGLE_APP_ID=your-google-app-id
```

### 3. Set Up Google OAuth & Picker API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** → **Library**
4. Enable the following APIs:
   - **Google Picker API**
   - **Google Drive API**
5. Navigate to **APIs & Services** → **Credentials**
6. Create **API Key**:
   - Click **Create Credentials** → **API key**
   - Restrict the key to the Picker API for security
   - Copy the key to `NEXT_PUBLIC_GOOGLE_API_KEY`
7. Create **OAuth Client ID**:
   - Click **Create Credentials** → **OAuth client ID**
   - Select **Web application**
   - Add **Authorized JavaScript origins**:
     - `https://googlepicker.localhost:3000` (for local development)
   - Copy the **Client ID** to `NEXT_PUBLIC_GOOGLE_CLIENT_ID`

> **Note:** No callback/redirect URI is required. This app uses Google Identity Services with a popup-based flow, which only requires JavaScript origins to be configured.

### 4. Configure Local Hostname

Add the following entry to your hosts file:

**Windows:** `C:\Windows\System32\drivers\etc\hosts`  
**macOS/Linux:** `/etc/hosts`

```
127.0.0.1 googlepicker.localhost
```

### 5. Run the Development Server

```bash
npm run dev
```

Open [https://googlepicker.localhost:3000](https://googlepicker.localhost:3000) with your browser.

> **Note:** The app runs on HTTPS by default using Next.js experimental HTTPS. You may need to accept the self-signed certificate warning in your browser.

## Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     Authentication Flow                          │
│                                                                  │
│  1. User visits app                                              │
│           ↓                                                      │
│  2. Sitecore Auth (Auth0) → Primary login via redirect           │
│           ↓                                                      │
│  3. Google Auth → Popup-based OAuth for Google API access        │
│           ↓                                                      │
│  4. Marketplace SDK → Initializes connection to XM Cloud         │
│           ↓                                                      │
│  5. App Content → Fully accessible with all features             │
└─────────────────────────────────────────────────────────────────┘
```

## Project Structure

```
google-integration/
├── app/
│   ├── api/
│   │   └── sites/languages/           # XMC API proxy route
│   ├── layout.tsx                     # Root layout with auth providers
│   ├── page.tsx                       # Main demo page
│   └── globals.css                    # Global styles
├── components/
│   ├── providers/
│   │   ├── auth.tsx                   # Sitecore Auth0 provider
│   │   ├── google-auth.tsx            # Google OAuth provider (popup flow)
│   │   └── marketplace.tsx            # Marketplace SDK provider
│   ├── examples/
│   │   ├── built-in-auth/             # SDK with built-in auth examples
│   │   └── custom-auth/               # Custom auth examples (API route, server action)
│   ├── ui/                            # shadcn/ui components
│   ├── google-connect-button.tsx      # Google account connection button
│   ├── google-picker.tsx              # Google Drive file picker
│   └── require-google-auth.tsx        # Auth gate component
├── lib/
│   ├── icon.tsx                       # Icon utilities
│   └── utils.ts                       # Helper utilities
├── types/
│   └── google.d.ts                    # Google Identity Services TypeScript types
└── certificates/                      # SSL certificates (auto-generated)
```

## Components

### GoogleAuthProvider

Manages Google OAuth state and provides authentication functions via popup flow.

```tsx
import { useGoogleAuth } from "@/components/providers/google-auth";

function MyComponent() {
  const { 
    isConnected,      // boolean - is Google connected?
    isLoading,        // boolean - auth in progress?
    isInitialized,    // boolean - provider ready?
    user,             // { id, email, name, picture } | null
    accessToken,      // Google access token for API calls
    connectGoogle,    // function - trigger Google login popup
    disconnectGoogle, // function - revoke token and disconnect
    error             // string | null - error message
  } = useGoogleAuth();

  if (isConnected && accessToken) {
    // Make requests to Google APIs (Drive, Calendar, etc.)
  }
}
```

### GooglePicker

A ready-to-use Google Drive file picker component.

```tsx
import { GooglePicker } from "@/components/google-picker";

function MyComponent() {
  const handleFilePicked = (files) => {
    // files: Array<{ id, name, mimeType, url, iconUrl, sizeBytes?, lastEditedUtc? }>
    console.log("Selected files:", files);
  };

  return (
    <GooglePicker 
      onFilePicked={handleFilePicked}
      multiSelect={true}                    // Allow multiple file selection
      viewId="DOCS"                         // Filter by file type
      title="Select files from Drive"       // Picker dialog title
    />
  );
}
```

**Available `viewId` options:**
- `DOCS` - All Google Docs
- `DOCUMENTS` - Google Documents only
- `SPREADSHEETS` - Google Sheets only
- `PRESENTATIONS` - Google Slides only
- `PDFS` - PDF files only
- `FOLDERS` - Folders only
- `DOCS_IMAGES` - Images only
- `DOCS_VIDEOS` - Videos only

### RequireGoogleAuth

A wrapper component that enforces Google authentication before rendering children.

```tsx
import { RequireGoogleAuth } from "@/components/require-google-auth";

// In your layout or page:
<RequireGoogleAuth>
  <YourProtectedContent />
</RequireGoogleAuth>
```

### GoogleConnectButton

A pre-styled button for connecting/disconnecting Google accounts.

```tsx
import { GoogleConnectButton } from "@/components/google-connect-button";

function MyComponent() {
  return <GoogleConnectButton />;
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

Update the scopes in `.env.local` for additional API access:

```env
# Example: Add Calendar and Gmail access
NEXT_PUBLIC_GOOGLE_SCOPES=email profile https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/gmail.readonly
```

## SDK Usage Examples

The app includes several example components demonstrating Marketplace SDK usage:

| Example | Location | Description |
|---------|----------|-------------|
| Application Context | `components/examples/built-in-auth/application-context.tsx` | Display current app context |
| List Languages (Client SDK) | `components/examples/built-in-auth/with-xmc/list-languages.tsx` | Fetch languages using built-in auth |
| List Languages (API Route) | `components/examples/custom-auth/with-api-route/list-languages.tsx` | Fetch via custom API route |
| List Languages (Server Action) | `components/examples/custom-auth/with-server-action/list-languages.tsx` | Fetch via server action |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with HTTPS on `googlepicker.localhost:3000` |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.1.1 | React framework |
| React | 19.2.3 | UI library |
| Tailwind CSS | 4.x | Styling |
| Auth0 React | 2.11.0 | Sitecore authentication |
| Sitecore Marketplace SDK | 0.3.x | XM Cloud integration |
| shadcn/ui | Latest | UI components |
| Lucide React | 0.562.0 | Icons |

## Troubleshooting

### Google Picker Not Loading

- Ensure `NEXT_PUBLIC_GOOGLE_API_KEY` is set
- Verify the Picker API is enabled in Google Cloud Console
- Check that the API key is not restricted to different domains

### OAuth Popup Blocked

- Ensure popups are allowed for the domain
- The popup must be triggered by a user action (click)

### "Failed to initialize Google authentication"

- Verify `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is correct
- Check that JavaScript origins include your development URL
- Ensure you're accessing via the correct hostname (`googlepicker.localhost`)

### Marketplace SDK Connection Error

- The app must be loaded within a Sitecore Marketplace parent window
- Check that extension points are properly configured in your Marketplace app settings

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Sitecore XM Cloud](https://doc.sitecore.com/xmc)
- [Sitecore Marketplace SDK](https://developers.sitecore.com)
- [Google Identity Services](https://developers.google.com/identity)
- [Google Picker API](https://developers.google.com/picker)

## License

Private - Sitecore Marketplace App
