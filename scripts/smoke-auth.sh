#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${ENCORE_BASE_URL:-}" ]]; then
  echo "ERROR: ENCORE_BASE_URL is required"
  echo "Example: https://staging-odontoflow-fiei.encr.app"
  exit 1
fi

if [[ -z "${CLERK_BEARER_TOKEN:-}" ]]; then
  echo "ERROR: CLERK_BEARER_TOKEN is required"
  echo "Provide a valid Clerk session JWT from a logged-in user."
  exit 1
fi

auth_tmp="$(mktemp)"
unauth_tmp="$(mktemp)"
trap 'rm -f "$auth_tmp" "$unauth_tmp"' EXIT

auth_status="$(curl -sS -o "$auth_tmp" -w "%{http_code}" \
  -H "Authorization: Bearer ${CLERK_BEARER_TOKEN}" \
  "${ENCORE_BASE_URL}/admin.getDashboardData")"

unauth_status="$(curl -sS -o "$unauth_tmp" -w "%{http_code}" \
  "${ENCORE_BASE_URL}/admin.getDashboardData")"

echo "Authenticated status: ${auth_status}"
echo "Unauthenticated status: ${unauth_status}"

if [[ "${auth_status}" != "200" ]]; then
  echo "ERROR: authenticated request failed"
  cat "$auth_tmp"
  exit 1
fi

if [[ "${unauth_status}" != "401" ]]; then
  echo "ERROR: unauthenticated request should return 401"
  cat "$unauth_tmp"
  exit 1
fi

echo "OK: smoke auth passed"
