@echo off
rem --- このバッチファイルの場所をカレントディレクトリに設定 ---
cd /d "%~dp0"

echo ===================================================
echo   Article Graph Creator Tool
echo ===================================================
echo.
echo   Pythonスクリプトを実行してグラフを作成します...
echo.

rem --- PythonスクリプトをUTF-8モードで実行 ---
python -X utf8 create_article_graphs.py

echo.
echo.
echo ===================================================
echo   処理が完了しました。
echo ===================================================
echo.
echo   このウィンドウはEnterキーを押すと閉じます。
pause > nul