#!/usr/bin/env bash
# One-time Cloudflare setup for a site's inquiry form (safe to re-run):
# Email Routing on the domain (adds MX + SPF records), and the owner's inbox as
# a verified destination (Cloudflare emails it a link to click).
#   setup.sh <domain> <destination-email>       e.g. setup.sh flynoam.com owner@gmail.com
# Needs wrangler logged in to the account that holds the domain (`npx wrangler login`).
set -euo pipefail
[[ $# -eq 2 ]] || { echo "usage: $0 <domain> <destination-email>" >&2; exit 2; }
domain=$1 to=$2
w() { npx --yes wrangler "$@" 2>&1 | grep -v '^npm \|open beta\|^\s*$\|⛅️\|───'; }

if w email routing settings "$domain" | grep -q 'Enabled: *true'; then
  echo "Email Routing: already on for $domain"
else
  w email routing enable "$domain"
fi

if w email routing addresses list | grep -q " $to "; then
  echo "Destination $to: already added"
else
  w email routing addresses create "$to"
fi
w email routing addresses list | grep " $to " || true
echo "If it says pending: click the link Cloudflare emailed to $to, then deploy."
