import pandas as pd
import os

# --- 設定 ---
BASE_DIR = r'C:\Users\mura\Desktop\jleague-big-club'
DATA_DIR = os.path.join(BASE_DIR, 'data')

# 修正対象のファイルと、チーム名が含まれる列のリスト
FILES_TO_CLEAN = {
    'schedule.csv': ['ホーム', 'アウェイ'],
    'yearrank.csv': ['チーム'],
    'j1rank.csv': ['チーム名'],
    'j2rank.csv': ['チーム名'],
    'j3rank.csv': ['チーム名']
}

# ★ 追加: 二重になったチーム名を修正する関数
def fix_duplicated_team_name(team_name):
    """ 'チーム名チーム名' のような文字列を 'チーム名' に修正する """
    # pandasの欠損値(NaN)や非文字列型を考慮
    if not isinstance(team_name, str):
        return team_name
    
    n = len(team_name)
    # 文字列長が2以上かつ偶数で、前半と後半が一致する場合
    if n > 0 and n % 2 == 0:
        half = n // 2
        if team_name[:half] == team_name[half:]:
            # 同じなら前半部分だけを返す
            return team_name[:half]
    # 条件に合わない場合は元の文字列を返す
    return team_name


def main():
    print("データクレンジングを開始します...")
    
    # 1. マスターとなるチーム名リストとエイリアス（別名）対応表を読み込む
    try:
        master_teams_df = pd.read_csv(os.path.join(DATA_DIR, 'data.csv'), encoding='utf-8')
        alias_df = pd.read_csv(os.path.join(DATA_DIR, 'alias.csv'), encoding='utf-8')
    except FileNotFoundError as e:
        print(f"エラー: data.csvまたはalias.csvが見つかりません。 - {e}")
        return

    # エイリアス辞書を作成 {'alias': 'canonical_name'}
    alias_map = pd.Series(alias_df.canonical_name.values, index=alias_df.alias).to_dict()
    
    # マスターのチーム名自体も辞書に追加（正式名称は正式名称に変換）
    for team in master_teams_df['クラブ名']:
        if team not in alias_map:
            alias_map[team] = team

    # 2. 各ファイルを順番に処理する
    for filename, columns in FILES_TO_CLEAN.items():
        file_path = os.path.join(DATA_DIR, filename)
        
        if not os.path.exists(file_path):
            print(f"警告: {filename} が見つからないため、スキップします。")
            continue

        try:
            df = pd.read_csv(file_path, encoding='utf-8')
            print(f"処理中: {filename}")

            # 指定された各列に対してチーム名の統一処理を実行
            for col in columns:
                if col in df.columns:
                    # ★ 変更点: 処理フローを改善
                    
                    # ステップ1: まず前後の空白を除去
                    # .astype(str)で数値などが混入していてもエラーを防ぐ
                    df[col] = df[col].astype(str).str.strip()
                    
                    # ステップ2: 二重になっているチーム名を自動修正
                    df[col] = df[col].apply(fix_duplicated_team_name)
                    
                    # ステップ3: エイリアス辞書で正式名称に統一
                    df[col] = df[col].replace(alias_map)
                else:
                    print(f"  - 警告: 列 '{col}' が {filename} に見つかりません。")

            # 修正した内容でCSVファイルを上書き保存
            df.to_csv(file_path, index=False, encoding='utf-8')
            print(f"  -> {filename} の更新が完了しました。")

        except Exception as e:
            print(f"エラー: {filename} の処理中に問題が発生しました - {e}")

    print("\nすべてのデータクレンジングが完了しました。")

if __name__ == '__main__':
    main()