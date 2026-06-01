#!/bin/sh
set -e

# deploy prisma schema
npx prisma db push

# start dev server
npm run dev
