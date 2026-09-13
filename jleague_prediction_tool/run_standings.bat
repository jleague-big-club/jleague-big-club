@echo off
chcp 65001 > nul

rem 正常に動作するはずの、完成版スクリプトを実行します
python get_jleague_standings.py

echo.
echo 処理が完了しました。Enterキーを押すとウィンドウを閉じます。
pause > nul