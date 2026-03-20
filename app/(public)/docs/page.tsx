"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import {
  Database,
  LineChart,
  Zap,
  Search,
  Book,
  Code,
  Terminal,
  FileJson,
  ArrowRight,
  Copy,
  Check,
  ExternalLink,
} from "lucide-react"

// API Endpoints organized by service
const apiEndpoints = {
  data: {
    name: "Data API",
    baseUrl: "https://api.odum.io/v1/data",
    description: "Access market data across 128 venues and 5 asset classes",
    endpoints: [
      {
        method: "GET",
        path: "/markets",
        description: "List all available markets and instruments",
        params: ["asset_class", "venue", "instrument_type"],
      },
      {
        method: "GET",
        path: "/orderbook/{venue}/{symbol}",
        description: "Real-time L2 orderbook snapshot",
        params: ["depth", "aggregation"],
      },
      {
        method: "GET",
        path: "/trades/{venue}/{symbol}",
        description: "Historical trade data with microsecond precision",
        params: ["start", "end", "limit"],
      },
      {
        method: "GET",
        path: "/candles/{venue}/{symbol}",
        description: "OHLCV candles at various resolutions",
        params: ["interval", "start", "end"],
      },
      {
        method: "WS",
        path: "/stream",
        description: "WebSocket streaming for real-time data",
        params: ["channels", "symbols"],
      },
      {
        method: "GET",
        path: "/signals/ml/{model_id}",
        description: "ML-derived trading signals",
        params: ["symbols", "lookback"],
      },
    ],
  },
  backtesting: {
    name: "Backtesting API",
    baseUrl: "https://api.odum.io/v1/backtest",
    description: "Run strategy simulations across multiple asset classes",
    endpoints: [
      {
        method: "POST",
        path: "/jobs",
        description: "Submit a new backtest job",
        params: ["strategy_config", "date_range", "initial_capital"],
      },
      {
        method: "GET",
        path: "/jobs/{job_id}",
        description: "Get backtest job status and results",
        params: ["include_trades", "include_metrics"],
      },
      {
        method: "GET",
        path: "/jobs/{job_id}/trades",
        description: "Download full trade records",
        params: ["format", "page", "limit"],
      },
      {
        method: "GET",
        path: "/jobs/{job_id}/equity",
        description: "Get equity curve data",
        params: ["resolution"],
      },
      {
        method: "POST",
        path: "/optimize",
        description: "Run parameter optimization",
        params: ["strategy_config", "param_grid", "objective"],
      },
      {
        method: "GET",
        path: "/strategies",
        description: "List available strategy templates",
        params: ["asset_class", "strategy_type"],
      },
    ],
  },
  execution: {
    name: "Execution API",
    baseUrl: "https://api.odum.io/v1/execution",
    description: "Institutional execution algorithms for optimal trade execution",
    endpoints: [
      {
        method: "POST",
        path: "/orders",
        description: "Submit a new execution order",
        params: ["algo", "symbol", "side", "quantity", "params"],
      },
      {
        method: "GET",
        path: "/orders/{order_id}",
        description: "Get order status and fills",
        params: ["include_fills"],
      },
      {
        method: "DELETE",
        path: "/orders/{order_id}",
        description: "Cancel an active order",
        params: [],
      },
      {
        method: "GET",
        path: "/algos",
        description: "List available execution algorithms",
        params: ["venue", "asset_class"],
      },
      {
        method: "GET",
        path: "/reports/tca/{order_id}",
        description: "Transaction cost analysis report",
        params: ["benchmark"],
      },
      {
        method: "GET",
        path: "/reports/best-execution",
        description: "Best execution report for regulatory compliance",
        params: ["date_range", "format"],
      },
    ],
  },
}

