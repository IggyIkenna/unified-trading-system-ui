import { instrumentsForSlot } from "@/lib/architecture-v2/envelope-loader";

/**
 * Resolves concrete instrument symbols for each assigned strategy slot on a persona.
 * Used by demo / mock flows and unit tests (envelope-loader is mocked there).
 */
export async function derivePersonaInstruments(persona: {
  id: string;
  assigned_strategies?: readonly string[] | undefined;
}): Promise<string[]> {
  const slots = persona.assigned_strategies;
  if (!slots?.length) return [];

  const seen = new Set<string>();
  const out: string[] = [];

  for (const slot of slots) {
    if (typeof slot !== "string" || slot.length === 0) continue;
    try {
      const insts = await instrumentsForSlot(slot);
      for (const x of insts) {
        if (typeof x === "string" && x.length > 0 && !seen.has(x)) {
          seen.add(x);
          out.push(x);
        }
      }
    } catch (e) {
      console.warn(`derivePersonaInstruments: instrumentsForSlot failed for ${slot}`, e);
    }
  }

  return out;
}
