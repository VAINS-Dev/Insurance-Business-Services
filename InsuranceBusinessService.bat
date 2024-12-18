@echo off
setlocal EnableDelayedExpansion
set "GIT_PULL_CMD=git fetch --all & git reset --hard origin/!branch!"
set "app_version=1.0.5"

:: Define log file
set "log_file=script_log.txt"

:: Start script log
echo [%date% %time%] Script started >> "%log_file%"

:: Welcome message
powershell -Command "Write-Host 'Welcome to Insurance Business Services!' -ForegroundColor Green"
echo.
powershell -Command "Write-Host 'Version: %app_version%' -ForegroundColor Green"
echo Author: VAINS-Dev
echo Description: This loader will download and update repositories for the Insurance Business Services project.
echo.
echo Version Changes:
powershell -Command "Write-Host '1.0.5 - Added support for updating the documentation repository.' -ForegroundColor Green"
powershell -Command "Write-Host '1.0.6 - Modified pull to force. Overriding local changes.' -ForegroundColor Green"

:: Check app version
set "script_url=https://raw.githubusercontent.com/VAINS-Dev/Insurance-Business-Services/main/InsuranceBusinessService.bat"
set "temp_script=%TEMP%\InsuranceBusinessService_new.bat"

:: Download the latest script with retry logic
set "max_retries=3"
set "retry_count=0"
:download_script
powershell -Command ^
    "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; " ^
    "try { " ^
    "  (New-Object Net.WebClient).DownloadFile('%script_url%', '%temp_script%'); " ^
    "  exit 0; " ^
    "} catch { " ^
    "  Write-Host 'Download failed. Retrying...'; " ^
    "  exit 1; " ^
    "}"
if %ERRORLEVEL% NEQ 0 (
    set /A retry_count+=1
    if %retry_count% LSS %max_retries% (
        timeout /t 5 /nobreak >nul
        goto download_script
    ) else (
        echo Failed to download the latest script after %max_retries% attempts. Exiting...
        echo [%date% %time%] Failed to download the latest script after %max_retries% attempts. >> "%log_file%"
        exit /b
    )
)

:: Compare the current script to the downloaded script
fc "%~f0" "%temp_script%" >nul
if %ERRORLEVEL% NEQ 0 (
    echo A newer version of this loader is available. Updating...
    timeout /t 5 /nobreak >nul
    copy /y "%temp_script%" "%~f0"
    del "%temp_script%"
    start "" "%~f0" %*
    exit /b
) else (
    del "%temp_script%"
)

:: Clone or update the documentation repository
set "doc_repo_url=https://github.com/VAINS-Dev/Insurance-Business-Services-Documentation.git"
set "doc_repo_folder=Insurance-Business-Services-Documentation"

if not exist "%doc_repo_folder%" (
    echo Cloning documentation repository...
    git clone "%doc_repo_url%" "%doc_repo_folder%"
    if %ERRORLEVEL% NEQ 0 (
        echo Error cloning documentation repository. Exiting...
        echo [%date% %time%] Error cloning documentation repository. >> "%log_file%"
        exit /b
    )
) else (
    echo Updating documentation repository...
    pushd "%doc_repo_folder%"
    git pull origin main
    if %ERRORLEVEL% NEQ 0 (
        echo Error updating documentation repository. Exiting...
        echo [%date% %time%] Error updating documentation repository. >> "..\%log_file%"
        popd
        exit /b
    )
    popd
)

:: Create 'Configuration' folder if it doesn't exist
if not exist "Configuration" (
    mkdir "Configuration"
    echo [%date% %time%] Created 'Configuration' folder. >> "%log_file%"
)

