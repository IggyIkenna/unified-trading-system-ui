"use client";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Check, Minus, Search } from "lucide-react";
import configRegistry from "@/lib/registry/config-registry.json";

const DEFI_KEYWORDS = ["defi", "chain", "venue", "protocol", "flash", "lending", "aave"];

interface ConfigField { type: string; default: string | number | boolean | null; required: boolean }
interface ConfigClass { class_name: string; module: string; bases: string[]; field_count: number; fields: Record<string, ConfigField> }
type ConfigsByRepo = Record<string, ConfigClass[]>;

function isDefiField(name: string): boolean {
  const lower = name.toLowerCase();
  return DEFI_KEYWORDS.some((kw) => lower.includes(kw));
}

function formatDefault(val: string | number | boolean | null): string {
  if (val === null || val === undefined) return "None";
  if (typeof val === "boolean") return val ? "True" : "False";
  if (typeof val === "string" && val.length > 40) return val.slice(0, 37) + "...";
  return String(val);
}

function formatType(raw: string): string {
  return raw.replace(/<class '([^']+)'>/g, "$1");
}

export default function ServiceConfigPanel() {
  const configsByRepo = (configRegistry as unknown as { configs_by_repo: ConfigsByRepo }).configs_by_repo;
  const repos = Object.keys(configsByRepo).sort();

  const [selectedRepo, setSelectedRepo] = React.useState(repos[0] ?? "");
  const [search, setSearch] = React.useState("");
  const [openSections, setOpenSections] = React.useState<Record<string, boolean>>({});

  const toggle = (key: string) =>
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

  const configs = configsByRepo[selectedRepo] ?? [];
  const totalFields = configs.reduce((s, c) => s + c.field_count, 0);

  const filterFields = (fields: Record<string, ConfigField>) => {
    if (!search) return Object.entries(fields);
    const q = search.toLowerCase();
    return Object.entries(fields).filter(([name]) => name.toLowerCase().includes(q));
  };

  return (
    <div className="flex gap-4 h-[calc(100vh-280px)]">
      {/* Left sidebar */}
      <Card className="w-[240px] shrink-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Repos ({repos.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-370px)]">
            <div className="px-2 pb-2 space-y-0.5">
              {repos.map((repo) => {
                const count = configsByRepo[repo].reduce((s, c) => s + c.field_count, 0);
                return (
                  <button
                    key={repo}
                    onClick={() => setSelectedRepo(repo)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                      selectedRepo === repo
                        ? "bg-primary/10 text-primary font-medium"
                        : "hover:bg-muted/50 text-muted-foreground"
                    }`}
                  >
                    <span className="block truncate">{repo}</span>
                    <span className="text-xs opacity-60">{count} fields</span>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Main area */}
      <div className="flex-1 space-y-4 overflow-hidden">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">{selectedRepo}</h3>
            <p className="text-xs text-muted-foreground">
              {configs.length} config class{configs.length !== 1 ? "es" : ""} / {totalFields} total fields
            </p>
          </div>
          <div className="relative w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Filter fields..."
              className="pl-9 h-8 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-350px)]">
          <div className="space-y-3 pr-4">
            {configs.map((cfg) => {
              const key = `${selectedRepo}::${cfg.class_name}`;
              const isOpen = openSections[key] ?? configs.length === 1;
              const filtered = filterFields(cfg.fields);

              return (
                <Collapsible key={key} open={isOpen} onOpenChange={() => toggle(key)}>
                  <Card>
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors py-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {isOpen ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                            <CardTitle className="text-sm font-mono">{cfg.class_name}</CardTitle>
                            <Badge variant="outline" className="text-xs">
                              {cfg.field_count} fields
                            </Badge>
                          </div>
                          <span className="text-xs text-muted-foreground truncate max-w-[300px]">{cfg.module}</span>
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0 pb-3">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[240px]">Field Name</TableHead>
                              <TableHead className="w-[200px]">Type</TableHead>
                              <TableHead className="w-[200px]">Default</TableHead>
                              <TableHead className="w-[80px] text-center">Required</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filtered.map(([name, field]) => (
                              <TableRow
                                key={name}
                                className={isDefiField(name) ? "bg-amber-500/5" : undefined}
                              >
                                <TableCell className="font-mono text-xs">
                                  {name}
                                  {isDefiField(name) && (
                                    <Badge variant="outline" className="ml-2 text-[10px] text-amber-600 border-amber-400">
                                      DeFi
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground font-mono">
                                  {formatType(field.type)}
                                </TableCell>
                                <TableCell className="text-xs font-mono truncate max-w-[200px]">
                                  {formatDefault(field.default)}
                                </TableCell>
                                <TableCell className="text-center">
                                  {field.required ? (
                                    <Check className="size-4 text-primary mx-auto" />
                                  ) : (
                                    <Minus className="size-3 text-muted-foreground mx-auto" />
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                            {filtered.length === 0 && (
                              <TableRow>
                                <TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-6">
                                  No fields match filter
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
