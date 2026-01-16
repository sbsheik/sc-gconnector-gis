// Google API (gapi)
interface Window {
  gapi: {
    load: (api: string, callback: () => void) => void;
    client: {
      init: (config: object) => Promise<void>;
      load: (api: string, version: string) => Promise<void>;
    };
  };
  google: typeof google;
}

// Google Picker API
declare namespace google.picker {
  enum Action {
    PICKED = "picked",
    CANCEL = "cancel",
    LOADED = "loaded",
  }

  enum ViewId {
    DOCS = "DOCS",
    DOCS_IMAGES = "DOCS_IMAGES",
    DOCS_IMAGES_AND_VIDEOS = "DOCS_IMAGES_AND_VIDEOS",
    DOCS_VIDEOS = "DOCS_VIDEOS",
    DOCUMENTS = "DOCUMENTS",
    DRAWINGS = "DRAWINGS",
    FOLDERS = "FOLDERS",
    FORMS = "FORMS",
    PDFS = "PDFS",
    PHOTOS = "PHOTOS",
    PRESENTATIONS = "PRESENTATIONS",
    RECENTLY_PICKED = "RECENTLY_PICKED",
    SPREADSHEETS = "SPREADSHEETS",
  }

  enum Feature {
    MINE_ONLY = "MINE_ONLY",
    MULTISELECT_ENABLED = "MULTISELECT_ENABLED",
    NAV_HIDDEN = "NAV_HIDDEN",
    SIMPLE_UPLOAD_ENABLED = "SIMPLE_UPLOAD_ENABLED",
    SUPPORT_DRIVES = "SUPPORT_DRIVES",
  }

  interface Document {
    id: string;
    name: string;
    mimeType: string;
    url: string;
    iconUrl: string;
    sizeBytes?: number;
    lastEditedUtc?: number;
    description?: string;
    parentId?: string;
    serviceId?: string;
    type?: string;
    embedUrl?: string;
    isShared?: boolean;
  }

  interface ResponseObject {
    action: Action;
    docs: Document[];
    viewToken?: string[];
  }

  class DocsView {
    constructor(viewId?: ViewId);
    setIncludeFolders(include: boolean): DocsView;
    setSelectFolderEnabled(enabled: boolean): DocsView;
    setMimeTypes(mimeTypes: string): DocsView;
    setMode(mode: string): DocsView;
    setOwnedByMe(owned: boolean): DocsView;
    setParent(parentId: string): DocsView;
    setQuery(query: string): DocsView;
    setStarred(starred: boolean): DocsView;
  }

  class DocsUploadView {
    constructor();
    setIncludeFolders(include: boolean): DocsUploadView;
    setParent(parentId: string): DocsUploadView;
  }

  class PickerBuilder {
    constructor();
    addView(view: DocsView | DocsUploadView | ViewId): PickerBuilder;
    addViewGroup(viewGroup: ViewGroup): PickerBuilder;
    disableFeature(feature: Feature): PickerBuilder;
    enableFeature(feature: Feature): PickerBuilder;
    hideTitleBar(): PickerBuilder;
    setAppId(appId: string): PickerBuilder;
    setCallback(callback: (data: ResponseObject) => void): PickerBuilder;
    setDeveloperKey(key: string): PickerBuilder;
    setDocument(document: Document): PickerBuilder;
    setLocale(locale: string): PickerBuilder;
    setMaxItems(max: number): PickerBuilder;
    setOAuthToken(token: string): PickerBuilder;
    setOrigin(origin: string): PickerBuilder;
    setRelayUrl(url: string): PickerBuilder;
    setSelectableMimeTypes(mimeTypes: string): PickerBuilder;
    setSize(width: number, height: number): PickerBuilder;
    setTitle(title: string): PickerBuilder;
    toUri(): string;
    build(): Picker;
  }

  class Picker {
    isVisible(): boolean;
    setCallback(callback: (data: ResponseObject) => void): void;
    setRelayUrl(url: string): void;
    setVisible(visible: boolean): void;
    dispose(): void;
  }

  class ViewGroup {
    constructor(view: DocsView | ViewId);
    addLabel(label: string): ViewGroup;
    addView(view: DocsView | ViewId): ViewGroup;
    addViewGroup(viewGroup: ViewGroup): ViewGroup;
  }
}

declare namespace google.accounts.oauth2 {
  interface TokenClient {
    requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
  }

  interface TokenResponse {
    access_token: string;
    expires_in: number;
    scope: string;
    token_type: string;
    error?: string;
    error_description?: string;
    error_uri?: string;
  }

  interface TokenClientConfig {
    client_id: string;
    scope: string;
    callback: (response: TokenResponse) => void;
    error_callback?: (error: { type: string; message: string }) => void;
    prompt?: string;
  }

  function initTokenClient(config: TokenClientConfig): TokenClient;
  function revoke(token: string, callback?: () => void): void;
}

declare namespace google.accounts.id {
  interface CredentialResponse {
    credential: string;
    select_by: string;
  }

  interface GsiButtonConfiguration {
    type?: "standard" | "icon";
    theme?: "outline" | "filled_blue" | "filled_black";
    size?: "large" | "medium" | "small";
    text?: "signin_with" | "signup_with" | "continue_with" | "signin";
    shape?: "rectangular" | "pill" | "circle" | "square";
    logo_alignment?: "left" | "center";
    width?: number;
    locale?: string;
  }

  function initialize(config: {
    client_id: string;
    callback: (response: CredentialResponse) => void;
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
  }): void;

  function renderButton(
    parent: HTMLElement,
    options: GsiButtonConfiguration
  ): void;

  function prompt(): void;
  function disableAutoSelect(): void;
}

