/**
 * Direction-arrow diagram for the two signal-flow routes.
 *
 * Both diagrams emphasise rule-03's same-system claim — the signal arrow
 * direction is the ONLY thing that differs between Signals-In (client →
 * Odum execution) and Signals-Out / signal-leasing (Odum strategy →
 * counterparty execution on their own infrastructure). Neither diagram
 * implies custody transfer or venue sharing.
 *
 * Inline SVG only — no d3, no react-flow, no mermaid. Dark-mode-friendly
 * via semantic Tailwind tokens; `currentColor` inside SVG inherits the
 * text colour so dark/light swap just works.
 */

type Direction = "in" | "out";

interface SignalFlowDiagramProps {
  readonly direction: Direction;
  readonly className?: string;
}

const TITLES: Readonly<Record<Direction, string>> = {
  in: "DART Signals-In — client signal to Odum execution",
  out: "Odum Signals-Out — Odum strategy to counterparty execution",
};

const DESCRIPTIONS: Readonly<Record<Direction, string>> = {
  in:
    "Signals flow one way: client strategy generates the instruction, Odum routes it to the venue on the client's scoped API keys. Fill confirmations, reconciliation artefacts, and allocator reporting flow back to the client. No capital moves; venue custody stays with the client.",
  out:
    "Signals flow one way: Odum strategy emits STRATEGY_SIGNAL_EMITTED_EXTERNAL to a counterparty webhook. The counterparty executes on its own infrastructure with its own venue keys. STRATEGY_SIGNAL_ACKNOWLEDGED flows back; no fill data, no positions, no capital crosses the boundary.",
};

interface BoxProps {
  x: number;
  y: number;
  width: number;
  height: number;
  title: string;
  subtitle?: string;
  accent: "client" | "odum" | "venue" | "counterparty";
}

const ACCENT_FILL: Readonly<Record<BoxProps["accent"], string>> = {
  client: "fill-blue-500/10 stroke-blue-500/60",
  odum: "fill-violet-500/10 stroke-violet-500/60",
  venue: "fill-emerald-500/10 stroke-emerald-500/60",
  counterparty: "fill-amber-500/10 stroke-amber-500/60",
};

function Box({ x, y, width, height, title, subtitle, accent }: BoxProps) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={8}
        ry={8}
        strokeWidth={1.5}
        className={ACCENT_FILL[accent]}
      />
      <text
        x={x + width / 2}
        y={y + (subtitle ? height / 2 - 4 : height / 2 + 4)}
        textAnchor="middle"
        className="fill-foreground text-[13px] font-semibold"
      >
        {title}
      </text>
      {subtitle && (
        <text
          x={x + width / 2}
          y={y + height / 2 + 12}
          textAnchor="middle"
          className="fill-muted-foreground text-[10px]"
        >
          {subtitle}
        </text>
      )}
    </g>
  );
}

interface ArrowProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  label: string;
  sublabel?: string;
  direction?: "forward" | "back";
  className?: string;
}

function Arrow({
  x1,
  y1,
  x2,
  y2,
  label,
  sublabel,
  direction = "forward",
  className = "stroke-foreground/70",
}: ArrowProps) {
  const markerId = direction === "back" ? "arrow-back" : "arrow-fwd";
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  return (
    <g>
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        strokeWidth={1.5}
        markerEnd={`url(#${markerId})`}
        className={className}
      />
      <text
        x={midX}
        y={midY - 6}
        textAnchor="middle"
        className="fill-foreground/80 text-[11px] font-medium"
      >
        {label}
      </text>
      {sublabel && (
        <text
          x={midX}
          y={midY + 8}
          textAnchor="middle"
          className="fill-muted-foreground text-[9px]"
        >
          {sublabel}
        </text>
      )}
    </g>
  );
}

function ArrowMarkers() {
  return (
    <defs>
      <marker
        id="arrow-fwd"
        viewBox="0 0 10 10"
        refX="9"
        refY="5"
        markerWidth="8"
        markerHeight="8"
        orient="auto-start-reverse"
      >
        <path d="M 0 0 L 10 5 L 0 10 z" className="fill-foreground/70" />
      </marker>
      <marker
        id="arrow-back"
        viewBox="0 0 10 10"
        refX="9"
        refY="5"
        markerWidth="8"
        markerHeight="8"
        orient="auto-start-reverse"
      >
        <path d="M 0 0 L 10 5 L 0 10 z" className="fill-muted-foreground/60" />
      </marker>
    </defs>
  );
}

