"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Play, XCircle } from "lucide-react";
import { jobs } from "./devops-data";
import { getStatusIcon } from "./devops-status-icon";

export function JobsPage() {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Batch Jobs</h1>
          <p className="text-xs text-muted-foreground">Scheduled and ad-hoc job management</p>
        </div>
        <Button size="sm">
          <Play className="h-3.5 w-3.5 mr-1.5" />
          Run Job
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted/30">
              <tr className="text-muted-foreground">
                <th className="px-4 py-3 text-left font-medium">Job</th>
                <th className="px-4 py-3 text-center font-medium">Status</th>
                <th className="px-4 py-3 text-center font-medium">Progress</th>
                <th className="px-4 py-3 text-left font-medium">Schedule</th>
                <th className="px-4 py-3 text-right font-medium">Started</th>
                <th className="px-4 py-3 text-right font-medium">Duration</th>
                <th className="px-4 py-3 text-center font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="font-medium">{job.name}</span>
                      <span className="text-xs text-muted-foreground font-mono">{job.id}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">{getStatusIcon(job.status)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Progress value={job.progress} className="h-1.5 w-20" />
                      <span className="text-xs font-mono">{job.progress}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs">{job.schedule}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{job.startTime}</td>
                  <td className="px-4 py-3 text-right font-mono">{job.duration}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                        <Play className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                        <XCircle className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
