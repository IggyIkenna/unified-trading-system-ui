/**
 * Strategy Config Schema — type definitions for schema-driven form rendering.
 *
 * Each strategy declares its configurable fields as data. The generic
 * SchemaForm renderer turns these declarations into the correct UI controls
 * (NumberField, DropdownField, CheckboxGroup, Switch) without any
 * per-strategy component code.
 *
 * To add a new strategy: add a schema entry in defi.ts or cefi.ts.
 * To add a new field to an existing strategy: append a FieldSchema.
 * No widget file changes required.
 */

// ---------------------------------------------------------------------------
// Field schema — one entry per configurable parameter
// ---------------------------------------------------------------------------

export interface NumberFieldSchema {
  key: string;
  label: string;
  type: "number";
  default: number;
  suffix?: string;
  step?: number;
}

export interface DropdownFieldSchema {
  key: string;
  label: string;
  type: "dropdown";
  default: string;
  options: string[];
}

export interface BooleanFieldSchema {
  key: string;
  label: string;
  type: "boolean";
  default: boolean;
}

export interface MultiSelectFieldSchema {
  key: string;
  label: string;
  type: "multi-select";
  default: string[];
  options: string[];
}

export type ConfigFieldSchema = NumberFieldSchema | DropdownFieldSchema | BooleanFieldSchema | MultiSelectFieldSchema;

// ---------------------------------------------------------------------------
// Strategy config schema — fields + default values for one strategy
// ---------------------------------------------------------------------------

export interface StrategyConfigSchema {
  fields: ConfigFieldSchema[];
}

// ---------------------------------------------------------------------------
// Strategy family grouping (for grouped Select dropdowns)
// ---------------------------------------------------------------------------

export interface StrategyFamilyGroup<TId extends string = string> {
  label: string;
  strategies: { id: TId; name: string }[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a default config Record from a schema's field defaults. */
export function buildDefaults(schema: StrategyConfigSchema): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of schema.fields) {
    out[f.key] = f.type === "multi-select" ? [...f.default] : f.default;
  }
  return out;
}
