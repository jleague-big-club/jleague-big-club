import re
import subprocess
import os

# Jリーグのフォルダパス
GIT_REPO_PATH_JLEAGUE = r'C:\Users\mura\Desktop\その他\webサイト\jleague-big-club'

def run_command(command, description, working_dir=None):
    print(f"\n--- {description} を開始します ---")
    try:
        subprocess.run(command, check=True, text=True, encoding='utf-8', cwd=working_dir)
        print(f"--- {description} が完了しました ---")
        return True
    except Exception as e:
        print(f"エラー: {e}")
        return False

def ask_prediction_leagues():
    """シーズン予測を更新するリーグを聞く。何も入れずにEnterなら全リーグ。

    節が全部終わったリーグだけ回せるようにするため（例: J2・J3は今日、J1は明日）。
    """
    print("シーズン予測を更新するリーグを入力してください。")
    print("  例) J1 / J2 J3 / 23  ※何も入れずにEnterで全リーグ")
    while True:
        raw = input("> ").strip()
        if not raw:
            return ['J1', 'J2', 'J3']
        numbers = re.findall(r'\d', raw)
        if numbers and all(n in '123' for n in numbers):
            return [f'J{n}' for n in '123' if n in numbers]
        print("J1 / J2 / J3 の組み合わせで入力してください。")


def main():
    print("="*50)
    print("【Jリーグ】データ自動更新を開始")
    print("="*50)

    # 最初に聞いておけば、あとは放っておいても最後まで進む
    prediction_leagues = ask_prediction_leagues()
    print(f"→ シーズン予測を更新するリーグ: {' / '.join(prediction_leagues)}")
    
    # データ更新系スクリプト
    run_command(["python", "get_jleague_standings.py"], "順位取得")
    run_command(["python", "update_schedule_data.py"], "試合結果更新")
    run_command(["python", "update_ratings.py"], "レーティング更新")
    run_command(["python", "calculate_team_stats.py"], "チーム統計計算")
    run_command(["python", "predict_match_v1_1.py"], "予測生成")
    run_command(["python", "create_prediction.py", *prediction_leagues], f"シーズン予測（{' / '.join(prediction_leagues)}）")
    run_command(["python", "update_script.py"], "日付更新")

    # Gitアップロード
    from datetime import datetime
    commit_msg = f"自動更新 {datetime.now().strftime('%Y/%m/%d %H:%M')}（シーズン予測: {' '.join(prediction_leagues)}）"
    if run_command(["git", "add", "."], "git add", working_dir=GIT_REPO_PATH_JLEAGUE):
        if run_command(["git", "commit", "-m", commit_msg], "git commit", working_dir=GIT_REPO_PATH_JLEAGUE):
            run_command(["git", "push", "origin", "main"], "git push", working_dir=GIT_REPO_PATH_JLEAGUE)
    
    print("\n" + "="*50)
    print("Jリーグの更新が完了しました！")
    print("="*50)

if __name__ == "__main__":
    main()