import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchServices, triggerDeploy } from "../api/deploymentApi";
import type { ServiceStatus, DeployParams } from "../types/deploymentTypes";
import {
  Button,
  Input,
  Label,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@unified-trading/ui-kit";

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
          <Label style={{ display: "block", marginBottom: "6px" }}>
            Service
          </Label>
          <Select value={serviceId} onValueChange={setServiceId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a service..." />
            </SelectTrigger>
            <SelectContent>
              {services.map((s) => (
                <SelectItem key={s.service_id} value={s.service_id}>
                  {s.name} (current: {s.current_version})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label style={{ display: "block", marginBottom: "6px" }}>
            Version
          </Label>
          <Input
            type="text"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            placeholder="e.g. v1.2.3 or sha-abc123"
          />
        </div>

        <div>
          <Label style={{ display: "block", marginBottom: "6px" }}>
            Environment
          </Label>
          <Select value={environment} onValueChange={setEnvironment}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="production">production</SelectItem>
              <SelectItem value="staging">staging</SelectItem>
              <SelectItem value="dev">dev</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label style={{ display: "block", marginBottom: "6px" }}>
            Reason (optional)
          </Label>
          <Input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Hotfix for memory leak"
          />
        </div>

        {error && (
          <div
            style={{
              color: "var(--color-accent-red)",
              fontSize: "13px",
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: "8px" }}>
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            style={{ flex: 1 }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => void handleDeploy()}
            disabled={deploying || !serviceId || !version}
            style={{ flex: 1 }}
          >
            {deploying ? "Deploying..." : "Deploy"}
          </Button>
        </div>
      </div>
    </div>
  );
}
