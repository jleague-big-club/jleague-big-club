import http.server
import socketserver
import os

# --- 設定 ---
PORT = 8000  # 使用するポート番号 (通常8000で問題ありません)

# --- カスタムリクエストハンドラ ---
# .jsファイルを 'application/javascript' として扱うように設定します。
# これにより、ブラウザがJavaScriptモジュールを正しく解釈できるようになります。
class MyHttpRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=os.getcwd(), **kwargs)

    # MIMEタイプを拡張
    extensions_map = http.server.SimpleHTTPRequestHandler.extensions_map.copy()
    extensions_map.update({
        '.js': 'application/javascript',
    })

# --- サーバーの起動 ---
Handler = MyHttpRequestHandler

try:
    # サーバーインスタンスを作成
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Webサーバーを起動しました。")
        print(f"ブラウザで以下のURLを開いてください:")
        print(f"  http://localhost:{PORT}")
        print(f"  http://127.0.0.1:{PORT}")
        print("\nサーバーを停止するには Ctrl+C を押してください。")
        
        # サーバーを永続的に実行
        httpd.serve_forever()
        
except KeyboardInterrupt:
    print("\nキーボード入力によりサーバーを停止します。")
    # サーバーをシャットダウン
    httpd.shutdown()

except OSError as e:
    if e.errno == 98: # Address already in use
        print(f"\nエラー: ポート {PORT} は既に使用されています。")
        print("他のプログラムがこのポートを使用していないか確認するか、")
        print("serve.py ファイル内の PORT の値を別の番号（例: 8001）に変更してください。")
    else:
        print(f"\nエラーが発生しました: {e}")