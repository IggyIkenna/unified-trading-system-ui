'use client'

import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  type ExportColumn,
  exportTableToCsv,
  exportTableToXlsx,
} from '@/lib/utils/export'

interface ExportButtonProps {
  data: readonly object[]
  columns: ExportColumn[]
  filename: string
}

export function ExportButton({ data, columns, filename }: ExportButtonProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Download />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => exportTableToCsv(data, columns, filename)}
        >
          CSV
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => exportTableToXlsx(data, columns, filename)}
        >
          Excel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
