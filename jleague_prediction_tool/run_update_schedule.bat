@echo off
chcp 65001 > nul

python update_schedule_data.py

echo.
echo 処理が完了しました。Enterキーを押すとウィンドウを閉じます。
pause > nul