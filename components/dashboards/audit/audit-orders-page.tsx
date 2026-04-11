"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { orderHistory } from "./audit-dashboard-data";

export function OrdersPage() {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Order History</h1>
          <p className="text-xs text-muted-foreground">All orders placed, filled, and cancelled</p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="h-3.5 w-3.5 mr-1.5" />
          Export CSV
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-xs">
            <thead className="bg-muted/30">
              <tr className="text-muted-foreground">
                <th className="px-4 py-2 text-left font-medium">Order ID</th>
                <th className="px-4 py-2 text-left font-medium">Strategy</th>
                <th className="px-4 py-2 text-center font-medium">Type</th>
                <th className="px-4 py-2 text-center font-medium">Side</th>
                <th className="px-4 py-2 text-left font-medium">Instrument</th>
                <th className="px-4 py-2 text-right font-medium">Qty</th>
                <th className="px-4 py-2 text-right font-medium">Price</th>
                <th className="px-4 py-2 text-center font-medium">Status</th>
                <th className="px-4 py-2 text-right font-medium">Filled</th>
                <th className="px-4 py-2 text-right font-medium">Time</th>
              </tr>
            </thead>
            <tbody>
              {orderHistory.map((order) => (
                <tr key={order.id} className="border-b border-border/50 hover:bg-muted/30 cursor-pointer">
                  <td className="px-4 py-3 font-mono">{order.id}</td>
                  <td className="px-4 py-3">{order.strategy}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant="outline" className="text-[9px]">
                      {order.type}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={order.side === "BUY" ? "default" : "secondary"} className="text-[9px]">
                      {order.side}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">{order.instrument}</td>
                  <td className="px-4 py-3 text-right font-mono">{order.qty}</td>
                  <td className="px-4 py-3 text-right font-mono">{order.price}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge
                      variant={
                        order.status === "filled" ? "default" : order.status === "open" ? "secondary" : "outline"
                      }
                      className={cn("text-[9px]", order.status === "cancelled" && "text-muted-foreground")}
                    >
                      {order.status.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right font-mono">{order.filled}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{order.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

// Logins Page
