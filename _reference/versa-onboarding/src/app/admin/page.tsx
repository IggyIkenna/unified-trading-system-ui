"use client";

import { useEffect, useState } from "react";

type UserRecord = {
  id: string;
  email?: string;
  displayName?: string;
  role?: string;
  groupIds?: string[];
  presentationIds?: string[];
  clientId?: string;
};

type GroupRecord = {
  id: string;
  name: string;
  presentationIds?: string[];
  isFolderGroup?: boolean;
  folderName?: string;
  gcsPath?: string;
};

type ClientRecord = {
  id: string;
  name: string;
  presentationIds?: string[];
};

type PresentationRecord = {
  id: string;
  title: string;
  gcsPath: string;
  folder?: string;
};

type Tab = "users" | "groups" | "clients" | "presentations" | "audit";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>("users");
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [groups, setGroups] = useState<GroupRecord[]>([]);
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [presentations, setPresentations] = useState<PresentationRecord[]>([]);
  const [unauthorized, setUnauthorized] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // User assignment state
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedPresentationIds, setSelectedPresentationIds] = useState<
    string[]
  >([]);
  const [selectedRole, setSelectedRole] = useState("user");
  const [accessPreview, setAccessPreview] = useState<PresentationRecord[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  // Group assignment state
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [selectedGroupPresentationIds, setSelectedGroupPresentationIds] =
    useState<string[]>([]);

  // Client assignment state
  const [selectedClientIdForEdit, setSelectedClientIdForEdit] = useState("");
  const [selectedClientPresentationIds, setSelectedClientPresentationIds] =
    useState<string[]>([]);

  // Create new entities
  const [newGroupId, setNewGroupId] = useState("");
  const [newGroupName, setNewGroupName] = useState("");
  const [newClientId, setNewClientId] = useState("");
  const [newClientName, setNewClientName] = useState("");
  const [newPresentationId, setNewPresentationId] = useState("");
  const [newPresentationTitle, setNewPresentationTitle] = useState("");
  const [newPresentationPath, setNewPresentationPath] = useState("");

  // Audit state
  const [auditPresentationId, setAuditPresentationId] = useState("");
  const [auditResult, setAuditResult] = useState<{
    users: Array<{
      id: string;
      email?: string;
      displayName?: string;
      accessVia: string[];
    }>;
    groups: Array<{ id: string; name: string }>;
    clients: Array<{ id: string; name: string }>;
  } | null>(null);

  // Discovery state
  const [discovering, setDiscovering] = useState(false);
  const [discoveryResult, setDiscoveryResult] = useState<{
    presentations: PresentationRecord[];
    folders: Array<{ id: string; name: string; presentationIds: string[] }>;
    stats: {
      totalPresentations: number;
      totalFolders: number;
      rootPresentations: number;
    };
  } | null>(null);

  const loadData = async () => {
    const [usersRes, groupsRes, clientsRes, presentationsRes] =
      await Promise.all([
        fetch("/api/admin/users", { credentials: "include" }),
        fetch("/api/admin/groups", { credentials: "include" }),
        fetch("/api/admin/clients", { credentials: "include" }),
        fetch("/api/admin/presentations", { credentials: "include" }),
      ]);

    if (
      [usersRes, groupsRes, clientsRes, presentationsRes].some(
        (res) => res.status === 403,
      )
    ) {
      setUnauthorized(true);
      return;
    }

    if (usersRes.ok) {
      const data = (await usersRes.json()) as { users: UserRecord[] };
      setUsers(data.users);
    }
    if (groupsRes.ok) {
      const data = (await groupsRes.json()) as { groups: GroupRecord[] };
      setGroups(data.groups);
    }
    if (clientsRes.ok) {
      const data = (await clientsRes.json()) as { clients: ClientRecord[] };
      setClients(data.clients);
    }
    if (presentationsRes.ok) {
      const data = (await presentationsRes.json()) as {
        presentations: PresentationRecord[];
      };
      setPresentations(data.presentations);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePreviewAccess = async () => {
    if (!selectedUserId) return;
    const response = await fetch("/api/admin/access-preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        userId: selectedUserId,
        groupIds: selectedGroupIds,
        clientId: selectedClientId,
        presentationIds: selectedPresentationIds,
      }),
    });
    if (response.ok) {
      const data = (await response.json()) as {
        presentations: PresentationRecord[];
      };
      setAccessPreview(data.presentations);
      setShowPreview(true);
    }
  };

  const handleAssignUser = async () => {
    if (!selectedUserId) return;
    await fetch(`/api/admin/users/${selectedUserId}/assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        groupIds: selectedGroupIds,
        clientId: selectedClientId || undefined,
        presentationIds: selectedPresentationIds,
        role: selectedRole,
      }),
    });
    await loadData();
    setShowPreview(false);
  };

  const handleAuditPresentation = async () => {
    if (!auditPresentationId) return;
    const response = await fetch("/api/admin/presentation-access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ presentationId: auditPresentationId }),
    });
    if (response.ok) {
      const data = await response.json();
      setAuditResult(data);
    }
  };

  const handleCreateGroup = async () => {
    await fetch("/api/admin/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        id: newGroupId,
        name: newGroupName,
        presentationIds: [],
      }),
    });
    setNewGroupId("");
    setNewGroupName("");
    await loadData();
  };

  const handleCreateClient = async () => {
    await fetch("/api/admin/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        id: newClientId,
        name: newClientName,
        presentationIds: [],
      }),
    });
    setNewClientId("");
    setNewClientName("");
    await loadData();
  };

  const handleCreatePresentation = async () => {
    await fetch("/api/admin/presentations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        id: newPresentationId,
        title: newPresentationTitle,
        gcsPath: newPresentationPath,
      }),
    });
    setNewPresentationId("");
    setNewPresentationTitle("");
    setNewPresentationPath("");
    await loadData();
  };

  const handleAssignGroup = async () => {
    if (!selectedGroupId) return;
    await fetch(`/api/admin/groups/${selectedGroupId}/assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        presentationIds: selectedGroupPresentationIds,
      }),
    });
    await loadData();
  };

  const handleAssignClient = async () => {
    if (!selectedClientIdForEdit) return;
    await fetch(`/api/admin/clients/${selectedClientIdForEdit}/assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        presentationIds: selectedClientPresentationIds,
      }),
    });
    await loadData();
  };

  const handleDiscoverPresentations = async () => {
    setDiscovering(true);
    try {
      const response = await fetch("/api/admin/discover-presentations", {
        method: "POST",
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setDiscoveryResult(data);
        await loadData(); // Reload to show newly discovered presentations
      }
    } catch (error) {
      console.error("Discovery failed:", error);
    } finally {
      setDiscovering(false);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      !searchQuery ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredPresentations = presentations.filter(
    (p) =>
      !searchQuery ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (unauthorized) {
    return (
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-16">
        <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          You do not have access to this page. Contact an admin to request
          permissions.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-16">
      <div>
        <h1 className="text-3xl font-semibold text-neutral-900">Admin Panel</h1>
        <p className="mt-2 text-neutral-700">
          Manage users, groups, clients, and presentation access.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-neutral-200">
        {(
          ["users", "groups", "clients", "presentations", "audit"] as Tab[]
        ).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
              activeTab === tab
                ? "border-b-2 border-black text-black"
                : "text-neutral-600 hover:text-black"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 rounded border border-neutral-300 px-4 py-2"
        />
      </div>

      {/* Users Tab */}
      {activeTab === "users" && (
        <div className="grid gap-6 md:grid-cols-2">
          <section className="rounded border border-neutral-200 p-6">
            <h2 className="text-lg font-semibold">Assign User Access</h2>
            <div className="mt-4 space-y-4">
              <label className="block text-sm font-medium">
                User
                <select
                  className="mt-2 w-full rounded border border-neutral-300 px-3 py-2"
                  value={selectedUserId}
                  onChange={(e) => {
                    setSelectedUserId(e.target.value);
                    const user = users.find((u) => u.id === e.target.value);
                    if (user) {
                      setSelectedGroupIds(user.groupIds ?? []);
                      setSelectedClientId(user.clientId ?? "");
                      setSelectedPresentationIds(user.presentationIds ?? []);
                      setSelectedRole(user.role ?? "user");
                      setShowPreview(false);
                    }
                  }}
                >
                  <option value="">Select a user</option>
                  {filteredUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.email || user.id}{" "}
                      {user.role === "admin" && "(Admin)"}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-medium">
                Role
                <select
                  className="mt-2 w-full rounded border border-neutral-300 px-3 py-2"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </label>

              <label className="block text-sm font-medium">
                Client (optional - gives access to all client presentations)
                <select
                  className="mt-2 w-full rounded border border-neutral-300 px-3 py-2"
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                >
                  <option value="">No client</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-medium">
                Groups
                <select
                  multiple
                  className="mt-2 h-32 w-full rounded border border-neutral-300 px-3 py-2"
                  value={selectedGroupIds}
                  onChange={(e) =>
                    setSelectedGroupIds(
                      Array.from(e.target.selectedOptions).map(
                        (opt) => opt.value,
                      ),
                    )
                  }
                >
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                      {group.isFolderGroup ? " (Folder Group)" : ""} (
                      {group.isFolderGroup
                        ? "auto-discovered"
                        : `${group.presentationIds?.length || 0} presentations`}
                      )
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-medium">
                Direct Presentations
                <select
                  multiple
                  className="mt-2 h-32 w-full rounded border border-neutral-300 px-3 py-2"
                  value={selectedPresentationIds}
                  onChange={(e) =>
                    setSelectedPresentationIds(
                      Array.from(e.target.selectedOptions).map(
                        (opt) => opt.value,
                      ),
                    )
                  }
                >
                  {filteredPresentations.map((presentation) => (
                    <option key={presentation.id} value={presentation.id}>
                      {presentation.title}
                      {presentation.folder
                        ? ` (${presentation.folder}/)`
                        : " (root)"}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex gap-2">
                <button
                  onClick={handlePreviewAccess}
                  className="flex-1 rounded border border-neutral-300 bg-white px-4 py-2 text-sm font-medium hover:bg-neutral-50"
                >
                  Preview Access
                </button>
                <button
                  onClick={handleAssignUser}
                  className="flex-1 rounded bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
                >
                  Save Access
                </button>
              </div>
            </div>
          </section>

          {showPreview && (
            <section className="rounded border border-neutral-200 p-6">
              <h2 className="text-lg font-semibold">Access Preview</h2>
              <p className="mt-2 text-sm text-neutral-600">
                This user will have access to {accessPreview.length}{" "}
                presentation
                {accessPreview.length !== 1 ? "s" : ""}:
              </p>
              <ul className="mt-4 max-h-96 space-y-2 overflow-y-auto">
                {accessPreview.map((p) => (
                  <li key={p.id} className="rounded bg-neutral-50 p-2 text-sm">
                    {p.title}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      {/* Groups Tab */}
      {activeTab === "groups" && (
        <div className="grid gap-6 md:grid-cols-2">
          <section className="rounded border border-neutral-200 p-6">
            <h2 className="text-lg font-semibold">Create Group</h2>
            <div className="mt-4 space-y-4">
              <input
                className="w-full rounded border border-neutral-300 px-3 py-2"
                placeholder="Group ID"
                value={newGroupId}
                onChange={(e) => setNewGroupId(e.target.value)}
              />
              <input
                className="w-full rounded border border-neutral-300 px-3 py-2"
                placeholder="Group name"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
              />
              <button
                onClick={handleCreateGroup}
                className="w-full rounded bg-black px-4 py-2 text-white"
              >
                Create Group
              </button>
            </div>
          </section>

          <section className="rounded border border-neutral-200 p-6">
            <h2 className="text-lg font-semibold">
              Assign Presentations to Group
            </h2>
            <div className="mt-4 space-y-4">
              <label className="block text-sm font-medium">
                Group
                <select
                  className="mt-2 w-full rounded border border-neutral-300 px-3 py-2"
                  value={selectedGroupId}
                  onChange={(e) => {
                    setSelectedGroupId(e.target.value);
                    const group = groups.find((g) => g.id === e.target.value);
                    if (group) {
                      setSelectedGroupPresentationIds(
                        group.presentationIds ?? [],
                      );
                    }
                  }}
                >
                  <option value="">Select a group</option>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-medium">
                Presentations
                <select
                  multiple
                  className="mt-2 h-64 w-full rounded border border-neutral-300 px-3 py-2"
                  value={selectedGroupPresentationIds}
                  onChange={(e) =>
                    setSelectedGroupPresentationIds(
                      Array.from(e.target.selectedOptions).map(
                        (opt) => opt.value,
                      ),
                    )
                  }
                >
                  {filteredPresentations.map((presentation) => (
                    <option key={presentation.id} value={presentation.id}>
                      {presentation.title}
                      {presentation.folder
                        ? ` (${presentation.folder}/)`
                        : " (root)"}
                    </option>
                  ))}
                </select>
              </label>
              <button
                onClick={handleAssignGroup}
                className="w-full rounded bg-black px-4 py-2 text-white"
              >
                Save Group Access
              </button>
            </div>
          </section>
        </div>
      )}

      {/* Clients Tab */}
      {activeTab === "clients" && (
        <div className="grid gap-6 md:grid-cols-2">
          <section className="rounded border border-neutral-200 p-6">
            <h2 className="text-lg font-semibold">Create Client</h2>
            <div className="mt-4 space-y-4">
              <input
                className="w-full rounded border border-neutral-300 px-3 py-2"
                placeholder="Client ID"
                value={newClientId}
                onChange={(e) => setNewClientId(e.target.value)}
              />
              <input
                className="w-full rounded border border-neutral-300 px-3 py-2"
                placeholder="Client name"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
              />
              <button
                onClick={handleCreateClient}
                className="w-full rounded bg-black px-4 py-2 text-white"
              >
                Create Client
              </button>
            </div>
          </section>

          <section className="rounded border border-neutral-200 p-6">
            <h2 className="text-lg font-semibold">
              Assign Presentations to Client
            </h2>
            <div className="mt-4 space-y-4">
              <label className="block text-sm font-medium">
                Client
                <select
                  className="mt-2 w-full rounded border border-neutral-300 px-3 py-2"
                  value={selectedClientIdForEdit}
                  onChange={(e) => {
                    setSelectedClientIdForEdit(e.target.value);
                    const client = clients.find((c) => c.id === e.target.value);
                    if (client) {
                      setSelectedClientPresentationIds(
                        client.presentationIds ?? [],
                      );
                    }
                  }}
                >
                  <option value="">Select a client</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-medium">
                Presentations
                <select
                  multiple
                  className="mt-2 h-64 w-full rounded border border-neutral-300 px-3 py-2"
                  value={selectedClientPresentationIds}
                  onChange={(e) =>
                    setSelectedClientPresentationIds(
                      Array.from(e.target.selectedOptions).map(
                        (opt) => opt.value,
                      ),
                    )
                  }
                >
                  {filteredPresentations.map((presentation) => (
                    <option key={presentation.id} value={presentation.id}>
                      {presentation.title}
                    </option>
                  ))}
                </select>
              </label>
              <button
                onClick={handleAssignClient}
                className="w-full rounded bg-black px-4 py-2 text-white"
              >
                Save Client Access
              </button>
            </div>
          </section>
        </div>
      )}

      {/* Presentations Tab */}
      {activeTab === "presentations" && (
        <div className="space-y-6">
          <section className="rounded border border-neutral-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">
                  Discover Presentations from GCS
                </h2>
                <p className="mt-1 text-sm text-neutral-600">
                  Scan the GCS bucket to automatically discover HTML files and
                  folder-based groups. Folders in the presentations/ directory
                  become groups.
                </p>
              </div>
              <button
                onClick={handleDiscoverPresentations}
                disabled={discovering}
                className="rounded bg-black px-6 py-2 text-white disabled:opacity-50"
              >
                {discovering ? "Discovering..." : "Discover Presentations"}
              </button>
            </div>
            {discoveryResult && (
              <div className="mt-4 rounded bg-green-50 p-4 text-sm">
                <p className="font-medium text-green-800">
                  Discovery complete! Found{" "}
                  {discoveryResult.stats.totalPresentations} presentations in{" "}
                  {discoveryResult.stats.totalFolders} folders.
                </p>
                <p className="mt-1 text-green-700">
                  {discoveryResult.stats.rootPresentations} presentations in
                  root,{" "}
                  {discoveryResult.stats.totalPresentations -
                    discoveryResult.stats.rootPresentations}{" "}
                  in folders.
                </p>
              </div>
            )}
          </section>

          <section className="rounded border border-neutral-200 p-6">
            <h2 className="text-lg font-semibold">Manual Presentation Entry</h2>
            <p className="mt-1 text-sm text-neutral-600">
              Or manually create a presentation entry (usually not needed if
              using discovery)
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-4">
              <input
                className="rounded border border-neutral-300 px-3 py-2"
                placeholder="Presentation ID"
                value={newPresentationId}
                onChange={(e) => setNewPresentationId(e.target.value)}
              />
              <input
                className="rounded border border-neutral-300 px-3 py-2"
                placeholder="Title"
                value={newPresentationTitle}
                onChange={(e) => setNewPresentationTitle(e.target.value)}
              />
              <input
                className="rounded border border-neutral-300 px-3 py-2"
                placeholder="GCS path (e.g., presentations/demo.html)"
                value={newPresentationPath}
                onChange={(e) => setNewPresentationPath(e.target.value)}
              />
              <button
                onClick={handleCreatePresentation}
                className="rounded bg-black px-4 py-2 text-white"
              >
                Create
              </button>
            </div>
          </section>

          {/* Show folder structure */}
          {groups.filter((g) => g.isFolderGroup).length > 0 && (
            <section className="rounded border border-neutral-200 p-6">
              <h2 className="text-lg font-semibold">Folder-Based Groups</h2>
              <p className="mt-1 text-sm text-neutral-600">
                These groups are automatically created from GCS folder structure
              </p>
              <div className="mt-4 space-y-2">
                {groups
                  .filter((g) => g.isFolderGroup)
                  .map((group) => (
                    <div
                      key={group.id}
                      className="rounded border border-neutral-200 bg-neutral-50 p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">{group.name}</h3>
                          <p className="text-sm text-neutral-600">
                            {group.presentationIds?.length || 0} presentations
                            {group.gcsPath && ` • ${group.gcsPath}`}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </section>
          )}

          {/* Show all presentations grouped by folder */}
          {presentations.length > 0 && (
            <section className="rounded border border-neutral-200 p-6">
              <h2 className="text-lg font-semibold">All Presentations</h2>
              <div className="mt-4 space-y-4">
                {(() => {
                  const byFolder = new Map<string, PresentationRecord[]>();
                  const root: PresentationRecord[] = [];
                  presentations.forEach((p) => {
                    if (p.folder) {
                      if (!byFolder.has(p.folder)) {
                        byFolder.set(p.folder, []);
                      }
                      byFolder.get(p.folder)!.push(p);
                    } else {
                      root.push(p);
                    }
                  });

                  return (
                    <>
                      {Array.from(byFolder.entries()).map(([folder, pres]) => (
                        <div
                          key={folder}
                          className="rounded border border-neutral-200 p-4"
                        >
                          <h3 className="font-medium">Folder: {folder}</h3>
                          <ul className="mt-2 space-y-1">
                            {pres.map((p) => (
                              <li
                                key={p.id}
                                className="text-sm text-neutral-600"
                              >
                                • {p.title} ({p.id})
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                      {root.length > 0 && (
                        <div className="rounded border border-neutral-200 p-4">
                          <h3 className="font-medium">Root Presentations</h3>
                          <ul className="mt-2 space-y-1">
                            {root.map((p) => (
                              <li
                                key={p.id}
                                className="text-sm text-neutral-600"
                              >
                                • {p.title} ({p.id})
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Audit Tab */}
      {activeTab === "audit" && (
        <div className="grid gap-6 md:grid-cols-2">
          <section className="rounded border border-neutral-200 p-6">
            <h2 className="text-lg font-semibold">Access Audit</h2>
            <p className="mt-2 text-sm text-neutral-600">
              See who has access to a specific presentation
            </p>
            <div className="mt-4 space-y-4">
              <label className="block text-sm font-medium">
                Presentation
                <select
                  className="mt-2 w-full rounded border border-neutral-300 px-3 py-2"
                  value={auditPresentationId}
                  onChange={(e) => setAuditPresentationId(e.target.value)}
                >
                  <option value="">Select a presentation</option>
                  {filteredPresentations.map((presentation) => (
                    <option key={presentation.id} value={presentation.id}>
                      {presentation.title}
                    </option>
                  ))}
                </select>
              </label>
              <button
                onClick={handleAuditPresentation}
                className="w-full rounded bg-black px-4 py-2 text-white"
              >
                Audit Access
              </button>
            </div>
          </section>

          {auditResult && (
            <section className="rounded border border-neutral-200 p-6">
              <h2 className="text-lg font-semibold">Access Results</h2>
              <div className="mt-4 space-y-4">
                <div>
                  <h3 className="font-medium">
                    Users ({auditResult.users.length})
                  </h3>
                  <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto text-sm">
                    {auditResult.users.map((user) => (
                      <li key={user.id} className="rounded bg-neutral-50 p-2">
                        {user.email || user.id}
                        <span className="ml-2 text-xs text-neutral-600">
                          ({user.accessVia.join(", ")})
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                {auditResult.groups.length > 0 && (
                  <div>
                    <h3 className="font-medium">
                      Groups ({auditResult.groups.length})
                    </h3>
                    <ul className="mt-2 space-y-1 text-sm">
                      {auditResult.groups.map((group) => (
                        <li
                          key={group.id}
                          className="rounded bg-neutral-50 p-2"
                        >
                          {group.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {auditResult.clients.length > 0 && (
                  <div>
                    <h3 className="font-medium">
                      Clients ({auditResult.clients.length})
                    </h3>
                    <ul className="mt-2 space-y-1 text-sm">
                      {auditResult.clients.map((client) => (
                        <li
                          key={client.id}
                          className="rounded bg-neutral-50 p-2"
                        >
                          {client.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
