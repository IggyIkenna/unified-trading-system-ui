import { SecretManagerServiceClient } from "@google-cloud/secret-manager";

const smClient = new SecretManagerServiceClient();
const cache = new Map();

function isSecretResourceName(value) {
  return typeof value === "string" && value.startsWith("projects/");
}

export async function getSecretFromEnv(envName) {
  const raw = process.env[envName];
  if (!raw) return null;
  if (!isSecretResourceName(raw)) return raw;
  if (cache.has(raw)) return cache.get(raw);
  const [version] = await smClient.accessSecretVersion({ name: raw });
  const data = version.payload?.data?.toString("utf8") || "";
  cache.set(raw, data);
  return data;
}

export async function resolveFirebaseApiKey() {
  const firebaseApiKeyFromSecretRef = await getSecretFromEnv(
    "SECRET_REF_FIREBASE_API_KEY",
  );
  return firebaseApiKeyFromSecretRef || process.env.FIREBASE_API_KEY || "";
}

export async function loadProviderSecrets() {
  const [
    githubToken,
    slackScimToken,
    slackBotToken,
    msClientSecret,
    portalToken,
    awsAccessKeyId,
    awsSecretAccessKey,
    awsSessionToken,
  ] = await Promise.all([
    getSecretFromEnv("SECRET_REF_GITHUB_ADMIN_PAT"),
    getSecretFromEnv("SECRET_REF_SLACK_SCIM_TOKEN"),
    getSecretFromEnv("SECRET_REF_SLACK_BOT_TOKEN"),
    getSecretFromEnv("SECRET_REF_MS_GRAPH_CLIENT_SECRET"),
    getSecretFromEnv("SECRET_REF_PORTAL_SERVICE_TOKEN"),
    getSecretFromEnv("SECRET_REF_AWS_ACCESS_KEY_ID"),
    getSecretFromEnv("SECRET_REF_AWS_SECRET_ACCESS_KEY"),
    getSecretFromEnv("AWS_SESSION_TOKEN"),
  ]);

  const resolvedSlackScimToken =
    slackScimToken ||
    process.env.SLACK_SCIM_TOKEN ||
    process.env.SLACK_ADMIN_TOKEN ||
    "";
  const resolvedSlackBotToken =
    slackBotToken || process.env.SLACK_BOT_TOKEN || "";

  return {
    githubToken: githubToken || process.env.GITHUB_ADMIN_PAT || "",
    slackScimToken: resolvedSlackScimToken,
    slackBotToken: resolvedSlackBotToken,
    msClientSecret: msClientSecret || process.env.MS_GRAPH_CLIENT_SECRET || "",
    portalToken: portalToken || process.env.PORTAL_SERVICE_TOKEN || "",
    awsAccessKeyId: awsAccessKeyId || process.env.AWS_ACCESS_KEY_ID || "",
    awsSecretAccessKey:
      awsSecretAccessKey || process.env.AWS_SECRET_ACCESS_KEY || "",
    awsSessionToken: awsSessionToken || process.env.AWS_SESSION_TOKEN || "",
  };
}
