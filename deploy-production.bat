@echo off
echo ============================================
echo   MEDAURIN - Quick Production Deployment
echo ============================================
echo.

echo Step 1: Checking if Vercel CLI is installed...
where vercel >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [X] Vercel CLI not found!
    echo.
    echo Installing Vercel CLI...
    call npm install -g vercel
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to install Vercel CLI
        pause
        exit /b 1
    )
)
echo [OK] Vercel CLI ready!
echo.

echo Step 2: Deploying to Vercel...
echo.
echo IMPORTANT: You'll be prompted to:
echo 1. Link to existing project? NO (first time)
echo 2. Project name? medaurin
echo 3. Directory? ./ (just press Enter)
echo 4. Override settings? NO
echo.
pause

call vercel --prod

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Deployment failed!
    echo Please check the error above and try again.
    pause
    exit /b 1
)

echo.
echo ============================================
echo   DEPLOYMENT SUCCESSFUL!
echo ============================================
echo.
echo COPY YOUR PRODUCTION URL FROM ABOVE
echo It looks like: https://medaurin-xxx.vercel.app
echo.
echo.
echo Next Steps:
echo 1. Copy your URL
echo 2. Edit capacitor.config.json
echo 3. Replace "url" with your URL
echo 4. Run: npx cap sync android
echo 5. Run: npx cap open android
echo.
echo ============================================
pause
