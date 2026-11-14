@echo off
cd /d c:\Users\lenovo\Desktop\ProCollege\procollege-app
echo ========================================================
echo  ProCollege Cloudflare Worker Deployer
echo ========================================================
echo.
echo Step 1: Logging into Cloudflare Wrangler...
echo A browser window will open. Please click 'Allow'.
echo.
call npx.cmd wrangler login
if %ERRORLEVEL% EQU 0 (
    echo.
    echo [SUCCESS] Logged in to Cloudflare!
    echo.
    echo Step 2: Deploying updated ProCollege Worker...
    call npx.cmd wrangler deploy
    echo.
    echo ========================================================
    echo  DEPLOYMENT COMPLETE!
    echo ========================================================
    pause
) else (
    echo.
    echo [ERROR] Login failed or cancelled.
    pause
)