:: Check if 'databaseConfig.json' exists
if exist "Configuration\databaseConfig.json" (
    set /p "view_config=Configuration file exists. Would you like to view the configuration? (y/n): "
    if /I "%view_config%"=="y" (
        echo.
        echo Current Configuration:
        powershell -Command "Get-Content 'Configuration\databaseConfig.json' | ConvertFrom-Json | ConvertTo-Json -Depth 10 | Write-Host"
        echo.
        set /p "edit_config=Would you like to edit the configuration? (y/n): "
        if /I "%edit_config%"=="y" (
            powershell -Command ^
            "$config = Get-Content 'Configuration\databaseConfig.json' | ConvertFrom-Json;" ^
            "foreach ($key in $config.DatabaseConfiguration.PSObject.Properties.Name) {" ^
            "  $currentValue = $config.DatabaseConfiguration.$key;" ^
            "  Write-Host 'Current value for' $key ':' $currentValue;" ^
            "  $newValue = Read-Host 'Enter new value for' $key ' (leave blank to keep current value):';" ^
            "  if ($newValue -ne '') { $config.DatabaseConfiguration.$key = $newValue }" ^
            "}" ^
            "$config | ConvertTo-Json -Depth 10 | Set-Content 'Configuration\databaseConfig.json';"
        )
    )
    echo Proceeding to verify PAT...
) else (
    echo Configuration file does not exist. Creating new configuration...
    (
        echo {
        echo   "DatabaseConfiguration": {
        echo     "DB_HOST": "host_value",
        echo     "DB_USERNAME": "username_value",
        echo     "DB_PASSWORD": "password_value",
        echo     "DB_DATABASE": "database_value",
        echo     "DB_INTEGRATED_SECURITY": true,
        echo     "DB_TRUSTCONNECTION": true,
        echo     "DB_TRUST_SERVER_CERTIFICATE": true,
        echo     "DB_ENCRYPT": true,
        echo     "DB_CONNECTION_TIMEOUT": 30000,
        echo     "DB_DRIVER": "msnodesqlv8"
        echo   }
        echo }
    ) > "Configuration\databaseConfig.json"
    echo [%date% %time%] Created 'databaseConfig.json' file. >> "%log_file%"

    powershell -Command ^
    "$config = Get-Content 'Configuration\databaseConfig.json' | ConvertFrom-Json;" ^
    "foreach ($key in $config.DatabaseConfiguration.PSObject.Properties.Name) {" ^
    "  $value = Read-Host 'Enter value for' $key ':';" ^
    "  if ($value -ne '') { $config.DatabaseConfiguration.$key = $value }" ^
    "}" ^
    "$config | ConvertTo-Json -Depth 10 | Set-Content 'Configuration\databaseConfig.json';"
)

:: Verify Git, PowerShell, and Node.js are installed
git --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Git is not installed or not in your PATH. Please install Git to continue.
    echo [%date% %time%] Git not found. Exiting. >> "%log_file%"
    pause
    exit /b
)
powershell -Command "exit" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo PowerShell is not installed or not in your PATH. Please install PowerShell to continue.
    echo [%date% %time%] PowerShell not found. Exiting. >> "%log_file%"
    pause
    exit /b
)
node -v >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Node.js is not installed or not in your PATH. Please install Node.js to continue.
    echo [%date% %time%] Node.js not found. Exiting. >> "%log_file%"
    pause
    exit /b
)

:: Prompt for GitHub Personal Access Token (PAT)
:prompt_pat
set /p "PAT=Please enter your GitHub Personal Access Token (PAT): "

:: Ensure PAT is not empty
if "%PAT%"=="" (
    echo No PAT entered. Please enter a valid PAT.
    echo [%date% %time%] No PAT entered. >> "%log_file%"
    goto prompt_pat
)

:: Log PAT entry (do not log the actual PAT)
echo [%date% %time%] PAT entered by user. >> "%log_file%"

:: Verify PAT by attempting to access the Git API
echo Verifying PAT...
curl -s -H "Authorization: token %PAT%" https://api.github.com/user > "%TEMP%\pat_verification.txt"
findstr /C:"\"message\": \"Bad credentials\"" "%TEMP%\pat_verification.txt" >nul
if %ERRORLEVEL% EQU 0 (
    echo Invalid PAT or network error. Please try again.
    echo [%date% %time%] Invalid PAT entered. >> "%log_file%"
    del "%TEMP%\pat_verification.txt"
    set PAT=
    goto prompt_pat
)
del "%TEMP%\pat_verification.txt"
echo PAT verified successfully.
echo [%date% %time%] PAT verified successfully. >> "%log_file%"

:: Create Repo-Backup directory if it doesn't exist
if not exist "Repo-Backup" (
    mkdir "Repo-Backup"
    echo [%date% %time%] Created Repo-Backup directory. >> "%log_file%"
)

:: Define repositories
set "repos[1]=ARCHER|A.R.C.H.E.R|https://github.com/VAINS-Dev/A.R.C.H.E.R.git"
set "repos[2]=LIPAS-Client|LIPAS-Client|https://github.com/VAINS-Dev/LIPAS-Client.git"
set "repos[3]=VBA-Insurance-Core|VBA-Insurance-Core|https://github.com/VAINS-Dev/VBA-Insurance-Core.git"
set "repos[4]=Insurance-Business-Services-Database|Insurance-Business-Services-Database|https://github.com/VAINS-Dev/Insurance-Business-Services-Database.git"

:: Count the number of repositories
set "repo_count=0"
for /F "tokens=1 delims==" %%A in ('set repos[') do (
    set /A repo_count+=1
)

:: Loop through repositories
for /L %%i in (1,1,!repo_count!) do (
    call :process_repo "!repos[%%i]!"
)

