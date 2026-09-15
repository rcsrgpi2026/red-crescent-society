/**
 * Automated Route Discovery for RCY Website
 * Scans app/ directory for all public pages and writes discovered-routes.json.
 * Eliminates the need to manually register every new page in route-registry.ts.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const appDir = path.join(rootDir, "app");

function discoverRoutes(dir, base = "") {
  const routes = [];
  if (!fs.existsSync(dir)) return routes;

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    // Ignore private admin panels, api endpoints, team directory (admin-only), and system folders
    if (entry.name === "admin" || entry.name === "api" || entry.name === "_not-found" || entry.name === "team") {
      continue;
    }

    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Route groups like (site), (portal), (auth) do not add to the URL path
      if (entry.name.startsWith("(") && entry.name.endsWith(")")) {
        routes.push(...discoverRoutes(fullPath, base));
      } else {
        routes.push(...discoverRoutes(fullPath, `${base}/${entry.name}`));
      }
    } else if (
      entry.name === "page.tsx" ||
      entry.name === "page.jsx" ||
      entry.name === "page.ts" ||
      entry.name === "page.js"
    ) {
      routes.push(base || "/");
    }
  }

  return routes;
}

const discovered = Array.from(new Set(discoverRoutes(appDir))).sort();

const outputPath = path.join(rootDir, "lib", "ai", "registries", "discovered-routes.json");
fs.writeFileSync(outputPath, JSON.stringify(discovered, null, 2), "utf8");

console.log(`✓ Auto-discovered ${discovered.length} public site routes:`, discovered);
