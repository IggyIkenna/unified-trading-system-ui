"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Play, Sliders } from "lucide-react";
import { configParameters } from "./quant-data";

export function ConfigGridPage() {
  const [gridDimensions, setGridDimensions] = React.useState(2);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Config Grid Generator</h1>
          <p className="text-xs text-muted-foreground">Generate parameter grids for backtesting</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Export Grid
          </Button>
          <Button size="sm">
            <Play className="h-3.5 w-3.5 mr-1.5" />
            Run Grid Search
          </Button>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-12">
        <Card className="col-span-8">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Sliders className="h-4 w-4" />
                Parameter Configuration
              </CardTitle>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Grid dimensions:</span>
                <Select value={gridDimensions.toString()} onValueChange={(v) => setGridDimensions(parseInt(v, 10))}>
                  <SelectTrigger className="w-[60px] h-7">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1D</SelectItem>
                    <SelectItem value="2">2D</SelectItem>
                    <SelectItem value="3">3D</SelectItem>
                    <SelectItem value="4">4D</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {configParameters.map((param) => (
                <div key={param.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">{param.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">({param.type})</span>
                    </div>
                    {param.type === "bool" ? (
                      <Switch checked={param.current} />
                    ) : param.type === "string" ? (
                      <Select value={param.current}>
                        <SelectTrigger className="w-[100px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {param.options.map((opt) => (
                            <SelectItem key={opt} value={opt}>
                              {opt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="font-mono text-sm">{param.current}</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{param.description}</p>
                  {(param.type === "int" || param.type === "float") && (
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-muted-foreground w-12">{param.min}</span>
                      <Slider
                        value={[param.current]}
                        min={param.min}
                        max={param.max}
                        step={param.type === "float" ? 0.1 : 1}
                        className="flex-1"
                      />
                      <span className="text-xs text-muted-foreground w-12 text-right">{param.max}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Grid Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-xs text-muted-foreground">Total Combinations</div>
                <div className="text-2xl font-bold mt-1">2,048</div>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-xs text-muted-foreground">Estimated Runtime</div>
                <div className="text-2xl font-bold mt-1">~4h 30m</div>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-xs text-muted-foreground">Parameters in Grid</div>
                <div className="text-lg font-bold mt-1">{gridDimensions} dimensions</div>
                <div className="text-xs text-muted-foreground mt-1">lookback_period, entry_threshold</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
