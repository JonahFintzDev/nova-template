#!/bin/bash
set -e

cd "$(dirname "$0")/api"

DATABASE_URL="postgresql://user:password@localhost:5321/runnova?schema=public" \
  npx prisma migrate dev --name "${1:-init}"
