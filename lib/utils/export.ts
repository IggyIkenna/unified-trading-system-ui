import * as XLSX from 'xlsx'

export interface ExportColumn {
  key: string
  header: string
  format?: 'number' | 'date' | 'currency' | 'percent'
}

function formatCellValue(
  value: unknown,
  format: ExportColumn['format'],
): string | number {
  if (value == null) return ''

  switch (format) {
    case 'number':
      return typeof value === 'number' ? value : Number(value)
    case 'currency':
      return typeof value === 'number'
        ? value.toFixed(2)
        : Number(value).toFixed(2)
    case 'percent':
      return typeof value === 'number'
        ? `${(value * 100).toFixed(2)}%`
        : `${(Number(value) * 100).toFixed(2)}%`
    case 'date':
      return value instanceof Date
        ? value.toISOString().slice(0, 10)
        : String(value)
    default:
      return String(value)
  }
}

function buildRows(
  data: readonly object[],
  columns: ExportColumn[],
): (string | number)[][] {
  const headerRow = columns.map((col) => col.header)
  const dataRows = data.map((row) =>
    columns.map((col) => formatCellValue(row[col.key], col.format)),
  )
  return [headerRow, ...dataRows]
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}

export function exportTableToCsv(
  data: readonly object[],
  columns: ExportColumn[],
  filename: string,
): void {
  const rows = buildRows(data, columns)
  const csvContent = rows
    .map((row) =>
      row
        .map((cell) => {
          const str = String(cell)
          return str.includes(',') || str.includes('"') || str.includes('\n')
            ? `"${str.replace(/"/g, '""')}"`
            : str
        })
        .join(','),
    )
    .join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const csvFilename = filename.endsWith('.csv') ? filename : `${filename}.csv`
  triggerDownload(blob, csvFilename)
}

export function exportTableToXlsx(
  data: readonly object[],
  columns: ExportColumn[],
  filename: string,
): void {
  const rows = buildRows(data, columns)
  const worksheet = XLSX.utils.aoa_to_sheet(rows)

  // Bold headers
  const headerRange = XLSX.utils.decode_range(worksheet['!ref'] ?? 'A1')
  for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
    const cellRef = XLSX.utils.encode_cell({ r: 0, c: col })
    if (worksheet[cellRef]) {
      worksheet[cellRef].s = { font: { bold: true } }
    }
  }

  // Right-align number/currency/percent columns
  columns.forEach((col, idx) => {
    if (col.format === 'number' || col.format === 'currency' || col.format === 'percent') {
      for (let row = 1; row <= data.length; row++) {
        const cellRef = XLSX.utils.encode_cell({ r: row, c: idx })
        if (worksheet[cellRef]) {
          worksheet[cellRef].s = {
            ...worksheet[cellRef].s,
            alignment: { horizontal: 'right' },
          }
        }
      }
    }
  })

  const sheetName = filename.replace(/\.(xlsx|xls)$/i, '').slice(0, 31)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

  const xlsxBuffer = XLSX.write(workbook, {
    bookType: 'xlsx',
    type: 'array',
  }) as ArrayBuffer
  const blob = new Blob([xlsxBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const xlsxFilename = filename.endsWith('.xlsx')
    ? filename
    : `${filename}.xlsx`
  triggerDownload(blob, xlsxFilename)
}

export function exportMultiSheetXlsx(
  sheets: {
    name: string
    data: readonly object[]
    columns: ExportColumn[]
  }[],
  filename: string,
): void {
  const workbook = XLSX.utils.book_new()

  for (const sheet of sheets) {
    const rows = buildRows(sheet.data, sheet.columns)
    const worksheet = XLSX.utils.aoa_to_sheet(rows)

    // Bold headers
    const headerRange = XLSX.utils.decode_range(worksheet['!ref'] ?? 'A1')
    for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: col })
      if (worksheet[cellRef]) {
        worksheet[cellRef].s = { font: { bold: true } }
      }
    }

    // Right-align number columns
    sheet.columns.forEach((col, idx) => {
      if (col.format === 'number' || col.format === 'currency' || col.format === 'percent') {
        for (let row = 1; row <= sheet.data.length; row++) {
          const cellRef = XLSX.utils.encode_cell({ r: row, c: idx })
          if (worksheet[cellRef]) {
            worksheet[cellRef].s = {
              ...worksheet[cellRef].s,
              alignment: { horizontal: 'right' },
            }
          }
        }
      }
    })

    XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name.slice(0, 31))
  }

  const xlsxBuffer = XLSX.write(workbook, {
    bookType: 'xlsx',
    type: 'array',
  }) as ArrayBuffer
  const blob = new Blob([xlsxBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const xlsxFilename = filename.endsWith('.xlsx')
    ? filename
    : `${filename}.xlsx`
  triggerDownload(blob, xlsxFilename)
}
