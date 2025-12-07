#!/bin/bash

# Blocksgate Codebase Reorganization Script - Simplified Version
# Safe, step-by-step reorganization with validation

set -e

REPO_ROOT="/workspaces/blocksgate"
BACKUP_DIR="${REPO_ROOT}/.migration-backup-$(date +%s)"
MIGRATION_LOG="${REPO_ROOT}/MIGRATION.log"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${BLUE}[MIGRATION]${NC} $1" | tee -a "$MIGRATION_LOG"; }
success() { echo -e "${GREEN}[✓]${NC} $1" | tee -a "$MIGRATION_LOG"; }
warning() { echo -e "${YELLOW}[!]${NC} $1" | tee -a "$MIGRATION_LOG"; }
error() { echo -e "${RED}[✗]${NC} $1" | tee -a "$MIGRATION_LOG"; exit 1; }

echo "Blocksgate Codebase Reorganization" > "$MIGRATION_LOG"
log "Starting migration..."

cd "$REPO_ROOT"

# Phase 1: Backup
log "Phase 1: Creating backup..."
mkdir -p "$BACKUP_DIR"
cp -r v0-code5 "$BACKUP_DIR/v0-code5-backup"
success "Backup created at $BACKUP_DIR"

# Phase 2: Create directories
log "Phase 2: Creating directory structure..."
mkdir -p src/{app,lib/workers,components,hooks,types,styles,public,tests}
mkdir -p scripts/{cli,db}
mkdir -p docs/{guides,deployment,system}
success "Directory structure created"