function SignalsInDiagram() {
  // Layout: Client (left) → Odum Execution (centre) → Venue (right)
  // Return arrow: Venue/Odum → Client (reconciliation + reporting)
  const WIDTH = 1000;
  const HEIGHT = 320;
  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label={TITLES.in}
      className="w-full h-auto"
      preserveAspectRatio="xMidYMid meet"
    >
      <title>{TITLES.in}</title>
      <desc>{DESCRIPTIONS.in}</desc>
      <ArrowMarkers />

      {/* Boxes */}
      <Box
        x={20}
        y={110}
        width={180}
        height={90}
        title="Client strategy"
        subtitle="your upstream signal generator"
        accent="client"
      />
      <Box
        x={410}
        y={110}
        width={200}
        height={90}
        title="Odum execution"
        subtitle="algo, risk, positions, reporting"
        accent="odum"
      />
      <Box
        x={800}
        y={110}
        width={180}
        height={90}
        title="Venue account"
        subtitle="segregated sub-account or your own"
        accent="venue"
      />

      {/* Forward arrow: Client → Odum */}
      <Arrow
        x1={200}
        y1={140}
        x2={410}
        y2={140}
        label="instruction"
        sublabel="eight-field schema"
      />
      {/* Forward arrow: Odum → Venue */}
      <Arrow
        x1={610}
        y1={140}
        x2={800}
        y2={140}
        label="order"
        sublabel="routed, not reshaped"
      />

      {/* Return arrow: Venue → Odum */}
      <Arrow
        x1={800}
        y1={180}
        x2={610}
        y2={180}
        label="fills"
        className="stroke-muted-foreground/60"
      />
      {/* Return arrow: Odum → Client */}
      <Arrow
        x1={410}
        y1={180}
        x2={200}
        y2={180}
        label="reconciliation + reporting"
        sublabel="positions, P&L, audit"
        className="stroke-muted-foreground/60"
      />

      {/* Custody note */}
      <text
        x={WIDTH / 2}
        y={260}
        textAnchor="middle"
        className="fill-muted-foreground text-[11px]"
      >
        Default: segregated sub-account at Odum&apos;s venue accounts, held in your name via the exchange sub-account primitive — skips multi-week exchange onboarding. Opt-out: your own venue or prime-broker account.
      </text>
      <text
        x={WIDTH / 2}
        y={282}
        textAnchor="middle"
        className="fill-muted-foreground text-[11px]"
      >
        Either way, scoped execute + read API keys only, no withdrawal authority, Odum Research Ltd never holds principal. Your strategic edge never crosses into Odum&apos;s systems.
      </text>
    </svg>
  );
}

function SignalsOutDiagram() {
  // Layout: Odum Strategy (left) → Counterparty Webhook (centre) → Counterparty Execution (right)
  // Return arrow: ack only
  const WIDTH = 1040;
  const HEIGHT = 320;
  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label={TITLES.out}
      className="w-full h-auto"
      preserveAspectRatio="xMidYMid meet"
    >
      <title>{TITLES.out}</title>
      <desc>{DESCRIPTIONS.out}</desc>
      <ArrowMarkers />

      <Box
        x={20}
        y={110}
        width={180}
        height={90}
        title="Odum strategy"
        subtitle="strategy-service emission"
        accent="odum"
      />
      <Box
        x={420}
        y={110}
        width={200}
        height={90}
        title="Counterparty webhook"
        subtitle="HMAC-signed, at-least-once"
        accent="counterparty"
      />
      <Box
        x={830}
        y={110}
        width={190}
        height={90}
        title="Counterparty execution"
        subtitle="their infrastructure + venues"
        accent="counterparty"
      />

      {/* Forward: Odum → Counterparty Webhook */}
      <Arrow
        x1={200}
        y1={140}
        x2={420}
        y2={140}
        label="SIGNAL_EMITTED_EXTERNAL"
        sublabel="D8 payload, signed"
      />
      {/* Forward: Webhook → Counterparty Execution */}
      <Arrow
        x1={620}
        y1={140}
        x2={830}
        y2={140}
        label="payload delivered"
        sublabel="counterparty acts"
      />

      {/* Return: ack only */}
      <Arrow
        x1={420}
        y1={180}
        x2={200}
        y2={180}
        label="SIGNAL_ACKNOWLEDGED"
        sublabel="idempotency ack, no fills"
        className="stroke-muted-foreground/60"
      />

      {/* Fence note */}
      <text
        x={WIDTH / 2}
        y={260}
        textAnchor="middle"
        className="fill-muted-foreground text-[11px]"
      >
        Odum does NOT see counterparty fills, positions, or venue identities — delivery boundary is the signal itself.
      </text>
      <text
        x={WIDTH / 2}
        y={282}
        textAnchor="middle"
        className="fill-muted-foreground text-[11px]"
      >
        No capital flows; no venue API keys leave the counterparty&apos;s side; no raw data, features, or model internals cross the fence.
      </text>
    </svg>
  );
}

export function SignalFlowDiagram({ direction, className }: SignalFlowDiagramProps) {
  return (
    <div
      data-testid={`signal-flow-diagram-${direction}`}
      role="figure"
      aria-label={TITLES[direction]}
      className={className}
    >
      {direction === "in" ? <SignalsInDiagram /> : <SignalsOutDiagram />}
    </div>
  );
}
