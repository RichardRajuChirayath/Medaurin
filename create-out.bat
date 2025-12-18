@echo off
echo Creating out directory...
if not exist out mkdir out
echo ^<!DOCTYPE html^>^<html^>^<body^>^<h1^>Medaurin^</h1^>^</body^>^</html^> > out\index.html
echo Done! out\index.html created.
echo.
echo Now run: npx cap sync android
