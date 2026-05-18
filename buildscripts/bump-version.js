// scripts/bump-version.js
// Usage: node scripts/bump-version.js [patch|minor|major]
// Defaults to patch.
//
// Local:  npm run release          → always patch
// CI:     called with type derived from commit message
//           [minor] in message     → minor
//           [major] in message     → major
//           anything else          → patch

const fs = require("fs");
const path = require("path");

const type = process.argv[2] || "patch";
if (!["patch", "minor", "major"].includes(type)) {
  console.error(`❌ Unknown type "${type}". Use patch, minor, or major.`);
  process.exit(1);
}

// ── 1. Bump package.json ──────────────────────────────────────────────────
const pkgFile = path.join(__dirname, "../package.json");
const pkg = JSON.parse(fs.readFileSync(pkgFile, "utf8"));

let [major, minor, patch] = pkg.version.split(".").map(Number);
if      (type === "major") { major++; minor = 0; patch = 0; }
else if (type === "minor") { minor++; patch = 0; }
else                       { patch++; }

pkg.version = `${major}.${minor}.${patch}`;
fs.writeFileSync(pkgFile, JSON.stringify(pkg, null, 2) + "\n");
console.log(`📦 Version bumped (${type}) → ${pkg.version}`);

// ── 2. Sync README.md ────────────────────────────────────────────────────
const readmeFile = path.join(__dirname, "../README.md");
if (fs.existsSync(readmeFile)) {
  let readme = fs.readFileSync(readmeFile, "utf8");
  readme = readme.replace(
    /img\.shields\.io\/badge\/version-[\d.]+/g,
    `img.shields.io/badge/version-${pkg.version}`,
  );
  readme = readme.replace(/\bv\d+\.\d+\.\d+\b/g, `v${pkg.version}`);
  fs.writeFileSync(readmeFile, readme);
  console.log(`📝 README synced   → v${pkg.version}`);
} else {
  console.warn("⚠️  README.md not found — skipping.");
}