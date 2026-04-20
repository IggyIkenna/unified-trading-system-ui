"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { exportTableToCsv, exportTableToXlsx, type ExportColumn } from "@/lib/utils/export";

interface ExportDropdownProps {
  data: readonly object[];
  columns: ExportColumn[];
  filename: string;
  className?: string;
  /** Classes applied to the "Export" label span — e.g. `hidden @[44rem]/tbt:inline` to collapse to icon-only in narrow containers. */
  labelClassName?: string;
}

export function ExportDropdown({ data, columns, filename, className, labelClassName }: ExportDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={className} aria-label="Export">
          <Download className="size-4" />
          <span className={cn("ml-2", labelClassName)}>Export</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => exportTableToCsv(data, columns, filename)}>
          <FileText className="mr-2 size-4" />
          Export CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportTableToXlsx(data, columns, filename)}>
          <FileSpreadsheet className="mr-2 size-4" />
          Export Excel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
