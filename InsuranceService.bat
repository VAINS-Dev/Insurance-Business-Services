@echo off
setlocal

rem Prompt for GitHub Personal Authentication Token
set /p "pat=Please enter GitHub Personal Authentication Token: "
echo.

rem Validate the PAT using GitHub API
echo Validating the GitHub Personal Access Token...

curl -s -o nul -w "%%{http_code}" -H "Authorization: token %pat%" https://api.github.com/user > status.txt

set /p status=<status.txt

if "%status%"=="200" (
    echo Token is valid.
) else (
    echo Error: Invalid GitHub Personal Access Token. Please try again.
    del status.txt
    exit /b 1
)

rem Cleanup status file
del status.txt

rem Define Folder Structure
set "main_folder=Insurance Business Services"
set "sub_folder=Configuration"
set "json_file=%sub_folder%\databaseConfig.json"
set "backup_folder=Backups"

rem Ensure main folder and subfolders exist
if not exist "%sub_folder%" mkdir "%sub_folder%"
if not exist "%backup_folder%" mkdir "%backup_folder%"

rem Define the log file for logging the output, save it inside the main folder
set "log_file=script_log.txt"

rem Append to log file and include the date and time of execution
(
    echo.
    echo ======================
    echo Script started at %date% %time%
    echo ======================
) >> "%log_file%"

echo ===========================================
echo 	Insurance Business Services
echo ===========================================
echo.
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

rem Function to validate user input for yes/no questions
:GET_VALID_INPUT
set /p answer="%~1 (yes/no): "
set "answer=%answer:~0,3%"
if /i "%answer%"=="yes" (
    set "result=yes"
    goto :END_VALID_INPUT
) else if /i "%answer%"=="no" (
    set "result=no"
    goto :END_VALID_INPUT
) else (
    echo Please answer yes or no.
    goto GET_VALID_INPUT
)
:END_VALID_INPUT
exit /b 0

rem Function to get the branch from the user
:GET_BRANCH_INPUT
set /p branch="%~1 (default: development): "
if "%branch%"=="" (
    set "branch=development"
)
exit /b 0

rem Function to backup a repository before making changes
:BACKUP_REPOSITORY
if exist "%~1" (
    echo Backing up repository %~1...
    set "backup_name=%backup_folder%\%~2_backup_%date:~10,4%%date:~4,2%%date:~7,2%_%time:~0,2%%time:~3,2%%time:~6,2%.zip"
    powershell Compress-Archive -Path "%~1" -DestinationPath "%backup_name%"
)
exit /b 0

rem Define Git Locations with the inputted PAT
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
echo Which repositories do you want to clone or update?

call :GET_VALID_INPUT "Update ARCHER repository?"
set "update_archer=%result%"
call :GET_VALID_INPUT "Update LIPAS-Client repository?"
set "update_lipas_client=%result%"
call :GET_VALID_INPUT "Update VBA LIPAS Core repository?"
set "update_lipas_core=%result%"
call :GET_VALID_INPUT "Update VBA-Insurance API repository?"
set "update_lipas_api=%result%"

if "%update_archer%"=="yes" (
    call :GET_BRANCH_INPUT "Enter branch for ARCHER"
    set "branch_archer=%branch%"
) else (
    set "branch_archer=skipped"
)

if "%update_lipas_client%"=="yes" (
    call :GET_BRANCH_INPUT "Enter branch for LIPAS-Client"
    set "branch_lipas_client=%branch%"
) else (
    set "branch_lipas_client=skipped"
)

if "%update_lipas_core%"=="yes" (
    call :GET_BRANCH_INPUT "Enter branch for VBA LIPAS Core"
    set "branch_lipas_core=%branch%"
) else (
    set "branch_lipas_core=skipped"
)

if "%update_lipas_api%"=="yes" (
    call :GET_BRANCH_INPUT "Enter branch for VBA-Insurance API"
    set "branch_lipas_api=%branch%"
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
call :BACKUP_REPOSITORY "%~2" "%~4"

if not exist "%~2\.git" (
    echo Cloning repository into %~2%...
    git clone --progress --branch %~3% %~1% %~2%
) else (
    echo Pulling latest changes for %~2%...
    cd /d "%~2%"
    git pull --progress origin %~3%
    cd ..
)
exit /b 0

rem Summary of updates
set "summary="

if "%update_archer%"=="yes" (
    call :CLONE_OR_PULL %Archer% "A.R.C.H.E.R" "%branch_archer%" "ARCHER"
    set "summary=%summary%ARCHER: Updated\n"
) else (
    set "summary=%summary%ARCHER: Skipped\n"
)

if "%update_lipas_client%"=="yes" (
    call :CLONE_OR_PULL %Lipas_client% "LIPAS-Client" "%branch_lipas_client%" "LIPAS-Client"
    set "summary=%summary%LIPAS-Client: Updated\n"
) else (
    set "summary=%summary%LIPAS-Client: Skipped\n"
)

if "%update_lipas_core%"=="yes" (
    call :CLONE_OR_PULL %Lipas_core% "VBA-Insurance-Core" "%branch_lipas_core%" "VBA-Insurance-Core"
    set "summary=%summary%VBA LIPAS Core: Updated\n"
) else (
    set "summary=%summary%VBA LIPAS Core: Skipped\n"
)

if "%update_lipas_api%"=="yes" (
    call :CLONE_OR_PULL %Lipas_api% "VBA-Insurance-API" "%branch_lipas_api%" "VBA-Insurance-API"
    set "summary=%summary%VBA-Insurance API: Updated\n"
) else (
    set "summary=%summary%VBA-Insurance API: Skipped\n"
)

rem Display summary
echo Summary of actions:
echo %summary%
echo %summary% >> "%log_file%"

rem Clean up - unset the PAT to ensure it's not kept in memory after the script ends
set "pat="
