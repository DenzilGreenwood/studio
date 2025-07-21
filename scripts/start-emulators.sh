#!/bin/bash

# Start Firebase emulators for development
echo "Starting Firebase Emulators..."

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "Firebase CLI not found. Please install it with: npm install -g firebase-tools"
    exit 1
fi

# Check if logged in
if ! firebase projects:list &> /dev/null; then
    echo "Not logged into Firebase. Please run: firebase login"
    exit 1
fi

# Start emulators with proper configuration
firebase emulators:start --only auth,functions,firestore --project cognitiveinsight-e5c40

echo "Firebase emulators started successfully!"
echo "Functions available at: http://localhost:5002"
echo "Firestore UI available at: http://localhost:4000"
echo "Auth UI available at: http://localhost:9099"
