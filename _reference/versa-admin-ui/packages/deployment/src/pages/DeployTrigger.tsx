import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchServices, triggerDeploy } from "../api/deploymentApi";
import type { ServiceStatus, DeployParams } from "../types/deploymentTypes";

export function DeployTrigger() {
  const navigate = useNavigate();
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [serviceId, setServiceId] = useState("");
  const [version, setVersion] = useState("");
  const [environment, setEnvironment] = useState("production");
  const [reason, setReason] = useState("");
  const [deploying, setDeploying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchServices()
      .then((svcs) => {
        setServices(svcs);
        if (svcs.length > 0 && svcs[0]) setServiceId(svcs[0].service_id);
      })
      .catch(() => setError("Failed to load services"));
  }, []);

  const handleDeploy = async () => {
    if (!serviceId || !version.trim()) {
      setError("Service and version are required.");
      return;
    }
    setDeploying(true);
    setError(null);
    const params: DeployParams = {
      service_id: serviceId,
      version: version.trim(),
      environment,
    };
    if (reason.trim()) params.reason = reason.trim();
    try {
      const job = await triggerDeploy(params);
      navigate(`/history?job=${job.job_id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Deployment failed");
      setDeploying(false);
    }
  };

  return (
    <div
      style={{ padding: "16px", fontFamily: "monospace", maxWidth: "500px" }}
    >
      <h2 style={{ marginBottom: "24px" }}>Trigger Deployment</h2>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div>
          <label
            style={{
              display: "block",
              fontSize: "12px",
              color: "#9CA3AF",
              marginBottom: "6px",
            }}
          >
            Service
          </label>
          <select
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              background: "#1F2937",
              color: "#E5E7EB",
              border: "1px solid #374151",
              borderRadius: "4px",
              boxSizing: "border-box",
            }}
          >
            <option value="">Select a service...</option>
            {services.map((s) => (
              <option key={s.service_id} value={s.service_id}>
                {s.name} (current: {s.current_version})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            style={{
              display: "block",
              fontSize: "12px",
              color: "#9CA3AF",
              marginBottom: "6px",
            }}
          >
            Version
          </label>
          <input
            type="text"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            placeholder="e.g. v1.2.3 or sha-abc123"
            style={{
              width: "100%",
              padding: "10px",
              background: "#1F2937",
              color: "#E5E7EB",
              border: "1px solid #374151",
              borderRadius: "4px",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div>
          <label
            style={{
              display: "block",
              fontSize: "12px",
              color: "#9CA3AF",
              marginBottom: "6px",
            }}
          >
            Environment
          </label>
          <select
            value={environment}
            onChange={(e) => setEnvironment(e.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              background: "#1F2937",
              color: "#E5E7EB",
              border: "1px solid #374151",
              borderRadius: "4px",
              boxSizing: "border-box",
            }}
          >
            <option value="production">production</option>
            <option value="staging">staging</option>
            <option value="dev">dev</option>
          </select>
        </div>

        <div>
          <label
            style={{
              display: "block",
              fontSize: "12px",
              color: "#9CA3AF",
              marginBottom: "6px",
            }}
          >
            Reason (optional)
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Hotfix for memory leak"
            style={{
              width: "100%",
              padding: "10px",
              background: "#1F2937",
              color: "#E5E7EB",
              border: "1px solid #374151",
              borderRadius: "4px",
              boxSizing: "border-box",
            }}
          />
        </div>

        {error && (
          <div style={{ color: "#DC2626", fontSize: "13px" }}>{error}</div>
        )}

        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => navigate("/")}
            style={{
              flex: 1,
              padding: "10px",
              background: "#374151",
              color: "#E5E7EB",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => void handleDeploy()}
            disabled={deploying || !serviceId || !version}
            style={{
              flex: 1,
              padding: "10px",
              background:
                deploying || !serviceId || !version ? "#374151" : "#2563EB",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor:
                deploying || !serviceId || !version ? "not-allowed" : "pointer",
              fontWeight: 600,
            }}
          >
            {deploying ? "Deploying..." : "Deploy"}
          </button>
        </div>
      </div>
    </div>
  );
}
