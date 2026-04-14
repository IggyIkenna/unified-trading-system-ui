"use client";

import { useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronRight, Search } from "lucide-react";
import openapi from "@/lib/registry/openapi.json";

/* ---------- types ---------- */
type Method = "get" | "post" | "put" | "delete" | "patch";
interface PathOp {
  path: string;
  method: Method;
  summary: string;
  tags: string[];
  parameters: number;
  responseSchema: string;
  detail: Record<string, unknown>;
}
interface SchemaDef {
  name: string;
  type: string;
  properties: Record<string, Record<string, unknown>>;
  required: string[];
  description: string;
}

const METHOD_COLORS: Record<string, string> = {
  get: "bg-emerald-600",
  post: "bg-blue-600",
  put: "bg-amber-600",
  delete: "bg-red-600",
  patch: "bg-purple-600",
};

const DEFI_PREFIXES = ["Aave", "Morpho", "Uniswap", "Canonical", "Execution", "DeFi", "Flash"];

function resolveRef(ref: string): string {
  return ref.replace("#/components/schemas/", "");
}

function getResponseSchema(op: Record<string, unknown>): string {
  const responses = op.responses as Record<string, Record<string, unknown>> | undefined;
  if (!responses) return "-";
  const ok = responses["200"] ?? responses["201"];
  if (!ok) return "-";
  const content = ok.content as Record<string, Record<string, unknown>> | undefined;
  const json = content?.["application/json"];
  if (!json) return "-";
  const schema = json.schema as Record<string, unknown> | undefined;
  if (!schema) return "-";
  if (schema.$ref) return resolveRef(schema.$ref as string);
  if (schema.items && (schema.items as Record<string, unknown>).$ref)
    return resolveRef((schema.items as Record<string, unknown>).$ref as string) + "[]";
  return (schema.type as string) ?? "-";
}

/* ---------- data parsing ---------- */
function parseEndpoints(): PathOp[] {
  const ops: PathOp[] = [];
  const paths = (openapi as Record<string, unknown>).paths as Record<string, Record<string, Record<string, unknown>>>;
  for (const [path, methods] of Object.entries(paths)) {
    for (const [method, detail] of Object.entries(methods)) {
      if (["get", "post", "put", "delete", "patch"].includes(method)) {
        ops.push({
          path,
          method: method as Method,
          summary: (detail.summary as string) ?? "",
          tags: (detail.tags as string[]) ?? [],
          parameters: ((detail.parameters as unknown[]) ?? []).length,
          responseSchema: getResponseSchema(detail),
          detail,
        });
      }
    }
  }
  return ops;
}

function parseSchemas(): SchemaDef[] {
  const schemas = (openapi as Record<string, unknown>).components as Record<string, Record<string, Record<string, unknown>>>;
  const defs = schemas?.schemas ?? {};
  return Object.entries(defs).map(([name, s]) => ({
    name,
    type: (s.type as string) ?? (s.allOf ? "allOf" : s.oneOf ? "oneOf" : "unknown"),
    properties: (s.properties as Record<string, Record<string, unknown>>) ?? {},
    required: (s.required as string[]) ?? [],
    description: (s.description as string) ?? "",
  }));
}

/* ---------- sub-components ---------- */
function PropertyRow({ name, prop, isRequired }: { name: string; prop: Record<string, unknown>; isRequired: boolean }) {
  const typeStr = prop.$ref
    ? resolveRef(prop.$ref as string)
    : prop.items && (prop.items as Record<string, unknown>).$ref
      ? resolveRef((prop.items as Record<string, unknown>).$ref as string) + "[]"
      : (prop.type as string) ?? "unknown";
  return (
    <div className="flex items-baseline gap-2 py-0.5 font-mono text-xs">
      <span className="text-zinc-300 min-w-[160px] shrink-0">{name}</span>
      <span className="text-blue-400">{typeStr}</span>
      {isRequired && <Badge variant="outline" className="text-[9px] px-1 py-0 border-amber-500 text-amber-400">req</Badge>}
      {prop.description != null ? <span className="text-zinc-500 truncate">{String(prop.description)}</span> : null}
    </div>
  );
}

