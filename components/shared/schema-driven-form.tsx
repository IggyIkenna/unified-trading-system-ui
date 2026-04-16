"use client";

import { Switch } from "@/components/ui/switch";
import type { ConfigFieldSchema, StrategyConfigSchema } from "@/lib/config/strategy-config-schemas";
import { CheckboxGroup, DropdownField, NumberField } from "./form-fields";

/**
 * Schema-driven form renderer.
 *
 * Given a StrategyConfigSchema and the current config values, renders
 * the appropriate field component for each declared field. Fully generic —
 * no per-strategy code required.
 */
export function SchemaForm({
  schema,
  values,
  onChange,
}: {
  schema: StrategyConfigSchema;
  values: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
}) {
  function set(key: string, value: unknown) {
    onChange({ ...values, [key]: value });
  }

  return (
    <div className="space-y-3">
      {schema.fields.map((field) => (
        <SchemaField key={field.key} field={field} value={values[field.key]} onValue={(v) => set(field.key, v)} />
      ))}
    </div>
  );
}

function SchemaField({
  field,
  value,
  onValue,
}: {
  field: ConfigFieldSchema;
  value: unknown;
  onValue: (v: unknown) => void;
}) {
  switch (field.type) {
    case "number":
      return (
        <NumberField
          label={field.label}
          value={typeof value === "number" ? value : field.default}
          onChange={(v) => onValue(v)}
          suffix={field.suffix}
          step={field.step}
        />
      );

    case "dropdown":
      return (
        <DropdownField
          label={field.label}
          value={typeof value === "string" ? value : field.default}
          options={field.options}
          onChange={(v) => onValue(v)}
        />
      );

    case "boolean":
      return (
        <div className="flex items-center justify-between">
          <label className="text-xs text-muted-foreground">{field.label}</label>
          <Switch checked={typeof value === "boolean" ? value : field.default} onCheckedChange={(v) => onValue(v)} />
        </div>
      );

    case "multi-select":
      return (
        <CheckboxGroup
          label={field.label}
          options={field.options}
          selected={Array.isArray(value) ? (value as string[]) : field.default}
          onChange={(v) => onValue(v)}
        />
      );
  }
}
