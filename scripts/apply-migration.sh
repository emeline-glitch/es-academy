#!/usr/bin/env bash
# Applique une migration SQL sur Supabase via la Management API
# Usage : scripts/apply-migration.sh supabase/migrations/00X_xxx.sql

set -e

if [ -z "$1" ]; then
  echo "Usage: $0 <path/to/migration.sql>"
  exit 1
fi

MIGRATION_FILE="$1"

if [ ! -f "$MIGRATION_FILE" ]; then
  echo "❌ Fichier introuvable : $MIGRATION_FILE"
  exit 1
fi

# Charger .env.local
if [ -f .env.local ]; then
  export $(grep -E "^(SUPABASE_ACCESS_TOKEN|SUPABASE_PROJECT_REF)=" .env.local | xargs)
fi

if [ -z "$SUPABASE_ACCESS_TOKEN" ] || [ -z "$SUPABASE_PROJECT_REF" ]; then
  echo "❌ SUPABASE_ACCESS_TOKEN ou SUPABASE_PROJECT_REF manquant dans .env.local"
  exit 1
fi

echo "→ Application de $MIGRATION_FILE sur $SUPABASE_PROJECT_REF..."

python3 << PYEOF
import json, os, urllib.request, sys
pat = os.environ['SUPABASE_ACCESS_TOKEN']
ref = os.environ['SUPABASE_PROJECT_REF']
with open("$MIGRATION_FILE") as f:
    sql = f.read()

req = urllib.request.Request(
    f"https://api.supabase.com/v1/projects/{ref}/database/query",
    data=json.dumps({"query": sql}).encode(),
    headers={
        "Authorization": f"Bearer {pat}",
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "claude-apply-migration/1.0",
    },
    method="POST",
)
try:
    with urllib.request.urlopen(req, timeout=120) as resp:
        print(f"✅ HTTP {resp.status}")
        body = resp.read().decode()
        if body and body != "[]":
            print(body[:500])
except urllib.error.HTTPError as e:
    print(f"❌ HTTP {e.code}")
    print(e.read().decode()[:1000])
    sys.exit(1)
PYEOF
