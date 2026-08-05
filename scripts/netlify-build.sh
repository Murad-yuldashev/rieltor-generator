#!/usr/bin/env bash
#
# Netlify build. Same order as the Dockerfile, with one extra step at the end: the SPA
# bundle and the seed-generated images are collected into a single publish directory,
# because on Netlify the CDN serves them instead of Express' useStaticAssets().
#
# Requires DATABASE_URL, SEED_AGENT_TEL and SEED_AGENT_TG in the build environment.
set -euo pipefail

PUBLISH_DIR="netlify/publish"

yarn workspace @rieltor/api exec prisma generate
yarn workspace @rieltor/shared build
yarn workspace @rieltor/web build
yarn workspace @rieltor/api build

# The Docker image runs these on every container boot. A function has no boot, so the
# schema and the seed rows have to be in place before the first request arrives — and
# the seed is also what writes apps/api/public/images, copied below.
yarn workspace @rieltor/api migrate:deploy
yarn workspace @rieltor/api seed

rm -rf "$PUBLISH_DIR"
mkdir -p "$PUBLISH_DIR"
cp -R apps/web/dist/. "$PUBLISH_DIR"/
cp -R apps/api/public/. "$PUBLISH_DIR"/
