// ═══════════════════════════════════════════════════════
// Cloud Scheduler — Create/delete live triggers dynamically
// Uses gcloud REST API via service account credentials
// ═══════════════════════════════════════════════════════

const GCP_PROJECT = process.env.GCP_PROJECT || "ai-agency-eu";
const GCP_REGION = process.env.GCP_REGION || "europe-west8";
const SCHEDULER_LOCATION = "europe-west1"; // Scheduler doesn't support europe-west8
const JOB_NAME = "sinnertracker-live";
const DAILY_JOB = "sinnertracker-scrape";

// Cloud Run Job to trigger in live mode
const CLOUD_RUN_JOB_URI = `https://${GCP_REGION}-run.googleapis.com/apis/run.googleapis.com/v1/namespaces/${GCP_PROJECT}/jobs/sinnertracker-scraper:run`;

// We need to use Google Auth to call the Scheduler API
// In Cloud Run, we get automatic auth via the metadata server
async function getAccessToken() {
  // In Cloud Run, fetch token from metadata server
  try {
    const res = await fetch(
      "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token",
      { headers: { "Metadata-Flavor": "Google" } }
    );
    if (res.ok) {
      const data = await res.json();
      return data.access_token;
    }
  } catch {}

  // Local development: use gcloud
  try {
    const { execSync } = await import("child_process");
    const token = execSync("gcloud auth print-access-token 2>/dev/null", { encoding: "utf8" }).trim();
    if (token) return token;
  } catch {}

  // Try common homebrew path
  try {
    const { execSync } = await import("child_process");
    const token = execSync("/opt/homebrew/bin/gcloud auth print-access-token 2>/dev/null", { encoding: "utf8" }).trim();
    if (token) return token;
  } catch {}

  throw new Error("Cannot get GCP access token — not in Cloud Run and gcloud not available");
}

const SCHEDULER_API = `https://cloudscheduler.googleapis.com/v1/projects/${GCP_PROJECT}/locations/${SCHEDULER_LOCATION}/jobs`;

export async function liveTriggerExists() {
  const token = await getAccessToken();
  const res = await fetch(`${SCHEDULER_API}/${JOB_NAME}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.ok;
}

export async function createLiveTrigger() {
  const token = await getAccessToken();

  // Service account for OAuth
  const serviceAccount = `github-deploy@${GCP_PROJECT}.iam.gserviceaccount.com`;

  const body = {
    name: `projects/${GCP_PROJECT}/locations/${SCHEDULER_LOCATION}/jobs/${JOB_NAME}`,
    description: "SinnerTracker LIVE: update every 30 min during Sinner match",
    schedule: "*/30 * * * *",
    timeZone: "Europe/Rome",
    httpTarget: {
      uri: CLOUD_RUN_JOB_URI,
      httpMethod: "POST",
      oauthToken: {
        serviceAccountEmail: serviceAccount,
        scope: "https://www.googleapis.com/auth/cloud-platform",
      },
    },
    retryConfig: {
      retryCount: 1,
    },
  };

  const res = await fetch(SCHEDULER_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Create scheduler failed: ${res.status} ${err}`);
  }

  return true;
}

export async function deleteLiveTrigger() {
  const token = await getAccessToken();
  const res = await fetch(`${SCHEDULER_API}/${JOB_NAME}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok && res.status !== 404) {
    const err = await res.text();
    throw new Error(`Delete scheduler failed: ${res.status} ${err}`);
  }

  return true;
}
