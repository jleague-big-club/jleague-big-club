@echo off
rem --- このバッチファイルの場所をカレントディレクトリに設定 ---
cd /d "%~dp0"

echo ===================================================
echo   J-League WINNER Prediction Tool
echo ===================================================
echo.
echo   Pythonスクリプトを実行します...
echo.

rem --- PythonスクリプトをUTF-8モードで実行 ---
rem ★★★【ここを修正】★★★
rem python の後に -X utf8 を追加します
python -X utf8 generate_predictions.py

echo.
echo.
echo ===================================================
echo   処理が完了しました。
echo ===================================================
echo.
echo   このウィンドウはEnterキーを押すと閉じます。
pause > nul