#!/usr/bin/env bash
set -Eeuo pipefail

WORKER_NAME="devotedhqapp2-v4"
D1_NAME="devotedhq-db-v4"
R2_NAME="devotedhq-r2-v4"
D1_BINDING="DB"
R2_BINDING="BUCKET"

CHECK_ONLY=false
if [[ "${1:-}" == "--check" ]]; then
  CHECK_ONLY=true
fi

echo
echo "======================================================"
echo "  DEVOTED OPERATIONS HUB V4 - SAFE DEPLOY"
echo "======================================================"
echo

echo "🔍 [1/7] Running pre-flight checks..."

if [[ ! -f "package.json" || ! -f "wrangler.json" ]]; then
  echo "❌ ERROR: Run this script from the app_v4 project root."
  exit 1
fi

node <<'NODE_EOF'
const fs = require("fs");

const config = JSON.parse(fs.readFileSync("wrangler.json", "utf8"));

const expected = {
  worker: "devotedhqapp2-v4",
  dbName: "devotedhq-db-v4",
  dbBinding: "DB",
  bucketName: "devotedhq-r2-v4",
  bucketBinding: "BUCKET",
};

function fail(message) {
  console.error(`❌ CONFIGURATION SAFETY CHECK FAILED: ${message}`);
  process.exit(1);
}

if (config.name !== expected.worker) {
  fail(`Worker must be "${expected.worker}", found "${config.name}".`);
}

const db = config.d1_databases?.find(
  (item) => item.database_name === expected.dbName
);

if (!db) {
  fail(`D1 database "${expected.dbName}" is missing.`);
}

if (db.binding !== expected.dbBinding) {
  fail(`D1 binding must be "${expected.dbBinding}", found "${db.binding}".`);
}

const bucket = config.r2_buckets?.find(
  (item) => item.bucket_name === expected.bucketName
);

if (!bucket) {
  fail(`R2 bucket "${expected.bucketName}" is missing.`);
}

if (bucket.binding !== expected.bucketBinding) {
  fail(`R2 binding must be "${expected.bucketBinding}", found "${bucket.binding}".`);
}

console.log("✅ Worker configuration verified.");
console.log(`   Worker: ${config.name}`);
console.log(`   D1:     ${db.binding} -> ${db.database_name}`);
console.log(`   R2:     ${bucket.binding} -> ${bucket.bucket_name}`);
NODE_EOF

echo
echo "🔎 [2/7] Checking for forbidden Cloudflare native imports..."

if grep -RIn \
  --include='*.ts' \
  --include='*.tsx' \
  --include='*.js' \
  --include='*.mjs' \
  --include='*.cjs' \
  --exclude-dir=node_modules \
  --exclude-dir=.next \
  --exclude-dir=.open-next \
  --exclude-dir=.wrangler \
  'from ["'\'']cloudflare:' \
  app db lib 2>/dev/null
then
  echo
  echo "❌ ERROR: A cloudflare: native import was found."
  echo "Use getCloudflareContext() from @opennextjs/cloudflare instead."
  exit 1
else
  echo "✅ No forbidden cloudflare: imports found."
fi

echo
echo "☁️ [3/7] Verifying Cloudflare resources..."

npx wrangler whoami >/dev/null

npx wrangler d1 list --json | node -e '
let data="";
process.stdin.on("data", d => data += d);
process.stdin.on("end", () => {
  const rows = JSON.parse(data);
  if (!rows.some(x => x.name === "devotedhq-db-v4")) {
    console.error("❌ Remote D1 database devotedhq-db-v4 was not found.");
    process.exit(1);
  }
  console.log("✅ Remote D1 database verified.");
});
'

if ! npx wrangler r2 bucket list 2>&1 | grep -q "devotedhq-r2-v4"; then
  echo "❌ Remote R2 bucket devotedhq-r2-v4 was not found."
  exit 1
fi

echo "✅ Remote R2 bucket verified."

if [[ "$CHECK_ONLY" == true ]]; then
  echo
  echo "======================================================"
  echo "  ✅ SAFETY CHECK PASSED"
  echo "======================================================"
  echo
  echo "No dependencies installed."
  echo "No migrations applied."
  echo "No build performed."
  echo "No deployment performed."
  echo
  exit 0
fi

echo
echo "📦 [4/7] Installing locked dependencies..."

if [[ -f "package-lock.json" ]]; then
  npm ci --legacy-peer-deps
else
  npm install --legacy-peer-deps
fi

echo
echo "🗄️ [5/7] Generating and applying D1 migrations..."

npx drizzle-kit generate
npx wrangler d1 migrations apply "$D1_NAME" --remote

echo
echo "🏗️ [6/7] Building fresh OpenNext Worker..."

rm -rf .open-next
unset NODE_OPTIONS

npx opennextjs-cloudflare build

if [[ ! -f ".open-next/worker.js" ]]; then
  echo "❌ ERROR: OpenNext did not produce .open-next/worker.js."
  exit 1
fi

echo "✅ Fresh OpenNext Worker generated."

echo
echo "🚀 [7/7] Deploying isolated V4 Worker..."

npx wrangler deploy

echo
echo "======================================================"
echo "  ✅ DEVOTED OPERATIONS HUB V4 DEPLOYMENT COMPLETE"
echo "======================================================"
echo
echo "Worker: $WORKER_NAME"
echo "D1:     $D1_BINDING -> $D1_NAME"
echo "R2:     $R2_BINDING -> $R2_NAME"
echo
echo "Live:"
echo "https://devotedhqapp2-v4.gibby3579.workers.dev"
echo
