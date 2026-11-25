import re
import subprocess
import os
from urllib.parse import quote

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

X_POST_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'x_post')


def open_post_writing_session(leagues):
    """デスクトップアプリのClaudeに、X投稿文づくりを依頼する新しいセッションを開く。

    依頼文は入力欄に入るだけで、送信はされない（Enterを押すと始まる）。
    """
    guide = os.path.join(X_POST_DIR, '投稿文の作り方.md')
    prompt = (f"X投稿文を作ってください（{' / '.join(leagues)}）。\n"
              f"手順は {guide} に書いてあります。")
    try:
        os.startfile(f"claude://code/new?q={quote(prompt)}")
        print("→ Claudeのアプリに投稿文づくりの依頼を開きました。アプリでEnterを押してください。")
    except Exception as e:
        print(f"警告: Claudeのアプリを開けませんでした。 - {e}")
        print(f"  手動で依頼する場合: 「{guide} の手順でX投稿文を作って」")


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

    # X投稿文の材料を作り、Claudeのアプリで投稿文づくりを始められるようにする
    if run_command(["python", "make_post_materials.py", *prediction_leagues], "X投稿文の材料づくり", working_dir=X_POST_DIR):
        open_post_writing_session(prediction_leagues)

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