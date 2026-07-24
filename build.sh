#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "Installing Node.js dependencies..."
npm install

echo "Building React frontend..."
npm run build

echo "Moving dist folder into backend directory..."
rm -rf backend/frontend_build
mv dist backend/frontend_build

echo "Installing Python dependencies..."
pip install -r backend/requirements.txt
