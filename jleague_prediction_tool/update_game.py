import subprocess
import os

# ゲームのフォルダパス
GIT_REPO_PATH_WEBSITE = r'C:\Users\mura\Desktop\youtubeシュミレーションゲーム' 

def run_command(command, description, working_dir=None):
    print(f"\n--- {description} を開始します ---")
    try:
        subprocess.run(command, check=True, text=True, encoding='utf-8', cwd=working_dir)
        print(f"--- {description} が完了しました ---")
        return True
    except Exception as e:
        print(f"エラー: {e}")
        return False

def main():
    print("="*50)
    print("【ゲームサイト】更新処理を開始")
    print("="*50)

    # Gitアップロード
    if run_command(["git", "add", "."], "git add", working_dir=GIT_REPO_PATH_WEBSITE):
        run_command(["git", "commit", "-m", "サイト更新"], "git commit", working_dir=GIT_REPO_PATH_WEBSITE)
        # ★ここを修正（インデントを揃えました）
        run_command(["git", "push", "origin", "master:main", "-f"], "git push", working_dir=GIT_REPO_PATH_WEBSITE)

    print("\n" + "="*50)
    print("ゲームサイトの更新が完了しました！")
    print("="*50)

if __name__ == "__main__":
    main()