import pandas as pd
import json
import os
import numpy as np

# --- 設定項目 ---
WEB_ROOT_PATH = 'C:/Users/mura/Desktop/jleague-big-club'
RATINGS_JSON_PATH = os.path.join(WEB_ROOT_PATH, 'data/team_ratings.json')

def main():
    print("--- リーグ混戦度（標準偏差）計算ツール ---")
    
    try:
        with open(RATINGS_JSON_PATH, 'r', encoding='utf-8') as f:
            ratings_data = json.load(f)
        print("レーティングデータを読み込みました。")
    except Exception as e:
        print(f"エラー: レーティングファイルの読み込みに失敗しました。 - {e}")
        return

    league_std_dev = {}
    for league, teams in ratings_data.items():
        if teams:
            # 各リーグのレーティング値のリストを作成
            rating_values = list(teams.values())
            # numpyを使って標準偏差を計算
            std_dev = np.std(rating_values)
            league_std_dev[league] = std_dev
            print(f"{league} のレーティング標準偏差: {std_dev:.2f}")

    # 計算結果をJSONファイルとして保存（任意）
    output_path = os.path.join(WEB_ROOT_PATH, 'data/league_variance.json')
    try:
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(league_std_dev, f, indent=2, ensure_ascii=False)
        print(f"\n計算結果を {output_path} に保存しました。")
    except Exception as e:
        print(f"エラー: 計算結果の保存に失敗しました。 - {e}")
        
    print("\n--- 計算完了 ---")
    print("以下の数値を記事にコピーして使用してください：")
    for league, std in sorted(league_std_dev.items(), key=lambda item: item[1]):
        print(f"- {league}: {std:.1f}")


if __name__ == '__main__':
    main()