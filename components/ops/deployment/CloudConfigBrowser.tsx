"use client"

import { useState, useEffect, useCallback } from "react";
import {
  Cloud,
  ChevronRight,
  Loader2,
  FolderOpen,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  listDirectories,
  discoverConfigs,
  getConfigBuckets,
} from "@/hooks/deployment/_api-stub";

interface CloudConfigBrowserProps {
  serviceName: string;
  onPathSelected: (path: string, configCount: number) => void;
}

interface BreadcrumbLevel {
  name: string;
  path: string;
}

export function CloudConfigBrowser({
  serviceName,
  onPathSelected,
}: CloudConfigBrowserProps) {
  // State for bucket selection
  const [buckets, setBuckets] = useState<Array<{ name: string; path: string }>>(
    [],
  );
  const [selectedBucket, setSelectedBucket] = useState<string>("");
  const [loadingBuckets, setLoadingBuckets] = useState(false);

  // State for directory browsing
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbLevel[]>([]);
  const [currentDirectories, setCurrentDirectories] = useState<string[]>([]);
  const [loadingDirectories, setLoadingDirectories] = useState(false);
  const [_selectedDirectory, setSelectedDirectory] = useState<string>("");

  // State for config discovery
  const [discoveredCount, setDiscoveredCount] = useState<number | null>(null);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get current full path
  const getCurrentPath = useCallback(() => {
    if (!selectedBucket) return "";
    if (breadcrumbs.length === 0) return selectedBucket;
    return breadcrumbs[breadcrumbs.length - 1].path;
  }, [selectedBucket, breadcrumbs]);

  // Load buckets on mount
  useEffect(() => {
    async function loadBuckets() {
      setLoadingBuckets(true);
      try {
        const result = await getConfigBuckets(serviceName);
        setBuckets(result.buckets || []);
        if (result.default_bucket) {
          setSelectedBucket(result.default_bucket);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load buckets");
      } finally {
        setLoadingBuckets(false);
      }
    }
    loadBuckets();
  }, [serviceName]);

  // Load directories when bucket or breadcrumb changes
  useEffect(() => {
    async function loadDirectories() {
      const path = getCurrentPath();
      if (!path) return;

      setLoadingDirectories(true);
      setCurrentDirectories([]);
      setSelectedDirectory("");
      setError(null);

      try {
        const result = await listDirectories(serviceName, path);
        setCurrentDirectories(result.directories);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load directories",
        );
      } finally {
        setLoadingDirectories(false);
      }
    }
    loadDirectories();
  }, [serviceName, selectedBucket, breadcrumbs, getCurrentPath]);

  // Handle bucket selection
  const handleBucketSelect = (path: string) => {
    setSelectedBucket(path);
    setBreadcrumbs([]);
    setDiscoveredCount(null);
    onPathSelected("", 0);
  };

  // Navigate into a directory
  const navigateInto = (dirName: string) => {
    const currentPath = getCurrentPath();
    const newPath = currentPath.endsWith("/")
      ? `${currentPath}${dirName}/`
      : `${currentPath}/${dirName}/`;

    setBreadcrumbs((prev) => [...prev, { name: dirName, path: newPath }]);
    setSelectedDirectory("");
    setDiscoveredCount(null);
  };

  // Navigate to a breadcrumb level
  const navigateToBreadcrumb = (index: number) => {
    if (index < 0) {
      // Go back to bucket root
      setBreadcrumbs([]);
    } else {
      setBreadcrumbs((prev) => prev.slice(0, index + 1));
    }
    setDiscoveredCount(null);
  };

  // Discover configs at current path
  const handleDiscover = async () => {
    const path = getCurrentPath();
    if (!path) return;

    setIsDiscovering(true);
    setError(null);

    try {
      const result = await discoverConfigs(serviceName, path);
      setDiscoveredCount(result.total_configs);
      onPathSelected(path, result.total_configs);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to discover configs",
      );
      setDiscoveredCount(null);
      onPathSelected("", 0);
    } finally {
      setIsDiscovering(false);
    }
  };

  // Select directory - auto-navigate into it
  const handleDirectorySelect = (dirName: string) => {
    setSelectedDirectory(dirName);
    // Auto-navigate into the selected directory
    navigateInto(dirName);
  };

  return (
    <div className="space-y-3">
      <Label className="flex items-center gap-2">
        <Cloud className="h-4 w-4 text-[var(--color-text-muted)]" />
        Config Path (GCS or S3)
      </Label>

      {/* Bucket Selection */}
      {buckets.length > 0 && (
        <div className="space-y-2">
          <Select
            value={selectedBucket}
            onValueChange={handleBucketSelect}
            disabled={loadingBuckets}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select config bucket..." />
            </SelectTrigger>
            <SelectContent>
              {buckets.map((bucket) => (
                <SelectItem key={bucket.path} value={bucket.path}>
                  <span className="font-mono text-sm">{bucket.name}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Breadcrumb Navigation */}
      {selectedBucket && (
        <div className="flex items-center gap-1 text-xs font-mono text-[var(--color-text-muted)] flex-wrap bg-[var(--color-bg-tertiary)] p-2 rounded">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigateToBreadcrumb(-1)}
            className="hover:text-[var(--color-accent-cyan)] transition-colors h-auto p-0 text-xs font-mono"
          >
            configs/
          </Button>
          {breadcrumbs.map((crumb, index) => (
            <span key={crumb.path} className="flex items-center gap-1">
              <ChevronRight className="h-3 w-3" />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateToBreadcrumb(index)}
                className="hover:text-[var(--color-accent-cyan)] transition-colors h-auto p-0 text-xs font-mono"
              >
                {crumb.name}/
              </Button>
            </span>
          ))}
        </div>
      )}

      {/* Directory Selection - auto-navigates on select */}
      {selectedBucket && currentDirectories.length > 0 && (
        <div className="space-y-1">
          <Select
            value=""
            onValueChange={handleDirectorySelect}
            disabled={loadingDirectories}
          >
            <SelectTrigger>
              {loadingDirectories ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading directories...
                </span>
              ) : (
                <SelectValue
                  placeholder={`Select from ${currentDirectories.length} directories...`}
                />
              )}
            </SelectTrigger>
            <SelectContent>
              {currentDirectories.map((dir) => (
                <SelectItem key={dir} value={dir}>
                  <span className="flex items-center gap-2">
                    <FolderOpen className="h-4 w-4 text-[var(--color-accent-amber)]" />
                    <span className="font-mono">{dir}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-[var(--color-text-muted)]">
            Select a directory to navigate into it
          </p>
        </div>
      )}

      {/* No subdirectories message */}
      {selectedBucket &&
        !loadingDirectories &&
        currentDirectories.length === 0 && (
          <div className="text-sm text-[var(--color-text-muted)] p-2 bg-[var(--color-bg-tertiary)] rounded">
            No subdirectories here - click "Discover Configs" to find config
            files at this level
          </div>
        )}

      {/* Discover Button */}
      {selectedBucket && (
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleDiscover}
            disabled={isDiscovering}
            className="flex-1"
          >
            {isDiscovering ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Discovering...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Discover Configs Here
              </>
            )}
          </Button>
        </div>
      )}

      {/* Discovery Result */}
      {discoveredCount !== null && (
        <div
          className={`flex items-center gap-2 p-2 rounded ${
            discoveredCount >= 10000 ? "status-warning" : "status-success"
          }`}
        >
          <CheckCircle2
            className={`h-4 w-4 ${
              discoveredCount >= 10000
                ? "text-[var(--color-accent-amber)]"
                : "text-[var(--color-accent-green)]"
            }`}
          />
          <span className="text-sm text-[var(--color-text-secondary)]">
            Found{" "}
            <span
              className={`font-bold ${
                discoveredCount >= 10000
                  ? "text-[var(--color-accent-amber)]"
                  : "text-[var(--color-accent-green)]"
              }`}
            >
              {discoveredCount >= 10000
                ? `${discoveredCount}+`
                : discoveredCount}
            </span>{" "}
            config files
            {discoveredCount >= 10000 && (
              <span className="text-[var(--color-accent-amber)] ml-1">
                (hit page limit - there may be more)
              </span>
            )}
          </span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-2 rounded status-error">
          <AlertTriangle className="h-4 w-4 text-[var(--color-accent-red)]" />
          <span className="text-sm text-[var(--color-accent-red)]">
            {error}
          </span>
        </div>
      )}

      {/* Current Path Display */}
      {selectedBucket && (
        <p className="text-xs text-[var(--color-text-muted)] font-mono break-all">
          Path: {getCurrentPath()}
        </p>
      )}
    </div>
  );
}
