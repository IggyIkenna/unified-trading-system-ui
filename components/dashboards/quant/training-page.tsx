"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { mlTrainingJobs } from "./quant-data";
import { getStatusIcon } from "./quant-utils";

export function TrainingPage() {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">ML Training</h1>
          <p className="text-xs text-muted-foreground">Model training jobs and results</p>
        </div>
        <Button size="sm">
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          New Training Job
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted/30">
              <tr className="text-muted-foreground">
                <th className="px-4 py-3 text-left font-medium">Job</th>
                <th className="px-4 py-3 text-center font-medium">Model</th>
                <th className="px-4 py-3 text-center font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Accuracy</th>
                <th className="px-4 py-3 text-right font-medium">Loss</th>
                <th className="px-4 py-3 text-right font-medium">Epochs</th>
                <th className="px-4 py-3 text-right font-medium">Duration</th>
              </tr>
            </thead>
            <tbody>
              {mlTrainingJobs.map((job) => (
                <tr key={job.id} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="font-medium">{job.name}</span>
                      <span className="text-xs text-muted-foreground font-mono">{job.id}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant="outline" className="text-[10px]">
                      {job.model}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-center">{getStatusIcon(job.status)}</td>
                  <td className="px-4 py-3 text-right font-mono">{job.accuracy > 0 ? `${job.accuracy}%` : "-"}</td>
                  <td className="px-4 py-3 text-right font-mono">{job.loss > 0 ? job.loss.toFixed(4) : "-"}</td>
                  <td className="px-4 py-3 text-right font-mono">{job.epochs > 0 ? job.epochs : "-"}</td>
                  <td className="px-4 py-3 text-right">{job.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
