@echo off
echo 全てのCSVファイルのチーム名を統一します...
python clean_data.py
echo.
echo 処理が完了しました。予測生成(run_prediction.bat)を実行してください。
pause