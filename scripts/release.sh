#!/bin/bash
set -e

# Bump patch version in package.json
current=$(node -p "require('./package.json').version")
IFS='.' read -r major minor patch <<< "$current"
next="$major.$minor.$((patch + 1))"

node -e "
  const fs = require('fs');
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  pkg.version = '$next';
  fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
"

echo "Version $current → $next"

# Build .vsix into packages/
mkdir -p packages
printf 'y\ny\n' | npx @vscode/vsce package --no-dependencies --allow-missing-repository --out "packages/editor-lang-$next.vsix"

echo "Done: packages/editor-lang-$next.vsix"

# Keep only the 5 most recent previous versions + the new one (6 total)
vsix_files=($(ls -t packages/editor-lang-*.vsix 2>/dev/null))
to_delete=("${vsix_files[@]:6}")
for f in "${to_delete[@]}"; do
  rm "$f"
  echo "Removed: $f"
done
