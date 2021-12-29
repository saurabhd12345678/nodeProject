@echo off 
ECHO Entered bat file.
SET var=%cd%
SET varPath=%var%\templates\generated
set arg1=%1
set arg2=%2
ECHO The 1st argument is %1
ECHO The 2nd argument is %2
echo %arg1%
cd %varPath%
ECHO The current path is %cd%
git init
git add --all
git commit -m "Second Commit"
git remote add origin %1
git push -u origin master
ECHO After push
rmdir /s /q .git
ECHO After delete