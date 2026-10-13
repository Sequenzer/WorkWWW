#!/usr/bin/env bash
set -euo pipefail

# Check if index.html exists in the current directory
if [[ ! -f index.html ]]; then
  echo "index.html not found in the current directory."
  exit 1
fi

echo "==> Hosting index.html on http://localhost:8000 ..."
echo "Press Ctrl+C to stop the server."

# Start a simple HTTP server in the current directory
python3 -m http.server 8000

