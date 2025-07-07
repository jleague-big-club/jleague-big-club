@echo off
rem バッチファイルがあるディレクトリに移動
cd /d "%~dp0"

echo 現在のディレクトリ: %cd%
python update_script.py
pause