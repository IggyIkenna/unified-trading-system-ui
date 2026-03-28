"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Box, GitBranch, RotateCcw } from "lucide-react";
import { versionBranches } from "./devops-data";

export function RollbackPage() {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Rollback Center</h1>
          <p className="text-xs text-muted-foreground">Version management and rollback</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Service Versions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {versionBranches.map((svc) => (
              <div
                key={svc.service}
                className="flex items-center justify-between py-3 border-b border-border/50 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <Box className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{svc.service}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Select defaultValue={svc.current}>
                    <SelectTrigger className="w-[180px] h-8">
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {svc.branches.map((branch) => (
                        <SelectItem key={branch} value={branch}>
                          <div className="flex items-center gap-2">
                            <GitBranch className="h-3 w-3" />
                            {branch}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm">
                    <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                    Rollback
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
