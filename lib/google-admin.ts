import { google } from "googleapis";

type GoogleAdminConfig = {
  serviceAccountJson: string;
  subjectEmail: string;
  customerId: string;
};

function getConfig(): GoogleAdminConfig {
  const subjectEmail = process.env.GOOGLE_WORKSPACE_ADMIN_SUBJECT || "";
  const customerId = process.env.GOOGLE_WORKSPACE_CUSTOMER_ID || "my_customer";
  const jsonRaw = process.env.GOOGLE_WORKSPACE_SERVICE_ACCOUNT_JSON || "";
  const jsonB64 = process.env.GOOGLE_WORKSPACE_SERVICE_ACCOUNT_JSON_BASE64 || "";

  const serviceAccountJson = jsonRaw
    ? jsonRaw
    : jsonB64
      ? Buffer.from(jsonB64, "base64").toString("utf8")
      : "";

  if (!serviceAccountJson) {
    throw new Error(
      "Missing Google Workspace service account JSON. Set GOOGLE_WORKSPACE_SERVICE_ACCOUNT_JSON or GOOGLE_WORKSPACE_SERVICE_ACCOUNT_JSON_BASE64."
    );
  }
  if (!subjectEmail) {
    throw new Error(
      "Missing delegated admin subject. Set GOOGLE_WORKSPACE_ADMIN_SUBJECT to an admin email in your Workspace domain."
    );
  }

  return { serviceAccountJson, subjectEmail, customerId };
}

export function getDirectoryClient() {
  const { serviceAccountJson, subjectEmail } = getConfig();
  const key = JSON.parse(serviceAccountJson) as {
    client_email?: string;
    private_key?: string;
  };

  if (!key.client_email || !key.private_key) {
    throw new Error("Invalid service account JSON: missing client_email/private_key.");
  }

  const auth = new google.auth.JWT({
    email: key.client_email,
    key: key.private_key,
    scopes: [
      "https://www.googleapis.com/auth/admin.directory.user.readonly",
      "https://www.googleapis.com/auth/admin.directory.group.readonly",
      "https://www.googleapis.com/auth/admin.directory.orgunit.readonly",
    ],
    subject: subjectEmail,
  });

  return google.admin({ version: "directory_v1", auth });
}

export function getCustomerId() {
  return getConfig().customerId;
}

/** Build Admin SDK directory search query (does not support OR — use one clause). */
export function buildDirectorySearchQuery(q: string, kind: "users" | "groups"): string | undefined {
  const term = q.trim();
  if (!term) return undefined;

  // Bare terms search givenName/familyName/email (users) per Admin SDK docs.
  if (kind === "users" && !term.includes(":")) {
    return term.includes("@") ? `email:${term}*` : term;
  }

  if (kind === "groups") {
    return term.includes("@") ? `email:${term}*` : `name:${term}*`;
  }

  return term;
}

export function getAdminSdkErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "response" in error) {
    const data = (error as { response?: { data?: { error?: { message?: string } } } }).response?.data;
    if (data?.error?.message) return data.error.message;
  }
  return error instanceof Error ? error.message : String(error);
}

