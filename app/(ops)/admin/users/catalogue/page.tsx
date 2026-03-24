"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  ChevronRight,
  ChevronDown,
  Database,
  FlaskConical,
  Zap,
  FileText,
  Shield,
  Building2,
  Lock,
} from "lucide-react";
import {
  usePermissionCatalogue,
  useSearchPermissions,
} from "@/hooks/api/use-user-management";
import type { PermissionDomain } from "@/lib/types/user-management";

const DOMAIN_ICONS: Record<string, React.ReactNode> = {
  platform: <Shield className="h-4 w-4" />,
  data: <Database className="h-4 w-4" />,
  research: <FlaskConical className="h-4 w-4" />,
  execution: <Zap className="h-4 w-4" />,
  reporting: <FileText className="h-4 w-4" />,
  "internal-services": <Lock className="h-4 w-4" />,
  "org-scoping": <Building2 className="h-4 w-4" />,
};

export default function CataloguePage() {
  const { data, isLoading } = usePermissionCatalogue();
  const [search, setSearch] = React.useState("");
  const [expandedDomains, setExpandedDomains] = React.useState<Set<string>>(
    new Set(),
  );
  const [expandedCategories, setExpandedCategories] = React.useState<
    Set<string>
  >(new Set());
  const searchResults = useSearchPermissions(search);

  const toggleDomain = (key: string) => {
    setExpandedDomains((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleCategory = (key: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const expandAll = () => {
    const domains = new Set((data?.domains ?? []).map((d) => d.key));
    const cats = new Set(
      (data?.domains ?? []).flatMap((d) =>
        d.categories.map((c) => `${d.key}:${c.key}`),
      ),
    );
    setExpandedDomains(domains);
    setExpandedCategories(cats);
  };

  const collapseAll = () => {
    setExpandedDomains(new Set());
    setExpandedCategories(new Set());
  };

  // Count total permissions
  const totalPerms = (data?.domains ?? []).reduce(
    (sum, d) =>
      sum + d.categories.reduce((s, c) => s + c.permissions.length, 0),
    0,
  );

  return (
    <div className="px-6 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Permission Catalogue</h1>
          <p className="text-sm text-muted-foreground">
            {data?.domains?.length ?? 0} domains, {totalPerms} permissions
            available
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={expandAll}>
            Expand All
          </Button>
          <Button variant="outline" size="sm" onClick={collapseAll}>
            Collapse All
          </Button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search permissions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-9 text-sm"
        />
      </div>

      {/* Search results */}
      {search.length >= 2 && searchResults.data && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Search Results ({searchResults.data.total})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {searchResults.data.results.map((r) => (
              <div
                key={`${r.domain}:${r.category}:${r.key}`}
                className="flex items-center gap-2 py-1.5 text-sm"
              >
                <Badge variant="outline" className="text-xs">
                  {r.domain_label}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {r.category_label}
                </Badge>
                <span className="font-medium">{r.label}</span>
                <span className="text-muted-foreground text-xs">
                  {r.description}
                </span>
                {r.internal_only === "True" && (
                  <Lock className="h-3 w-3 text-muted-foreground" />
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Domain tree */}
      {isLoading ? (
        <div className="text-muted-foreground text-sm">
          Loading catalogue...
        </div>
      ) : (
        <div className="space-y-2">
          {(data?.domains ?? []).map((domain) => (
            <DomainSection
              key={domain.key}
              domain={domain}
              isExpanded={expandedDomains.has(domain.key)}
              expandedCategories={expandedCategories}
              onToggleDomain={() => toggleDomain(domain.key)}
              onToggleCategory={(catKey) =>
                toggleCategory(`${domain.key}:${catKey}`)
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DomainSection({
  domain,
  isExpanded,
  expandedCategories,
  onToggleDomain,
  onToggleCategory,
}: {
  domain: PermissionDomain;
  isExpanded: boolean;
  expandedCategories: Set<string>;
  onToggleDomain: () => void;
  onToggleCategory: (catKey: string) => void;
}) {
  const totalPerms = domain.categories.reduce(
    (s, c) => s + c.permissions.length,
    0,
  );

  return (
    <Card>
      <button
        onClick={onToggleDomain}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
          {DOMAIN_ICONS[domain.key] ?? <Shield className="h-4 w-4" />}
          <div className="text-left">
            <div className="font-medium text-sm">{domain.label}</div>
            <div className="text-xs text-muted-foreground">
              {domain.description}
            </div>
          </div>
        </div>
        <Badge variant="secondary" className="text-xs">
          {domain.categories.length} categories, {totalPerms} permissions
        </Badge>
      </button>

      {isExpanded && (
        <CardContent className="pt-0 pb-3 space-y-1">
          {domain.categories.map((cat) => {
            const catKey = `${domain.key}:${cat.key}`;
            const isCatExpanded = expandedCategories.has(catKey);
            return (
              <div key={cat.key} className="ml-6">
                <button
                  onClick={() => onToggleCategory(cat.key)}
                  className="w-full flex items-center gap-2 py-1.5 text-sm hover:bg-muted/30 rounded px-2 transition-colors"
                >
                  {isCatExpanded ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                  <span className="font-medium">{cat.label}</span>
                  <span className="text-xs text-muted-foreground">
                    ({cat.permissions.length})
                  </span>
                </button>
                {isCatExpanded && (
                  <div className="ml-5 space-y-0.5 pb-1">
                    {cat.permissions.map((perm) => (
                      <div
                        key={perm.key}
                        className="flex items-center gap-2 py-1 px-2 text-xs rounded hover:bg-muted/20"
                      >
                        <code className="text-muted-foreground font-mono">
                          {perm.key}
                        </code>
                        <span>{perm.label}</span>
                        {perm.description && (
                          <span className="text-muted-foreground">
                            -- {perm.description}
                          </span>
                        )}
                        {perm.internal_only && (
                          <Lock className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      )}
    </Card>
  );
}