:: Clean up temporary files and variables
set PAT=
echo [%date% %time%] Script completed. >> "%log_file%"
echo Process completed!
pause
exit /b

:process_repo
:: Extract repository information
set "repo_info=%~1"
for /F "tokens=1,2,3 delims=|" %%A in ("%repo_info%") do (
    set "repo_display_name=%%A"
    set "repo_folder_name=%%B"
    set "repo_url=%%C"
)

echo.
echo Processing repository: !repo_display_name!
echo [%date% %time%] Processing repository: !repo_display_name! >> "%log_file%"

:: Prompt to download repository
set /p "download=Would you like to download !repo_display_name! repository? (y/n): "
echo [%date% %time%] User input for !repo_display_name! download: !download! >> "%log_file%"

if /I "!download!"=="y" (
    :: Prompt for branch
    set /p "branch=What branch of !repo_display_name! would you like to download? (Default: development): "
    if "!branch!"=="" set "branch=development"
    echo [%date% %time%] User selected branch: !branch! for !repo_display_name! >> "%log_file%"

    :: Backup existing repository if it exists
    if exist "!repo_folder_name!" (
        echo Backing up existing !repo_display_name! repository...
        echo [%date% %time%] Backing up !repo_display_name!. >> "%log_file%"
        powershell -Command "Start-Sleep -s 1; Compress-Archive -Path '!repo_folder_name!\*' -DestinationPath 'Repo-Backup\!repo_folder_name!-!date:/=-!-!time::=-!.zip'; Start-Sleep -s 1" >nul 2>&1
        echo [%date% %time%] Backup created for !repo_display_name!. >> "%log_file%"
    )

    :: Clone or Pull repository
    if not exist "!repo_folder_name!\.git" (
        :: Clone repository
        echo Cloning !repo_display_name! repository...
        echo [%date% %time%] Cloning !repo_display_name! repository. >> "%log_file%"

        :: Set up authentication for Git
        set GIT_ASKPASS=%ASKPASS_SCRIPT%
        set GIT_TERMINAL_PROMPT=0

        git clone --progress --branch "!branch!" "!repo_url!" "!repo_folder_name!"
        if !ERRORLEVEL! NEQ 0 (
            echo Error cloning !repo_display_name!. Check log for details.
            echo [%date% %time%] Error cloning !repo_display_name!. >> "%log_file%"
            pause
            goto :eof
        ) else (
            echo [%date% %time%] Successfully cloned !repo_display_name!. >> "%log_file%"
        )
    ) else (
        :: Pull repository
        echo Pulling latest changes for !repo_display_name! repository...
        echo [%date% %time%] Pulling latest changes for !repo_display_name!. >> "%log_file%"

        pushd "!repo_folder_name!"

        :: Set up authentication for Git
        set GIT_ASKPASS=%ASKPASS_SCRIPT%
        set GIT_TERMINAL_PROMPT=0

        git fetch --all
        git reset --hard origin/!branch!
        git clean -fd
        if !ERRORLEVEL! NEQ 0 (
            echo Error pulling !repo_display_name!. Check log for details.
            echo [%date% %time%] Error pulling !repo_display_name!. >> "..\%log_file%"
            popd
            pause
            goto :eof
        ) else (
            echo [%date% %time%] Successfully pulled !repo_display_name!. >> "..\%log_file%"
            popd
        )
    )

    :: Prompt to update dependencies
    set /p "update_deps=Would you like to update dependencies for !repo_display_name!? (y/n): "
    echo [%date% %time%] User input for updating dependencies of !repo_display_name!: !update_deps! >> "%log_file%"

    if /I "!update_deps!"=="y" (
        echo Updating dependencies for !repo_display_name!...
        echo [%date% %time%] Updating dependencies for !repo_display_name!. >> "%log_file%"

        pushd "!repo_folder_name!"
        :: Execute npm install
        npm install
        if !ERRORLEVEL! NEQ 0 (
            echo Error updating dependencies for !repo_display_name!. Check for issues.
            echo [%date% %time%] Error updating dependencies for !repo_display_name!. >> "..\%log_file%"
            popd
            pause
            goto :eof
        ) else (
            echo [%date% %time%] Successfully updated dependencies for !repo_display_name!. >> "..\%log_file%"
            popd
        )
    ) else (
        echo Skipping dependency update for !repo_display_name!.
        echo [%date% %time%] Skipped dependency update for !repo_display_name!. >> "%log_file%"
    )

) else (
    echo Skipping !repo_display_name! repository.
    echo [%date% %time%] Skipped !repo_display_name!. >> "%log_file%"
)

goto :eof