function EndpointRow({ op }: { op: PathOp }) {
  const [open, setOpen] = useState(false);
  const reqBody = op.detail.requestBody as Record<string, unknown> | undefined;
  const reqSchema = reqBody
    ? (() => {
        const content = reqBody.content as Record<string, Record<string, unknown>> | undefined;
        const json = content?.["application/json"];
        const s = json?.schema as Record<string, unknown> | undefined;
        return s?.$ref ? resolveRef(s.$ref as string) : null;
      })()
    : null;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="w-full flex items-center gap-2 py-1.5 px-2 hover:bg-zinc-800/50 rounded text-left">
        <ChevronRight className={`h-3 w-3 shrink-0 transition-transform ${open ? "rotate-90" : ""}`} />
        <Badge className={`${METHOD_COLORS[op.method]} text-[10px] px-1.5 py-0 uppercase font-bold min-w-[44px] justify-center`}>
          {op.method}
        </Badge>
        <span className="font-mono text-xs text-zinc-200 truncate">{op.path}</span>
        <span className="text-zinc-500 text-xs truncate ml-auto">{op.summary}</span>
        {op.parameters > 0 && <Badge variant="outline" className="text-[9px] px-1 py-0">{op.parameters}p</Badge>}
      </CollapsibleTrigger>
      <CollapsibleContent className="pl-8 pr-2 pb-2 text-xs space-y-1">
        <div className="flex gap-4 text-zinc-400">
          <span>Tags: {op.tags.join(", ") || "-"}</span>
          <span>Response: <span className="text-blue-400">{op.responseSchema}</span></span>
          {reqSchema && <span>Body: <span className="text-amber-400">{reqSchema}</span></span>}
        </div>
        {op.detail.parameters != null && (
          <div className="mt-1">
            <span className="text-zinc-500">Parameters:</span>
            {(op.detail.parameters as Array<Record<string, unknown>>).map((p, i) => (
              <span key={i} className="ml-2 text-zinc-300">
                {String(p.name)}<span className="text-zinc-600">({String(p.in)})</span>
              </span>
            ))}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

function SchemaRow({ schema }: { schema: SchemaDef }) {
  const [open, setOpen] = useState(false);
  const propEntries = Object.entries(schema.properties);
  const isDefi = DEFI_PREFIXES.some((p) => schema.name.startsWith(p));

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="w-full flex items-center gap-2 py-1.5 px-2 hover:bg-zinc-800/50 rounded text-left">
        <ChevronRight className={`h-3 w-3 shrink-0 transition-transform ${open ? "rotate-90" : ""}`} />
        <span className={`font-mono text-xs ${isDefi ? "text-emerald-400" : "text-zinc-200"}`}>{schema.name}</span>
        {isDefi && <Badge className="bg-emerald-900 text-emerald-300 text-[9px] px-1 py-0">DeFi</Badge>}
        <span className="text-zinc-500 text-xs ml-auto">{schema.type}</span>
        <Badge variant="outline" className="text-[9px] px-1 py-0">{propEntries.length} props</Badge>
        {schema.required.length > 0 && (
          <Badge variant="outline" className="text-[9px] px-1 py-0 border-amber-500 text-amber-400">
            {schema.required.length} req
          </Badge>
        )}
      </CollapsibleTrigger>
      <CollapsibleContent className="pl-8 pr-2 pb-2">
        {schema.description && <p className="text-xs text-zinc-500 mb-1">{schema.description}</p>}
        {propEntries.map(([name, prop]) => (
          <PropertyRow key={name} name={name} prop={prop} isRequired={schema.required.includes(name)} />
        ))}
        {propEntries.length === 0 && <span className="text-xs text-zinc-600">No properties defined</span>}
      </CollapsibleContent>
    </Collapsible>
  );
}

/* ---------- main page ---------- */
export default function SchemasPage() {
  const [tab, setTab] = useState("endpoints");
  const [search, setSearch] = useState("");

  const endpoints = useMemo(() => parseEndpoints(), []);
  const schemas = useMemo(() => parseSchemas(), []);

  const grouped = useMemo(() => {
    const q = search.toLowerCase();
    const filtered = endpoints.filter((e) => e.path.toLowerCase().includes(q) || e.summary.toLowerCase().includes(q));
    const groups: Record<string, PathOp[]> = {};
    for (const ep of filtered) {
      const tag = ep.tags[0] ?? "untagged";
      (groups[tag] ??= []).push(ep);
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [endpoints, search]);

  const filteredSchemas = useMemo(() => {
    const q = search.toLowerCase();
    return schemas.filter((s) => s.name.toLowerCase().includes(q));
  }, [schemas, search]);

  return (
    <div className="p-4 space-y-4 max-w-[1400px]">
      <div>
        <h1 className="text-lg font-semibold text-zinc-100">OpenAPI Schema Browser</h1>
        <p className="text-xs text-zinc-500">{endpoints.length} endpoints, {schemas.length} schemas</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <div className="flex items-center gap-3">
          <TabsList>
            <TabsTrigger value="endpoints">Endpoints ({endpoints.length})</TabsTrigger>
            <TabsTrigger value="schemas">Schemas ({schemas.length})</TabsTrigger>
          </TabsList>
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
            <Input
              placeholder={tab === "endpoints" ? "Filter by path..." : "Filter by schema name..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-7 h-8 text-xs"
            />
          </div>
        </div>

        <TabsContent value="endpoints" className="mt-3 space-y-3">
          {grouped.map(([tag, ops]) => (
            <Collapsible key={tag} defaultOpen>
              <CollapsibleTrigger className="flex items-center gap-2 py-1 px-1 hover:bg-zinc-800/30 rounded w-full text-left">
                <ChevronRight className="h-3.5 w-3.5 text-zinc-400" />
                <span className="text-sm font-medium text-zinc-300">{tag}</span>
                <Badge variant="outline" className="text-[9px] px-1 py-0">{ops.length}</Badge>
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-2 border-l border-zinc-800 ml-2 mt-1">
                {ops.map((op) => (
                  <EndpointRow key={`${op.method}-${op.path}`} op={op} />
                ))}
              </CollapsibleContent>
            </Collapsible>
          ))}
          {grouped.length === 0 && <p className="text-xs text-zinc-500 py-4">No endpoints match filter.</p>}
        </TabsContent>

        <TabsContent value="schemas" className="mt-3 space-y-0.5">
          {filteredSchemas.map((s) => (
            <SchemaRow key={s.name} schema={s} />
          ))}
          {filteredSchemas.length === 0 && <p className="text-xs text-zinc-500 py-4">No schemas match filter.</p>}
        </TabsContent>
      </Tabs>
    </div>
  );
}
