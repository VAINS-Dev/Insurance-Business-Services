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

rem Display fancy overview message
echo +-------------------------------------+
echo ^|      ▪   ▐ ▄ .▄▄ · ▄• ▄▌▄▄▄        ^|
echo ^|      ██ •█▌▐█▐█ ▀. █▪██▌▀▄ █·     ^|
echo ^|      ▐█·▐█▐▐▌▄▀▀▀█▄█▌▐█▌▐▀▀▄      ^|
echo ^|      ▐█▌██▐█▌▐█▄▪▐█▐█▄█▌▐█•█▌     ^|
echo ^|      ▀▀▀▀▀ █▪ ▀▀▀▀  ▀▀▀ .▀  ▀     ^|
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

rem Check if the user answered 'yes'
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
    ) > "%json_file%"
    echo Created JSON file: %json_file% >> "%log_file%"
) else (
    echo JSON file already exists: %json_file% >> "%log_file%"
)

rem Present the repository selection menu
echo.
echo Which repositories do you want to clone or update?
echo.

rem Function to validate user input for yes/no questions
:get_valid_input
set "answer="
:input_loop
set /p answer="%prompt_message% (yes/no): "
if /i "%answer%"=="yes" (
    set "user_input=yes"
    goto :eof
) else if /i "%answer%"=="no" (
    set "user_input=no"
    goto :eof
) else (
    echo Please answer yes or no.
    goto :input_loop
)
goto :eof

rem Function to get the branch from the user
:get_branch_input
set /p branch="%prompt_message% (default: development): "
if "%branch%"=="" (
    set "branch=development"
)
set "user_branch=%branch%"
goto :eof

rem Get update decision for each repository
set "prompt_message=Update ARCHER repository?"
call :get_valid_input
set "update_archer=%user_input%"

set "prompt_message=Update LIPAS-Client repository?"
call :get_valid_input
set "update_lipas_client=%user_input%"

set "prompt_message=Update VBA LIPAS Core repository?"
call :get_valid_input
set "update_lipas_core=%user_input%"

set "prompt_message=Update VBA-Insurance API repository?"
call :get_valid_input
set "update_lipas_api=%user_input%"

rem After getting repository decisions, ask for the branches
if /i "%update_archer%"=="yes" (
    set "prompt_message=Enter branch for ARCHER"
    call :get_branch_input
    set "branch_archer=%user_branch%"
) else (
    set "branch_archer=skipped"
)

if /i "%update_lipas_client%"=="yes" (
    set "prompt_message=Enter branch for LIPAS-Client"
    call :get_branch_input
    set "branch_lipas_client=%user_branch%"
) else (
    set "branch_lipas_client=skipped"
)

if /i "%update_lipas_core%"=="yes" (
    set "prompt_message=Enter branch for VBA LIPAS Core"
    call :get_branch_input
    set "branch_lipas_core=%user_branch%"
) else (
    set "branch_lipas_core=skipped"
)

if /i "%update_lipas_api%"=="yes" (
    set "prompt_message=Enter branch for VBA-Insurance API"
    call :get_branch_input
    set "branch_lipas_api=%user_branch%"
) else (
    set "branch_lipas_api=skipped"
)

rem Log the user's selections and branch information
echo User selected ARCHER update: %update_archer%, Branch: %branch_archer% >> "%log_file%"
echo User selected LIPAS-Client update: %update_lipas_client%, Branch: %branch_lipas_client% >> "%log_file%"
echo User selected VBA LIPAS Core update: %update_lipas_core%, Branch: %branch_lipas_core% >> "%log_file%"
echo User selected VBA-Insurance API update: %update_lipas_api%, Branch: %branch_lipas_api% >> "%log_file%"

rem Summary of updates
set "summary="

rem Conditionally clone or pull repositories based on user input
if /i "%update_archer%"=="yes" (
    call :clone_or_pull "%Archer%" "A.R.C.H.E.R" "%branch_archer%" "ARCHER"
    echo ARCHER repository updated or cloned.
    set "summary=%summary%ARCHER: Updated%n"
) else (
    set "summary=%summary%ARCHER: Skipped%n"
)

if /i "%update_lipas_client%"=="yes" (
    call :clone_or_pull "%Lipas_client%" "LIPAS-Client" "%branch_lipas_client%" "LIPAS-Client"
    echo LIPAS-Client repository updated or cloned.
    set "summary=%summary%LIPAS-Client: Updated%n"
) else (
    set "summary=%summary%LIPAS-Client: Skipped%n"
)

if /i "%update_lipas_core%"=="yes" (
    call :clone_or_pull "%Lipas_core%" "VBA-Insurance-Core" "%branch_lipas_core%" "VBA-Insurance-Core"
    echo VBA LIPAS Core repository updated or cloned.
    set "summary=%summary%VBA LIPAS Core: Updated%n"
) else (
    set "summary=%summary%VBA LIPAS Core: Skipped%n"
)

if /i "%update_lipas_api%"=="yes" (
    call :clone_or_pull "%Lipas_api%" "VBA-Insurance-API" "%branch_lipas_api%" "VBA-Insurance-API"
    echo VBA-Insurance API repository updated or cloned.
    set "summary=%summary%VBA-Insurance API: Updated%n"
) else (
    set "summary=%summary%VBA-Insurance API: Skipped%n"
)

rem Display summary
echo Summary of actions:
echo %summary%
echo %summary% >> "%log_file%"

endlocal
exit /b 0

rem Function to clone or pull a repository
:clone_or_pull
rem Parameters:
rem %1 - repo_url
rem %2 - destination_folder
rem %3 - branch_name
rem %4 - repo_name

call :backup_repository "%~2" "%~4"
if not exist "%~2%\.git" (
    echo Cloning repository into %~2%...
    git clone --progress --branch %~3% "%~1%" "%~2%"
) else (
    echo Pulling latest changes for %~2%...
    pushd "%~2%"
    git pull --progress origin %~3%
    popd
)
goto :eof

rem Function to backup a repository before making changes
:backup_repository
rem Parameters:
rem %1 - repo_path
rem %2 - repo_name
if exist "%~1%" (
    echo Backing up repository %~1%...
    set "timestamp=%date:~10,4%%date:~4,2%%date:~7,2%_%time:~0,2%%time:~3,2%%time:~6,2%"
    set "backup_name=%backup_folder%\%~2%_backup_%timestamp%.zip"
    powershell -Command "Compress-Archive -Path '%~1%' -DestinationPath '%backup_name%'"
)
goto :eof