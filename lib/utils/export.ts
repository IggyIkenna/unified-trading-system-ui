import writeXlsxFile from "write-excel-file/browser";
import type { Row, Cell } from "write-excel-file/browser";

export interface ExportColumn {
  key: string;
  header: string;
  format?:
    | "number"
    | "date"
    | "currency"
    | "percent"
    | ((value: unknown) => string);
}

function formatCellValue(
  value: unknown,
  format: ExportColumn["format"],
): string | number {
  if (value == null) return "";

  if (typeof format === "function") return format(value);

  switch (format) {
    case "number":
      return typeof value === "number" ? value : Number(value);
    case "currency":
      return typeof value === "number"
        ? value.toFixed(2)
        : Number(value).toFixed(2);
    case "percent":
      return typeof value === "number"
        ? `${(value * 100).toFixed(2)}%`
        : `${(Number(value) * 100).toFixed(2)}%`;
    case "date":
      return value instanceof Date
        ? value.toISOString().slice(0, 10)
        : String(value);
    default:
      return String(value);
  }
}

function isNumericFormat(format: ExportColumn["format"]): boolean {
  return format === "number" || format === "currency" || format === "percent";
}

function buildSheetData(
  data: readonly object[],
  columns: ExportColumn[],
): Row[] {
  const headerRow: Row = columns.map(
    (col): Cell => ({
      value: col.header,
      fontWeight: "bold",
    }),
  );

  const dataRows: Row[] = data.map((row) =>
    columns.map((col): Cell => {
      const raw = (row as Record<string, unknown>)[col.key];
      const formatted = formatCellValue(raw, col.format);
      return {
        value: formatted as string | number,
        align: isNumericFormat(col.format) ? "right" : undefined,
      };
    }),
  );

  return [headerRow, ...dataRows];
}

function xlsxFilename(filename: string): string {
  return filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`;
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function exportTableToCsv(
  data: readonly object[],
  columns: ExportColumn[],
  filename: string,
): void {
  const headerRow = columns.map((col) => col.header);
  const dataRows = data.map((row) =>
    columns.map((col) =>
      formatCellValue((row as Record<string, unknown>)[col.key], col.format),
    ),
  );
  const rows = [headerRow, ...dataRows];

  const csvContent = rows
    .map((row) =>
      row
        .map((cell) => {
          const str = String(cell);
          return str.includes(",") || str.includes('"') || str.includes("\n")
            ? `"${str.replace(/"/g, '""')}"`
            : str;
        })
        .join(","),
    )
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const csvFilename = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  triggerDownload(blob, csvFilename);
}

export function exportTableToXlsx(
  data: readonly object[],
  columns: ExportColumn[],
  filename: string,
): void {
  const sheetData = buildSheetData(data, columns);
  writeXlsxFile(sheetData, { fileName: xlsxFilename(filename) }).catch(
    (err: unknown) => {
      console.error("[export] Excel export failed:", err);
    },
  );
}

export function exportMultiSheetXlsx(
  sheets: {
    name: string;
    data: readonly object[];
    columns: ExportColumn[];
  }[],
  filename: string,
): void {
  const sheetDataArray = sheets.map((sheet) =>
    buildSheetData(sheet.data, sheet.columns),
  );
  const sheetNames = sheets.map((sheet) => sheet.name.slice(0, 31));
  writeXlsxFile(sheetDataArray, {
    fileName: xlsxFilename(filename),
    sheets: sheetNames,
  }).catch((err: unknown) => {
    console.error("[export] Multi-sheet Excel export failed:", err);
  });
}
