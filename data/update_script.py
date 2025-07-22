import os
import json
from datetime import datetime, timezone, timedelta
import sys

# --- 設定 ---
# スクリプトの実際の場所に基づいて基準ディレクトリを決定する
try:
    BASE_DIR = os.path.dirname(sys._MEIPASS)
except AttributeError:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# ★★★★★ FIX ★★★★★
# The BASE_DIR is now the 'data' folder itself, so we don't need to add 'data' again.
# 基準ディレクトリは 'data' フォルダ自身なので、'data' を再度追加する必要はありません。
DATA_FOLDER = BASE_DIR 
# ★★★★★★★★★★★★★★★

OUTPUT_JSON_PATH = os.path.join(DATA_FOLDER, 'update_dates.json')

# 更新日時を追跡したいファイルのリスト
TARGET_FILES = [
    "j1rank.csv",
    "j2rank.csv",
    "j3rank.csv",
    "jflrank.csv",
    "attendancefigure.csv",
    "prediction_probabilities.json"
]

# タイムゾーンを日本標準時(JST, UTC+9)に設定
JST = timezone(timedelta(hours=9), 'JST')

# --- メイン処理 ---
def main():
    print(f"基準ディレクトリ: {BASE_DIR}")
    print(f"データフォルダ: {DATA_FOLDER}")
    print("ファイルの更新日時を取得しています...")
    
    # 既存のJSONファイルを読み込む
    try:
        with open(OUTPUT_JSON_PATH, 'r', encoding='utf-8') as f:
            updated_dates = json.load(f)
    except FileNotFoundError:
        updated_dates = {}

    # 各ファイルの更新日時を取得
    for filename in TARGET_FILES:
        file_path = os.path.join(DATA_FOLDER, filename)
        
        if os.path.exists(file_path):
            mtime_float = os.path.getmtime(file_path)
            dt_object_jst = datetime.fromtimestamp(mtime_float, tz=JST)
            iso_format_string = dt_object_jst.isoformat(timespec='seconds')
            updated_dates[filename] = iso_format_string
            print(f"  - {filename}: {iso_format_string}")
        else:
            print(f"  - 警告: {file_path} が見つかりません。スキップします。")

    # JSONファイルに書き込む
    try:
        os.makedirs(DATA_FOLDER, exist_ok=True)
        with open(OUTPUT_JSON_PATH, 'w', encoding='utf-8') as f:
            json.dump(updated_dates, f, indent=4, ensure_ascii=False)
        print(f"\n完了: {OUTPUT_JSON_PATH} を正常に更新しました。")
    except Exception as e:
        print(f"\nエラー: ファイルの書き込みに失敗しました。 - {e}")

if __name__ == '__main__':
    main()