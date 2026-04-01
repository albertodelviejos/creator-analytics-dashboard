import { NextRequest, NextResponse } from "next/server";
import { execSync } from "child_process";

const PLATFORM_SCRIPTS: Record<string, { script: string; argEnv?: string }> = {
  instagram: {
    script: "scripts/fetch-instagram.ts",
    argEnv: "INSTAGRAM_USERNAME",
  },
  youtube: {
    script: "scripts/fetch-youtube.ts",
    argEnv: "YOUTUBE_HANDLE",
  },
};

export async function POST(
  _request: NextRequest,
  { params }: { params: { platform: string } }
) {
  const { platform } = params;

  const config = PLATFORM_SCRIPTS[platform];
  if (!config) {
    return NextResponse.json(
      { error: `Unknown platform: ${platform}` },
      { status: 400 }
    );
  }

  const arg = process.env[config.argEnv || ""] || "";
  if (!arg) {
    return NextResponse.json(
      {
        error: `Missing ${config.argEnv} environment variable. Add it to .env.local`,
      },
      { status: 400 }
    );
  }

  try {
    const output = execSync(
      `npx tsx ${config.script} ${arg}`,
      {
        cwd: process.cwd(),
        timeout: 120_000,
        encoding: "utf-8",
        env: { ...process.env },
      }
    );

    return NextResponse.json({ success: true, output });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
