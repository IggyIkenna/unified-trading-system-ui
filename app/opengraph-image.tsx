import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "Odum Research - Unified Trading Infrastructure";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage() {
  let logoSrc: string | null = null;
  try {
    const logoData = await readFile(
      join(process.cwd(), "public/images/odum-logo.png"),
    );
    logoSrc = `data:image/png;base64,${logoData.toString("base64")}`;
  } catch {
    // Logo missing — render text-only card
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0a0a0b",
          fontFamily: "sans-serif",
        }}
      >
        {logoSrc && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoSrc}
            alt=""
            width={120}
            height={143}
            style={{ marginBottom: 32 }}
          />
        )}
        <div
          style={{
            fontSize: 48,
            fontWeight: 700,
            color: "#ffffff",
            marginBottom: 12,
          }}
        >
          Odum Research
        </div>
        <div style={{ fontSize: 24, color: "rgba(255,255,255,0.5)" }}>
          Unified Trading Infrastructure
        </div>
      </div>
    ),
    { ...size },
  );
}
