@echo off
REM Start Firebase emulators for development

echo Starting Firebase Emulators...

REM Check if Firebase CLI is installed
firebase --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Firebase CLI not found. Please install it with: npm install -g firebase-tools
    exit /b 1
)

REM Start emulators with proper configuration
firebase emulators:start --only auth,functions,firestore --project cognitiveinsight-e5c40

echo Firebase emulators started successfully!
echo Functions available at: http://localhost:5002
echo Firestore UI available at: http://localhost:4000
echo Auth UI available at: http://localhost:9099
