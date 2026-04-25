/**
 * Microsoft Graph SDK factory for /api/v1/users/:uid/microsoft365/* routes.
 *
 * Uses ClientSecretCredential (Azure App Registration with Graph permissions
 * Directory.ReadWrite.All + User.ReadWrite.All) to mint Graph tokens. Reads:
 *   MS_GRAPH_TENANT_ID
 *   MS_GRAPH_CLIENT_ID
 *   MS_GRAPH_CLIENT_SECRET
 * — when any are missing the helper returns null and the calling route
 * degrades gracefully.
 *
 * Default M365 domain (for upn synthesis when issuing work emails) reads
 * MS_GRAPH_DEFAULT_DOMAIN, falls back to "odum-research.com".
 */
import "server-only";
import "isomorphic-fetch";
import { Client } from "@microsoft/microsoft-graph-client";
import { ClientSecretCredential } from "@azure/identity";
import { TokenCredentialAuthenticationProvider } from "@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials";

let _client: Client | null = null;

export function getGraphClient(): Client | null {
  if (_client) return _client;
  const tenant = process.env.MS_GRAPH_TENANT_ID;
  const clientId = process.env.MS_GRAPH_CLIENT_ID;
  const clientSecret = process.env.MS_GRAPH_CLIENT_SECRET;
  if (!tenant || !clientId || !clientSecret) return null;
  const credential = new ClientSecretCredential(tenant, clientId, clientSecret);
  const authProvider = new TokenCredentialAuthenticationProvider(credential, {
    scopes: ["https://graph.microsoft.com/.default"],
  });
  _client = Client.initWithMiddleware({ authProvider });
  return _client;
}

export function getGraphDefaultDomain(): string {
  return process.env.MS_GRAPH_DEFAULT_DOMAIN ?? "odum-research.com";
}
