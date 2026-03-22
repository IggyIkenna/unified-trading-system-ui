"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Download, FileSpreadsheet, FileText } from "lucide-react"
import { exportTableToCsv, exportTableToXlsx, type ExportColumn } from "@/lib/utils/export"

interface ExportDropdownProps {
  data: Record<string, unknown>[]
  columns: ExportColumn[]
  filename: string
  className?: string
}

export function ExportDropdown({ data, columns, filename, className }: ExportDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <Download className="mr-2 size-4" />
          Export
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
  )
}
