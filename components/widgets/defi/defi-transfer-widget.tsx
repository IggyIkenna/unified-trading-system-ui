"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Fuel, Globe, Send, Wallet } from "lucide-react";
import { CollapsibleSection } from "@/components/widgets/shared";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { BRIDGE_PROTOCOLS, DEFI_CHAINS, DEFI_TOKENS } from "@/lib/mocks/fixtures/defi-transfer";
import { useDeFiData } from "./defi-data-context";

export function DeFiTransferWidget(_props: WidgetComponentProps) {
  const { connectedWallet, tokenBalances, transferMode, setTransferMode, selectedChain, setSelectedChain } =
    useDeFiData();

  const [toAddress, setToAddress] = React.useState("");
  const [fromChain, setFromChain] = React.useState<string>(DEFI_CHAINS[0]);
  const [toChain, setToChain] = React.useState<string>(DEFI_CHAINS[1]);
  const [token, setToken] = React.useState<string>(DEFI_TOKENS[0]);
  const [amount, setAmount] = React.useState("");
  const [bridgeProtocol, setBridgeProtocol] = React.useState<string>(BRIDGE_PROTOCOLS[0]);

  const amountNum = parseFloat(amount) || 0;
  const balance = tokenBalances[token] ?? 0;

  const truncateAddr = (addr: string | null) => {
    if (!addr || addr.length < 12) return addr ?? "—";
    return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
  };

  return (
    <div className="space-y-3 p-1">
      <div className="grid grid-cols-2 gap-1">
        <Button
          variant={transferMode === "send" ? "default" : "outline"}
          size="sm"
          className="text-xs h-8 gap-1"
          onClick={() => setTransferMode("send")}
        >
          <Send className="size-3" />
          Send
        </Button>
        <Button
          variant={transferMode === "bridge" ? "default" : "outline"}
          size="sm"
          className="text-xs h-8 gap-1"
          onClick={() => setTransferMode("bridge")}
        >
          <Globe className="size-3" />
          Bridge
        </Button>
      </div>

      {transferMode === "send" ? (
        <div className="space-y-3">
          <div className="p-3 rounded-lg border bg-muted/30">
            <div className="flex items-center gap-2 text-xs">
              <Wallet className="size-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">From wallet</span>
              <code className="ml-auto font-mono text-[11px]">{truncateAddr(connectedWallet)}</code>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">To address</label>
            <Input
              placeholder="0x… or ENS"
              value={toAddress}
              onChange={(e) => setToAddress(e.target.value)}
              className="font-mono text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Chain</label>
            <Select
              value={selectedChain}
              onValueChange={(v) => {
                setSelectedChain(v);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEFI_CHAINS.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Token</label>
            <Select value={token} onValueChange={setToken}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEFI_TOKENS.map((t) => (
                  <SelectItem key={t} value={t}>
                    <span className="font-mono">{t}</span>
                    <span className="text-[10px] text-muted-foreground ml-2">
                      Bal: {(tokenBalances[t] ?? 0).toLocaleString()}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs text-muted-foreground">Amount</label>
              <span className="text-[10px] text-muted-foreground font-mono">
                Balance: {balance.toLocaleString()} {token}
              </span>
            </div>
            <Input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="font-mono"
            />
          </div>

          <div className="p-3 rounded-lg border bg-muted/30">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1">
                <Fuel className="size-3" />
                Gas estimate
              </span>
              <span className="font-mono">~0.0008 ETH ($2.76)</span>
            </div>
          </div>

          <Button className="w-full" disabled={amountNum <= 0 || amountNum > balance || !toAddress}>
            <Send className="size-3.5 mr-1.5" />
            Send {token}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">From chain</label>
              <Select value={fromChain} onValueChange={setFromChain}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEFI_CHAINS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">To chain</label>
              <Select value={toChain} onValueChange={setToChain}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEFI_CHAINS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Bridge protocol</label>
            <Select value={bridgeProtocol} onValueChange={setBridgeProtocol}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BRIDGE_PROTOCOLS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Token</label>
            <Select value={token} onValueChange={setToken}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEFI_TOKENS.map((t) => (
                  <SelectItem key={t} value={t}>
                    <span className="font-mono">{t}</span>
                    <span className="text-[10px] text-muted-foreground ml-2">
                      Bal: {(tokenBalances[t] ?? 0).toLocaleString()}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs text-muted-foreground">Amount</label>
              <span className="text-[10px] text-muted-foreground font-mono">
                Balance: {balance.toLocaleString()} {token}
              </span>
            </div>
            <Input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="font-mono"
            />
          </div>

          <CollapsibleSection title="Bridge fee / time" defaultOpen={false}>
            <div className="px-2 pb-2">
              <div className="p-3 rounded-lg border bg-muted/30 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Bridge fee</span>
                  <span className="font-mono">~0.05% ($1.72)</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Estimated time</span>
                  <span>~2–15 min</span>
                </div>
              </div>
            </div>
          </CollapsibleSection>

          <Button className="w-full" disabled={amountNum <= 0 || amountNum > balance || fromChain === toChain}>
            <Globe className="size-3.5 mr-1.5" />
            Bridge {token}
          </Button>
        </div>
      )}
    </div>
  );
}
