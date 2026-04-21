import { apiClient } from "@/lib/admin/api/client";
import type {
  GitHubRepo,
  GitHubRepoAssignment,
  GitHubAccessScanResult,
  GitHubDiscoveryResult,
  GitHubRepoRole,
} from "@/lib/admin/api/types";

export async function discoverRepos() {
  return apiClient.post<GitHubDiscoveryResult>("/github/discover");
}

export async function listRepos() {
  return apiClient.get<{ repos: GitHubRepo[]; total: number }>("/github/repos");
}

export async function listAssignments(params?: {
  uid?: string;
  repo?: string;
}) {
  return apiClient.get<{ assignments: GitHubRepoAssignment[]; total: number }>(
    "/github/assignments",
    { params },
  );
}

export async function assignRepo(payload: {
  firebase_uid: string;
  github_handle: string;
  repo_full_name: string;
  role: GitHubRepoRole;
}) {
  return apiClient.post<{ assignment: GitHubRepoAssignment }>(
    "/github/assignments",
    payload,
  );
}

export async function scanActualRepoAccess(githubHandle: string) {
  return apiClient.get<GitHubAccessScanResult>("/github/access-scan", {
    params: { github_handle: githubHandle },
  });
}

export async function revokeRepoAccess(assignmentId: string) {
  return apiClient.delete<{ revoked: boolean }>(
    `/github/assignments/${assignmentId}`,
  );
}