// Documentation sections
const docSections = [
  {
    id: "introduction",
    title: "Introduction",
    icon: Book,
    content: `
## Welcome to Odum Research API

The Odum Research API provides institutional-grade access to trading infrastructure across 5 asset classes: TradFi, Crypto, DeFi, Sports, and Prediction Markets.

### Key Features
- **Unified Schema**: All data normalised to a consistent format
- **6+ Years History**: Deep historical data for backtesting
- **100+ TB Data**: Comprehensive market and derived data
- **Delta One & Derivatives**: Spot, futures, perpetuals, options

### Asset Classes
- Traditional Finance (Equities, Futures, FX)
- Crypto CeFi (Spot, Perpetuals, Options)
- DeFi (AMM pools, Lending protocols)
- Sports (Pre-match odds, In-play)
- Prediction Markets (Political, Economic events)
    `
  },
  {
    id: "authentication",
    title: "Authentication",
    icon: Terminal,
    content: `
## Authentication

All API requests require authentication via API key passed in the Authorization header.

### Getting Your API Key
1. Sign up at portal.odum.io
2. Navigate to Settings > API Keys
3. Generate a new key with appropriate permissions

### Using Your Key
\`\`\`bash
curl -H "Authorization: Bearer YOUR_API_KEY" \\
  https://api.odum.io/v1/data/markets
\`\`\`

### Key Permissions
- **read:data** - Access market data endpoints
- **write:backtest** - Submit backtest jobs
- **write:orders** - Execute orders
- **admin** - Full access (for Strategy as a Service clients)

### Rate Limits
| Tier | Requests/min | WebSocket Connections |
|------|--------------|----------------------|
| Starter | 60 | 2 |
| Professional | 600 | 10 |
| Enterprise | 6000 | 100 |
    `
  },
  {
    id: "quickstart",
    title: "Quick Start",
    icon: Code,
    content: `
## Quick Start Guide

Get up and running in 5 minutes.

### 1. Install the SDK (optional)
\`\`\`bash
pip install odum-client  # Python
npm install @odum/client # JavaScript
\`\`\`

### 2. Set Your API Key
\`\`\`python
import os
os.environ["ODUM_API_KEY"] = "your_api_key"
\`\`\`

### 3. Fetch Market Data
\`\`\`python
from odum import Client

client = Client()
orderbook = client.data.orderbook("binance", "BTC-USDT")
print(orderbook.bids[:5])
\`\`\`

### 4. Run a Backtest
\`\`\`python
job = client.backtest.submit({
    "strategy": "momentum",
    "symbols": ["BTC-USDT"],
    "start": "2024-01-01",
    "end": "2024-12-31"
})
results = client.backtest.wait(job.id)
print(f"Sharpe: {results.sharpe}")
\`\`\`

### Next Steps
- Explore the [Data API](#data) for market data access
- Learn about [Backtesting](#backtesting) for strategy simulation
- Set up [Execution](#execution) for live trading
    `
  },
]

const codeExamples = {
  python: `import requests

API_KEY = "your_api_key"
BASE_URL = "https://api.odum.io/v1"

# Get orderbook data
response = requests.get(
    f"{BASE_URL}/data/orderbook/binance/BTC-USDT",
    headers={"Authorization": f"Bearer {API_KEY}"},
    params={"depth": 20}
)
orderbook = response.json()

# Submit backtest job
backtest = requests.post(
    f"{BASE_URL}/backtest/jobs",
    headers={"Authorization": f"Bearer {API_KEY}"},
    json={
        "strategy_config": {
            "type": "momentum",
            "lookback": 20,
            "threshold": 0.02
        },
        "date_range": {
            "start": "2024-01-01",
            "end": "2024-12-31"
        },
        "initial_capital": 100000
    }
)
job_id = backtest.json()["job_id"]`,
  javascript: `const API_KEY = "your_api_key";
const BASE_URL = "https://api.odum.io/v1";

// Get orderbook data
const orderbook = await fetch(
  \`\${BASE_URL}/data/orderbook/binance/BTC-USDT?depth=20\`,
  {
    headers: { Authorization: \`Bearer \${API_KEY}\` }
  }
).then(r => r.json());

// WebSocket streaming
const ws = new WebSocket(\`wss://api.odum.io/v1/data/stream\`);
ws.onopen = () => {
  ws.send(JSON.stringify({
    auth: API_KEY,
    subscribe: ["orderbook:binance:BTC-USDT", "trades:binance:ETH-USDT"]
  }));
};
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log(data);
};`,
  curl: `# Get available markets
curl -X GET "https://api.odum.io/v1/data/markets" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"

# Get orderbook
curl -X GET "https://api.odum.io/v1/data/orderbook/binance/BTC-USDT?depth=20" \\
  -H "Authorization: Bearer YOUR_API_KEY"

# Submit execution order
curl -X POST "https://api.odum.io/v1/execution/orders" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "algo": "twap",
    "symbol": "BTC-USDT",
    "venue": "binance",
    "side": "buy",
    "quantity": 1.0,
    "params": {
      "duration_minutes": 60,
      "participation_rate": 0.1
    }
  }'`,
}

