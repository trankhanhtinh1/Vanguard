@echo off


REM Patch /lol-vanguard/v1/config/enabled -> /lol-vanguard/v1/config/..abled
powershell -Command "(Get-Content 'LeagueClient.exe' -Raw) -replace '/lol-vanguard/v1/config/enabled', '/lol-vanguard/v1/config/..abled' | Set-Content 'LeagueClient.exe'"

