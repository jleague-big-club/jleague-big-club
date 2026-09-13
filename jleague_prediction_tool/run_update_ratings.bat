@echo off
rem --- このバッチファイルの場所をカレントディレクトリに設定 ---
cd /d "%~dp0"

echo ===================================================
echo   Team Rating Update Tool
echo ===================================================
echo.
echo   Pythonスクリプトを実行してレーティングを更新します...
echo.

rem --- PythonスクリプトをUTF-8モードで実行 ---
python -X utf8 update_ratings.py

echo.
echo.
echo ===================================================
echo   処理が完了しました。
echo ===================================================
echo.
echo   このウィンドウはEnterキーを押すと閉じます。
pause > nul