// Simple markdown-to-JSX renderer
function DocContent({ content }: { content: string }) {
  const lines = content.trim().split('\n')
  const elements: React.ReactNode[] = []
  let inCodeBlock = false
  let codeLines: string[] = []
  let codeLanguage = ''
  let inTable = false
  let tableRows: string[][] = []
  let listItems: string[] = []

  const processInlineMarkdown = (text: string): React.ReactNode => {
    // Process bold, code, and links
    const parts: React.ReactNode[] = []
    let remaining = text
    let keyIdx = 0

    while (remaining.length > 0) {
      // Check for inline code
      const codeMatch = remaining.match(/^`([^`]+)`/)
      if (codeMatch) {
        parts.push(<code key={keyIdx++} className="bg-muted px-1.5 py-0.5 rounded text-sm">{codeMatch[1]}</code>)
        remaining = remaining.slice(codeMatch[0].length)
        continue
      }

      // Check for bold
      const boldMatch = remaining.match(/^\*\*([^*]+)\*\*/)
      if (boldMatch) {
        parts.push(<strong key={keyIdx++} className="text-foreground">{boldMatch[1]}</strong>)
        remaining = remaining.slice(boldMatch[0].length)
        continue
      }

      // Check for links
      const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/)
      if (linkMatch) {
        parts.push(<a key={keyIdx++} href={linkMatch[2]} className="text-primary hover:underline">{linkMatch[1]}</a>)
        remaining = remaining.slice(linkMatch[0].length)
        continue
      }

      // Regular text - find next special character
      const nextSpecial = remaining.search(/[`*\[]/)
      if (nextSpecial === -1) {
        parts.push(remaining)
        break
      } else if (nextSpecial === 0) {
        parts.push(remaining[0])
        remaining = remaining.slice(1)
      } else {
        parts.push(remaining.slice(0, nextSpecial))
        remaining = remaining.slice(nextSpecial)
      }
    }

    return parts.length === 1 ? parts[0] : parts
  }

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={elements.length} className="list-disc pl-6 mb-4 space-y-1">
          {listItems.map((item, i) => (
            <li key={i} className="text-muted-foreground">{processInlineMarkdown(item)}</li>
          ))}
        </ul>
      )
      listItems = []
    }
  }

  const flushTable = () => {
    if (tableRows.length > 0) {
      const [header, ...body] = tableRows
      elements.push(
        <div key={elements.length} className="mb-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                {header.map((cell, i) => (
                  <th key={i} className="text-left p-2 font-semibold">{cell}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {body.filter(row => !row.every(c => c.match(/^-+$/))).map((row, i) => (
                <tr key={i} className="border-b">
                  {row.map((cell, j) => (
                    <td key={j} className="p-2 text-muted-foreground">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
      tableRows = []
      inTable = false
    }
  }

  for (const line of lines) {
    // Code block handling
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        // End code block
        elements.push(
          <pre key={elements.length} className="bg-muted p-4 rounded-lg overflow-x-auto mb-4">
            <code className="text-sm font-mono">{codeLines.join('\n')}</code>
          </pre>
        )
        codeLines = []
        inCodeBlock = false
      } else {
        // Start code block
        flushList()
        flushTable()
        codeLanguage = line.trim().slice(3)
        inCodeBlock = true
      }
      continue
    }

    if (inCodeBlock) {
      codeLines.push(line)
      continue
    }

    const trimmed = line.trim()

    // Empty line
    if (!trimmed) {
      flushList()
      flushTable()
      continue
    }

    // Table row
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      flushList()
      inTable = true
      const cells = trimmed.slice(1, -1).split('|').map(c => c.trim())
      tableRows.push(cells)
      continue
    } else if (inTable) {
      flushTable()
    }

    // Headings
    if (trimmed.startsWith('## ')) {
      flushList()
      elements.push(<h2 key={elements.length} className="text-2xl font-bold mb-4 mt-6">{trimmed.slice(3)}</h2>)
      continue
    }
    if (trimmed.startsWith('### ')) {
      flushList()
      elements.push(<h3 key={elements.length} className="text-lg font-semibold mb-3 mt-4">{trimmed.slice(4)}</h3>)
      continue
    }

    // List item
    if (trimmed.startsWith('- ')) {
      listItems.push(trimmed.slice(2))
      continue
    }

    // Numbered list
    if (/^\d+\.\s/.test(trimmed)) {
      listItems.push(trimmed.replace(/^\d+\.\s/, ''))
      continue
    }

    // Regular paragraph
    flushList()
    elements.push(<p key={elements.length} className="text-muted-foreground mb-4">{processInlineMarkdown(trimmed)}</p>)
  }

  // Flush remaining
  flushList()
  flushTable()

  return <div className="max-w-none">{elements}</div>
}

export default function DocsPage() {
  const [activeSection, setActiveSection] = React.useState("introduction")
  const [activeTab, setActiveTab] = React.useState("data")
  const [codeTab, setCodeTab] = React.useState("python")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [copiedEndpoint, setCopiedEndpoint] = React.useState<string | null>(null)

  // Check if viewing a guide section or API reference
  const isGuideSection = docSections.some(s => s.id === activeSection)

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedEndpoint(id)
    setTimeout(() => setCopiedEndpoint(null), 2000)
  }

  const getMethodColor = (method: string) => {
    switch (method) {
      case "GET": return "bg-emerald-500/10 text-emerald-500"
      case "POST": return "bg-sky-500/10 text-sky-500"
      case "PATCH": return "bg-amber-500/10 text-amber-500"
      case "DELETE": return "bg-rose-500/10 text-rose-500"
      case "WS": return "bg-violet-500/10 text-violet-500"
      default: return "bg-muted text-muted-foreground"
    }
  }

  return (
    <div className="min-h-screen bg-background">

      <div className="container px-4 py-8 md:px-6">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="lg:w-64 shrink-0">
            <div className="sticky top-24">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input 
                  placeholder="Search docs..." 
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <nav className="space-y-1">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Getting Started
                </div>
                {docSections.map((section) => {
                  const Icon = section.icon
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md w-full text-left ${
                        activeSection === section.id ? "bg-muted font-medium" : "hover:bg-muted"
                      }`}
                    >
                      <Icon className="size-4" />
                      {section.title}
                    </button>
                  )
                })}
                
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 mt-6">
                  API Reference
                </div>
                {Object.entries(apiEndpoints).map(([key, api]) => {
                  const Icon = api.name.includes("Data") ? Database : 
                              api.name.includes("Backtest") ? LineChart : 
                              api.name.includes("Execution") ? Zap : FileJson
                  return (
                    <button
                      key={key}
                      onClick={() => {
                        setActiveSection(key)
                        setActiveTab(key)
                      }}
                      className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md w-full text-left ${
                        activeSection === key ? "bg-muted font-medium" : "hover:bg-muted"
                      }`}
                    >
                      <Icon className="size-4" />
                      {api.name}
                    </button>
                  )
                })}
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {/* Guide Sections */}
            {docSections.map((section) => (
              <div key={section.id} className={activeSection === section.id ? "block" : "hidden"}>
                <DocContent content={section.content} />
              </div>
            ))}

            {/* API Reference Header - only show for API sections */}
            <div className={!isGuideSection ? "block mb-8" : "hidden"}>
              <h1 className="text-3xl font-bold mb-2">API Reference</h1>
              <p className="text-muted-foreground">
                Complete reference for the Odum Research API. All endpoints require authentication via API key.
              </p>
            </div>

            {/* Code Examples - only for API sections */}
            <Card className={!isGuideSection ? "mb-8" : "hidden"}>
              <CardHeader>
                <CardTitle className="text-lg">Quick Start</CardTitle>
                <CardDescription>Get up and running in minutes</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={codeTab} onValueChange={setCodeTab}>
                  <TabsList className="mb-4">
                    <TabsTrigger value="python">Python</TabsTrigger>
                    <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                    <TabsTrigger value="curl">cURL</TabsTrigger>
                  </TabsList>
                  {Object.entries(codeExamples).map(([lang, code]) => (
                    <TabsContent key={lang} value={lang}>
                      <div className="relative">
                        <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm font-mono">
                          <code>{code}</code>
                        </pre>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => copyToClipboard(code, `code-${lang}`)}
                        >
                          {copiedEndpoint === `code-${lang}` ? (
                            <Check className="size-4" />
                          ) : (
                            <Copy className="size-4" />
                          )}
                        </Button>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>

            {/* API Endpoints */}
            {Object.entries(apiEndpoints).map(([key, api]) => (
              <div key={key} className={activeSection === key ? "block" : "hidden"}>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold">{api.name}</h2>
                  <p className="text-muted-foreground">{api.description}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-xs">
                      {api.baseUrl}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-4">
                  {api.endpoints.map((endpoint, idx) => (
                    <Card key={idx}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-3">
                          <Badge className={`${getMethodColor(endpoint.method)} font-mono text-xs`}>
                            {endpoint.method}
                          </Badge>
                          <code className="text-sm font-mono">{endpoint.path}</code>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="ml-auto h-7"
                            onClick={() => copyToClipboard(`${api.baseUrl}${endpoint.path}`, `${key}-${idx}`)}
                          >
                            {copiedEndpoint === `${key}-${idx}` ? (
                              <Check className="size-3" />
                            ) : (
                              <Copy className="size-3" />
                            )}
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-3">{endpoint.description}</p>
                        {endpoint.params.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            <span className="text-xs text-muted-foreground">Parameters:</span>
                            {endpoint.params.map((param) => (
                              <Badge key={param} variant="secondary" className="text-xs font-mono">
                                {param}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}

            {/* OpenAPI Spec Download - only for API sections */}
            <Card className={!isGuideSection ? "mt-8" : "hidden"}>
              <CardHeader>
                <CardTitle className="text-lg">OpenAPI Specification</CardTitle>
                <CardDescription>Download the full API spec for code generation</CardDescription>
              </CardHeader>
              <CardContent className="flex gap-4">
                <Button variant="outline" asChild>
                  <a href="/api/openapi.json" download>
                    <FileJson className="mr-2 size-4" />
                    Download JSON
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <a href="/api/openapi.yaml" download>
                    <FileJson className="mr-2 size-4" />
                    Download YAML
                  </a>
                </Button>
                <Button variant="ghost" asChild>
                  <Link href="https://github.com/odum-research/api-clients" target="_blank">
                    <ExternalLink className="mr-2 size-4" />
                    SDK Libraries
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </div>
  )
}