# Phase 3: Move source code
log "Phase 3: Moving source code to src/..."
cp -r v0-code5/app/* src/app/ && success "  Copied app/"
cp -r v0-code5/lib/* src/lib/ && success "  Copied lib/"
cp -r v0-code5/components/* src/components/ && success "  Copied components/"
cp -r v0-code5/hooks/* src/hooks/ && success "  Copied hooks/"
cp -r v0-code5/types/* src/types/ && success "  Copied types/"
cp -r v0-code5/styles/* src/styles/ && success "  Copied styles/"
cp -r v0-code5/public/* src/public/ && success "  Copied public/"
[ -d "v0-code5/tests" ] && cp -r v0-code5/tests/* src/tests/ && success "  Copied tests/"

# Phase 4: Move scripts
log "Phase 4: Organizing scripts..."
cp v0-code5/scripts/*.sql scripts/db/ 2>/dev/null && success "  Copied SQL migrations"
find v0-code5/scripts -maxdepth 1 -name "*.js" -type f -exec cp {} scripts/db/ \; 2>/dev/null || true
find v0-code5/scripts -maxdepth 1 -name "*.ts" -type f -exec cp {} scripts/db/ \; 2>/dev/null || true
success "  Copied migration scripts"

# CLI scripts
[ -f "scripts/order-executor-cli.ts" ] && mv scripts/order-executor-cli.ts scripts/cli/
[ -f "scripts/arbitrage-sse-demo-poller.ts" ] && mv scripts/arbitrage-sse-demo-poller.ts scripts/cli/
[ -f "scripts/run-arbitrage-smoke.ts" ] && mv scripts/run-arbitrage-smoke.ts scripts/cli/
success "  Organized CLI scripts"

# Phase 5: Move configs
log "Phase 5: Moving configuration files..."
cp v0-code5/next.config.mjs . 2>/dev/null && success "  Copied next.config.mjs"
cp v0-code5/postcss.config.mjs . 2>/dev/null && success "  Copied postcss.config.mjs"
cp v0-code5/builder.config.json . 2>/dev/null && success "  Copied builder.config.json"
cp v0-code5/components.json . 2>/dev/null && success "  Copied components.json"
cp v0-code5/proxy.ts . 2>/dev/null && success "  Copied proxy.ts"
[ -f "v0-code5/sentry.client.config.ts" ] && cp v0-code5/sentry.*.config.ts . 2>/dev/null && success "  Copied sentry configs"

# Phase 6: Move documentation
log "Phase 6: Organizing documentation..."
cp v0-code5/*.md docs/ 2>/dev/null || true
success "  Documentation moved"

# Phase 7: Update package.json
log "Phase 7: Consolidating package.json..."
python3 << 'PYTHON_EOF'
import json

with open('/workspaces/blocksgate/v0-code5/package.json', 'r') as f:
    v0_pkg = json.load(f)

pkg = {
    "name": "blocksgate",
    "version": "0.1.0",
    "private": True,
    "scripts": {
        "dev": "next dev",
        "build": "next build",
        "start": "next start",
        "lint": "eslint .",
        "test": "vitest",
        "migrate": "node scripts/db/run-migrations.js",
        "migrate:ts": "ts-node --project tsconfig.json scripts/db/run-migrations.ts",
        "setup": "npm run migrate && npm run migrate:verify",
        "executor:demo": "ts-node -r tsconfig-paths/register scripts/cli/order-executor-cli.ts --demo",
        "executor:supabase": "ts-node -r tsconfig-paths/register scripts/cli/order-executor-cli.ts --supabase",
        "arbitrage:poll": "ts-node -r tsconfig-paths/register scripts/cli/arbitrage-sse-demo-poller.ts",
        "smoke:test": "ts-node -r tsconfig-paths/register scripts/cli/run-arbitrage-smoke.ts"
    },
    "dependencies": v0_pkg.get("dependencies", {}),
    "devDependencies": v0_pkg.get("devDependencies", {})
}

with open('/workspaces/blocksgate/package.json', 'w') as f:
    json.dump(pkg, f, indent=2)

print("✓ Package.json consolidated")
PYTHON_EOF
success "  package.json updated"

# Phase 8: Create tsconfig.json
log "Phase 8: Creating unified tsconfig.json..."
cat > tsconfig.json << 'TSCONFIG_EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "dom", "dom.iterable"],
    "jsx": "preserve",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@/app/*": ["src/app/*"],
      "@/lib/*": ["src/lib/*"],
      "@/components/*": ["src/components/*"],
      "@/hooks/*": ["src/hooks/*"],
      "@/types/*": ["src/types/*"],
      "@/styles/*": ["src/styles/*"]
    },
    "strict": true,
    "skipLibCheck": true,
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": ".next",
    "incremental": true,
    "isolatedModules": true,
    "noEmit": true
  },
  "include": ["src", "scripts", "next-env.d.ts"],
  "exclude": ["node_modules", ".next"]
}
TSCONFIG_EOF
success "  tsconfig.json created"

# Phase 9: Clean up
log "Phase 9: Cleaning up old files..."
rm -f tsconfig.check.json
rm -rf v0-code5
success "  Old files removed"

# Phase 10: Reinstall deps
log "Phase 10: Reinstalling dependencies..."
rm -rf node_modules package-lock.json 2>/dev/null || true
npm install > /tmp/npm-install.log 2>&1
success "  Dependencies installed"

# Phase 11: Verify
log "Phase 11: Verifying structure..."
for dir in "src/app" "src/lib" "src/components" "scripts/cli" "docs"; do
  [ -d "$dir" ] && success "  ✓ $dir" || error "  ✗ $dir missing"
done

# Phase 12: Commit
log "Phase 12: Committing changes..."
git add -A
git commit -m "feat: reorganize codebase

- Move application to src/ directory
- Consolidate package.json and tsconfig.json
- Organize scripts (cli/ and db/)
- Move documentation to docs/
- Remove v0-code5 directory
- Single lock file and node_modules" || warning "No changes to commit"

echo ""
echo "════════════════════════════════════════════════════════════════"
echo -e "${GREEN}✓ MIGRATION COMPLETE${NC}"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "Backup: $BACKUP_DIR"
echo "Log: $MIGRATION_LOG"
echo ""
echo "Next: npm run dev"
echo "════════════════════════════════════════════════════════════════"

