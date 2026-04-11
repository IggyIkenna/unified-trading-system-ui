"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw, User, XCircle, CheckCircle } from "lucide-react";
import { loginHistory } from "./audit-dashboard-data";

export function LoginsPage() {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Login History</h1>
          <p className="text-xs text-muted-foreground">User authentication events</p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="h-3.5 w-3.5 mr-1.5" />
          Export
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-xs">
            <thead className="bg-muted/30">
              <tr className="text-muted-foreground">
                <th className="px-4 py-2 text-left font-medium">ID</th>
                <th className="px-4 py-2 text-left font-medium">User</th>
                <th className="px-4 py-2 text-center font-medium">Action</th>
                <th className="px-4 py-2 text-left font-medium">IP Address</th>
                <th className="px-4 py-2 text-left font-medium">Device</th>
                <th className="px-4 py-2 text-left font-medium">Location</th>
                <th className="px-4 py-2 text-center font-medium">Status</th>
                <th className="px-4 py-2 text-right font-medium">Time</th>
              </tr>
            </thead>
            <tbody>
              {loginHistory.map((login) => (
                <tr key={login.id} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono">{login.id}</td>
                  <td className="px-4 py-3">{login.user}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant="outline" className="text-[9px]">
                      {login.action}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 font-mono">{login.ip}</td>
                  <td className="px-4 py-3">{login.device}</td>
                  <td className="px-4 py-3">{login.location}</td>
                  <td className="px-4 py-3 text-center">
                    {login.status === "success" ? (
                      <CheckCircle className="h-4 w-4 text-positive inline" />
                    ) : (
                      <XCircle className="h-4 w-4 text-destructive inline" />
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{login.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

// Config Changes Page
