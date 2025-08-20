@echo off
echo Patching LeagueClient.exe...

REM Patch /lol-vanguard/v1/config/..abled -> /lol-vanguard/v1/config/enabled
powershell -Command "(Get-Content 'LeagueClient.exe' -Raw) -replace '/lol-vanguard/v1/config/..abled', '/lol-vanguard/v1/config/enabled' | Set-Content 'LeagueClient.exe'"

echo Patch completed!
