#!/usr/bin/env bash
# Smoke test post-deploy ES Academy.
#
# Lance des requetes HEAD/GET sur les routes critiques et verifie
# le status HTTP + la presence d'elements cles dans le HTML.
# Exit 0 si tout passe, 1 si un test fail.
#
# Usage :
#   ./scripts/smoke-test.sh                          # contre localhost:3000
#   BASE_URL=https://emeline-siron.fr ./scripts/smoke-test.sh    # contre prod
#   BASE_URL=https://deploy-preview-X--site.netlify.app ./scripts/smoke-test.sh    # preview Netlify
#
# Pas de dependance externe : bash + curl + grep.

set -u

BASE_URL="${BASE_URL:-http://localhost:3000}"
RED=$'\033[0;31m'
GREEN=$'\033[0;32m'
YELLOW=$'\033[0;33m'
RESET=$'\033[0m'

PASS=0
FAIL=0

# Test status HTTP. Args : URL relative, status attendu (defaut 200), method (defaut GET).
check_status() {
  local path="$1"
  local expected="${2:-200}"
  local method="${3:-GET}"
  local actual
  actual=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "${BASE_URL}${path}")
  if [ "$actual" = "$expected" ]; then
    printf "%s✓%s [%s %s] %-46s %s\n" "$GREEN" "$RESET" "$method" "$actual" "$path" "OK"
    PASS=$((PASS + 1))
  else
    printf "%s✗%s [%s %s] %-46s %s(attendu %s)%s\n" "$RED" "$RESET" "$method" "$actual" "$path" "$RED" "$expected" "$RESET"
    FAIL=$((FAIL + 1))
  fi
}

# Verifie qu'une route est BIEN PROTEGEE : refuse l'acces (401, 403 ou 500).
# 500 est accepte parce qu'un cron sans CRON_SECRET configure rejette aussi
# (defensive : on prefere 500 a un pass non protege).
check_protected() {
  local path="$1"
  local method="${2:-POST}"
  local actual
  actual=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "${BASE_URL}${path}")
  case "$actual" in
    401|403|500)
      printf "%s✓%s [%s %s] %-46s %s\n" "$GREEN" "$RESET" "$method" "$actual" "$path" "protected"
      PASS=$((PASS + 1))
      ;;
    *)
      printf "%s✗%s [%s %s] %-46s %sattendu 401/403/500%s\n" "$RED" "$RESET" "$method" "$actual" "$path" "$RED" "$RESET"
      FAIL=$((FAIL + 1))
      ;;
  esac
}

# Test presence d'un marker dans le HTML. Args : URL relative, regex, label.
check_contains() {
  local path="$1"
  local marker="$2"
  local label="$3"
  local body
  body=$(curl -s "${BASE_URL}${path}")
  if echo "$body" | grep -qE "$marker"; then
    printf "%s✓%s      %-50s %s\n" "$GREEN" "$RESET" "$path" "$label OK"
    PASS=$((PASS + 1))
  else
    printf "%s✗%s      %-50s %s%s manquant%s\n" "$RED" "$RESET" "$path" "$RED" "$label" "$RESET"
    FAIL=$((FAIL + 1))
  fi
}

echo ""
echo "Smoke test ES Academy contre ${YELLOW}${BASE_URL}${RESET}"
echo "==========================================================="

echo ""
echo "Routes publiques :"
check_status "/" 200
check_status "/academy" 200
check_status "/cahier-preview" 200
check_status "/family" 200
check_status "/connexion" 200
check_status "/blog" 200
check_status "/podcast" 200
check_status "/quiz-investisseur" 200
check_status "/masterclass" 200
check_status "/a-propos" 200
check_status "/mentions-legales" 200

echo ""
echo "SEO :"
check_status "/robots.txt" 200
check_status "/sitemap.xml" 200
check_contains "/" "og:title" "Meta og:title"
check_contains "/cahier-preview" "og:image" "Meta og:image"

echo ""
echo "API publiques (sanity) :"
# Le webhook Stripe doit refuser un POST sans signature (400 = signature invalide)
check_status "/api/stripe/webhook" 400 POST
# Forms publics : GET pas accepte
check_status "/api/forms/cahier-vacances/submit" 405 GET

echo ""
echo "API protegees (verifie auth) :"
check_protected "/api/admin/eleves" GET
check_protected "/api/cron/process-sequences" POST
check_protected "/api/cron/chatel-reminders" POST
check_protected "/api/cron/retry-academy-welcome-mail" POST

echo ""
echo "==========================================================="
TOTAL=$((PASS + FAIL))
if [ $FAIL -eq 0 ]; then
  printf "%sTous les tests OK : %d/%d%s\n" "$GREEN" "$PASS" "$TOTAL" "$RESET"
  exit 0
else
  printf "%s%d/%d tests ECHOUES%s (passed: %d)\n" "$RED" "$FAIL" "$TOTAL" "$RESET" "$PASS"
  exit 1
fi
