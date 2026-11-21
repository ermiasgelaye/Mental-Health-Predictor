#!/bin/sh
# Copy the shared design system from the portfolio repo (ermiasgelaye.github.io) so this project
# looks and behaves exactly like the portfolio's other project pages.
# Run after changing the portfolio's shared CSS/JS:   sh tools/sync_design.sh [path-to-portfolio]
set -e
SRC="${1:-$(dirname "$0")/../../ermiasgelaye.github.io}"
DEST="$(dirname "$0")/../assets"
[ -f "$SRC/assets/css/site.css" ] || { echo "Portfolio repo not found at $SRC" >&2; exit 1; }
mkdir -p "$DEST/css" "$DEST/js/knowledge" "$DEST/shared/chat" "$DEST/img"
cp "$SRC/assets/css/site.css" "$SRC/assets/css/project.css" "$DEST/css/"
cp "$SRC/assets/js/project.js" "$SRC/assets/js/data-table.js" "$DEST/js/"
cp "$SRC/assets/js/knowledge/data-science.js" "$DEST/js/knowledge/"
cp "$SRC/assets/shared/chat/chat.css" "$SRC/assets/shared/chat/engine.js" "$SRC/assets/shared/chat/ui.js" "$DEST/shared/chat/"
cp "$SRC/Images/optimized/favicon-64.png" "$DEST/img/favicon-64.png"
echo "Design system synced from $SRC"
