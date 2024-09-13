@echo off
setlocal

rem Define Folder Structure
set "main_folder=Insurance Business Services"
set "sub_folder=Configuration"
set "json_file=%sub_folder%\databaseConfig.json"
set "backup_folder=Backups"

rem Ensure main folder and subfolders exist
if not exist "%main_folder%" mkdir "%main_folder%"
if not exist "%sub_folder%" mkdir "%sub_folder%"
if not exist "%backup_folder%" mkdir "%backup_folder%"

rem Define the log file for logging the output, save it inside the main folder
set "log_file=%main_folder%\script_log.txt"

rem Append to log file and include the date and time of execution
(
    echo.
    echo ======================
    echo Script started at %date% %time%
    echo ======================
) >> "%log_file%"

rem Display the fancy ASCII message (modified to ensure proper rendering in batch)
echo.
echo +-------------------------------------+
echo |      ▪   ▐ ▄ .▄▄ · ▄• ▄▌▄▄▄        |
echo |      ██ •█▌▐█▐█ ▀. █▪██▌▀▄ █·     |
echo |      ▐█·▐█▐▐▌▄▀▀▀█▄█▌▐█▌▐▀▀▄      |
echo |      ▐█▌██▐█▌▐█▄▪▐█▐█▄█▌▐█•█▌     |
echo |      ▀▀▀▀▀ █▪ ▀▀▀▀  ▀▀▀ .▀  ▀     |
echo +-------------------------------------+
echo.

echo This script will perform the following actions:
echo 1. Create necessary folders for the Insurance Business Services project.
echo 2. Write a JSON configuration file if it does not exist.
echo 3. Clone or update the selected development repositories.
echo.

rem Prompt user for confirmation
set /p confirmation="Do you want to continue? (yes/no): "
echo User Confirmation: %confirmation% >> "%log_file%"

rem Convert user input to lowercase for consistent comparison
set "confirmation=%confirmation:~0,3%"
if /i not "%confirmation%"=="yes" (
    echo Exiting script without making any changes.
    echo Script exited by user on %date% %time% >> "%log_file%"
    exit /b 0
)

rem Define Git Locations
set "pat=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"
set "Archer=https://%pat%@github.com/VAINS-Dev/A.R.C.H.E.R.git"
set "Lipas_client=https://%pat%@github.com/VAINS-Dev/LIPAS-Client.git"
set "Lipas_core=https://%pat%@github.com/VAINS-Dev/VBA-Insurance-Core.git"
set "Lipas_api=https://%pat%@github.com/VAINS-Dev/VBA-Insurance-API.git"

rem Write JSON data to the file ONLY if it doesn't exist
if not exist "%json_file%" (
    echo { >> "%json_file%"
    echo   "DatabaseConfiguration": { >> "%json_file%"
    echo     "DB_HOST": "host_value", >> "%json_file%"
    echo     "DB_USERNAME": "username_value", >> "%json_file%"
    echo     "DB_PASSWORD": "password_value", >> "%json_file%"
    echo     "DB_DATABASE": "database_value", >> "%json_file%"
    echo     "DB_INTEGRATED_SECURITY": true, >> "%json_file%"
    echo     "DB_TRUSTCONNECTION": true, >> "%json_file%"
    echo     "DB_TRUST_SERVER_CERTIFICATE": true, >> "%json_file%"
    echo     "DB_ENCRYPT": true, >> "%json_file%"
    echo     "DB_CONNECTION_TIMEOUT": 30000, >> "%json_file%"
    echo     "DB_DRIVER": "msnodesqlv8" >> "%json_file%"
    echo   } >> "%json_file%"
    echo } >> "%json_file%"
    echo Created JSON file: %json_file% >> "%log_file%"
) else (
    echo JSON file already exists: %json_file% >> "%log_file%"
)

rem Present the repository selection menu
echo.
echo Which repositories do you want to clone or update?
echo.

rem Get update decision for each repository
set /p update_archer="Update ARCHER repository? (yes/no): "
set /p update_lipas_client="Update LIPAS-Client repository? (yes/no): "
set /p update_lipas_core="Update VBA LIPAS Core repository? (yes/no): "
set /p update_lipas_api="Update VBA-Insurance API repository? (yes/no): "

rem Branch input logic, if user chose yes
if /i "%update_archer%"=="yes" (
    set /p branch_archer="Enter branch for ARCHER (default: development): "
    if "%branch_archer%"=="" set "branch_archer=development"
) else (
    set "branch_archer=skipped"
)

if /i "%update_lipas_client%"=="yes" (
    set /p branch_lipas_client="Enter branch for LIPAS-Client (default: development): "
    if "%branch_lipas_client%"=="" set "branch_lipas_client=development"
) else (
    set "branch_lipas_client=skipped"
)

if /i "%update_lipas_core%"=="yes" (
    set /p branch_lipas_core="Enter branch for VBA LIPAS Core (default: development): "
    if "%branch_lipas_core%"=="" set "branch_lipas_core=development"
) else (
    set "branch_lipas_core=skipped"
)

if /i "%update_lipas_api%"=="yes" (
    set /p branch_lipas_api="Enter branch for VBA-Insurance API (default: development): "
    if "%branch_lipas_api%"=="" set "branch_lipas_api=development"
) else (
    set "branch_lipas_api=skipped"
)

rem Log the user's selections and branch information
echo User selected ARCHER update: %update_archer%, Branch: %branch_archer% >> "%log_file%"
echo User selected LIPAS-Client update: %update_lipas_client%, Branch: %branch_lipas_client% >> "%log_file%"
echo User selected VBA LIPAS Core update: %update_lipas_core%, Branch: %branch_lipas_core% >> "%log_file%"
echo User selected VBA-Insurance API update: %update_lipas_api%, Branch: %branch_lipas_api% >> "%log_file%"

rem Function to clone or pull a repository
:CLONE_OR_PULL
if not exist "%~2\.git" (
    echo Cloning repository into %~2%...
    git clone --progress --branch %~3% %~1% %~2%
) else (
    echo Pulling latest changes for %~2%...
    cd /d "%~2%"
    git pull --progress origin %~3%
    cd ..
)

rem Summary of updates
set "summary="

if /i "%update_archer%"=="yes" (
    call :CLONE_OR_PULL %Archer% "A.R.C.H.E.R" "%branch_archer%"
    set "summary=%summary%ARCHER: Updated\n"
) else (
    set "summary=%summary%ARCHER: Skipped\n"
)

if /i "%update_lipas_client%"=="yes" (
    call :CLONE_OR_PULL %Lipas_client% "LIPAS-Client" "%branch_lipas_client%"
    set "summary=%summary%LIPAS-Client: Updated\n"
) else (
    set "summary=%summary%LIPAS-Client: Skipped\n"
)

if /i "%update_lipas_core%"=="yes" (
    call :CLONE_OR_PULL %Lipas_core% "VBA-Insurance-Core" "%branch_lipas_core%"
    set "summary=%summary%VBA LIPAS Core: Updated\n"
) else (
    set "summary=%summary%VBA LIPAS Core: Skipped\n"
)

if /i "%update_lipas_api%"=="yes" (
    call :CLONE_OR_PULL %Lipas_api% "VBA-Insurance-API" "%branch_lipas_api%"
    set "summary=%summary%VBA-Insurance API: Updated\n"
) else (
    set "summary=%summary%VBA-Insurance API: Skipped\n"
)

rem Display summary
echo Summary of actions:
echo %summary%
echo %summary% >> "%log_file%"

endlocal
exit /b 0