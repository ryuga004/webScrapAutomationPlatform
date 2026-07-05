import { promises as fs } from "node:fs";
import path from "node:path";
import JSZip from "jszip";
import { authService } from "@/server/container";
import { requireUser } from "@/server/http/auth";
import { config } from "@/server/config";
import { CORS_HEADERS, handleError, preflight } from "@/server/http/responses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EXT_DIR = path.join(process.cwd(), "extension");

export function OPTIONS() {
  return preflight();
}

// Streams a personalised copy of the browser extension as a .zip: every static
// file from /extension, but with config.js regenerated to embed this user's
// backend URL + a long-lived API token. The user unzips it, loads it as an
// unpacked extension, and it works with zero manual configuration.
export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    const token = authService.issueApiToken(
      user,
      config.extensionTokenExpiresIn,
    );
    const backendUrl = config.appUrl || new URL(request.url).origin;

    const zip = new JSZip();
    for (const name of await fs.readdir(EXT_DIR)) {
      if (name === "config.js") continue; // regenerated below
      const full = path.join(EXT_DIR, name);
      if (!(await fs.stat(full)).isFile()) continue;
      zip.file(name, await fs.readFile(full));
    }

    const bakedConfig =
      `// Generated for ${user.username} at download time — keep this private.\n` +
      `window.WEBBOT_CONFIG = ${JSON.stringify(
        { backendUrl, apiToken: token, username: user.username },
        null,
        2,
      )};\n`;
    zip.file("config.js", bakedConfig);

    const buffer = await zip.generateAsync({ type: "nodebuffer" });
    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="webbot-extension-${user.username}.zip"`,
      },
    });
  } catch (err) {
    return handleError(err);
  }
}
