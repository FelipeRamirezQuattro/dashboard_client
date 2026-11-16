#!/usr/bin/env bash
# UI rules guard: prints "file:line: rule" for each styling-rule violation and exits non-zero if any.
# Usage: scripts/check-ui-rules.sh [path ...]   (default: src)
# Scans only .ts, .tsx and .css files.
set -u

if [ "$#" -eq 0 ]; then set -- src; fi

PAL='(gray|slate|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|black|white)'
Q="[\"'\`]"

# Each rule is "name|regex". Names never contain '|'.
RULE_NAMES=(
  "palette class"
  "rounded- not tag/control/card"
  "shadow-"
  "osi-"
  "material-symbols"
  "legacy class"
  "legacy class card"
  "inline style color/background"
)
RULE_RES=(
  "(^|[^A-Za-z0-9_])(bg|text|border|ring|from|to|via|divide|fill|stroke)-${PAL}(-[0-9]+)?([^A-Za-z0-9_-]|$)"
  "rounded-($|[^tc]|t([^a]|$)|c([^oa]|$)|ta([^g]|$)|co([^n]|$)|ca([^r]|$))|rounded-(tag|control|card)[A-Za-z0-9_-]"
  "shadow-"
  "osi-"
  "material-symbols"
  "(btn-primary|btn-secondary|btn-outline|input-field|glass-card)"
  "(class(Name)?[=:]|cn\(|clsx\(|twMerge\().*(^|[ \"'\`{])card([ \"'\`}]|$)|\.card([^A-Za-z0-9_-]|$)"
  "style=\{\{[^}]*(color|background)"
)

# Hex colors: only when preceded by a quote, space, paren, colon, comma or line start, and not the
# value of an href/to/src/id/url/action attribute (anchors and URL fragments).
HEX='#[0-9a-fA-F]{3,8}\b'
LEAD="^([ \"'\`(:,]|#)"
ANCHOR="s/(href|to|src|id|url|action)=[{\"'\`]*#[0-9a-fA-F]+//g"

FILES=$(find "$@" -type f \( -name '*.ts' -o -name '*.tsx' -o -name '*.css' \) 2>/dev/null | sort)
[ -z "$FILES" ] && exit 0

OUT=$(mktemp)
trap 'rm -f "$OUT"' EXIT

while IFS= read -r f; do
  for i in "${!RULE_NAMES[@]}"; do
    grep -nE -- "${RULE_RES[$i]}" "$f" | while IFS= read -r hit; do
      printf '%s:%s: %s\n' "$f" "${hit%%:*}" "${RULE_NAMES[$i]}"
    done >> "$OUT"
  done

  grep -nE -- "$HEX" "$f" | while IFS= read -r hit; do
    body=$(printf '%s\n' "${hit#*:}" | sed -E "$ANCHOR")
    if printf '%s\n' "$body" | grep -oE "(^|.)$HEX" | grep -qE "$LEAD"; then
      printf '%s:%s: hex color\n' "$f" "${hit%%:*}" >> "$OUT"
    fi
  done
done <<< "$FILES"

if [ -s "$OUT" ]; then
  sort -t: -k1,1 -k2,2n -k3 -u "$OUT"
  exit 1
fi
exit 0
