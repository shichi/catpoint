import os
import glob
import argparse
from playwright.sync_api import sync_playwright

def convert_html_to_pdf(html_path, pdf_path):
    abs_html_path = os.path.abspath(html_path)
    file_url = "file://" + abs_html_path

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(file_url, wait_until="networkidle")

        # ─── ここから追加 ───────────────────────────────
        # Cloudflare Email Obfuscation を解除
        page.evaluate("""() => {
            // cfDecodeEmail 関数定義
            function cfDecodeEmail(encoded) {
                let email = '';
                const r = parseInt(encoded.substr(0, 2), 16);
                for (let n = 2; n < encoded.length; n += 2) {
                    email += String.fromCharCode(parseInt(encoded.substr(n, 2), 16) ^ r);
                }
                return email;
            }
            // ページ内すべての data-cfemail 要素を置き換え
            document.querySelectorAll('[data-cfemail]').forEach(el => {
                const encoded = el.getAttribute('data-cfemail');
                const decoded = cfDecodeEmail(encoded);
                el.textContent = decoded;
                el.href = 'mailto:' + decoded;
            });
        }""")
        # ─── ここまで追加 ───────────────────────────────

        # 元のサイズ取得 & PDF 出力
        dimensions = page.evaluate("""() => ({
            width: document.documentElement.scrollWidth,
            height: document.documentElement.scrollHeight
        })""")
        width_in = dimensions["width"] / 96
        height_in = dimensions["height"] / 96

        page.pdf(
            path=pdf_path,
            width=f"{width_in:.2f}in",
            height=f"{height_in:.2f}in",
            print_background=True,
        )
        browser.close()

def main():
    parser = argparse.ArgumentParser(
        description="WSL環境対応: Playwright を用いて HTML ファイルを、各HTMLのコンテンツサイズに合わせた1ページのPDFに変換するスクリプト"
    )
    parser.add_argument(
        "--input",
        default="downloaded_slides",
        help="HTML ファイルが格納されているディレクトリ (デフォルト: downloaded_slides)"
    )
    parser.add_argument(
        "--output",
        default="pdf_slides",
        help="PDF ファイルを出力するディレクトリ (デフォルト: pdf_slides)"
    )
    args = parser.parse_args()
    input_dir = args.input
    output_dir = args.output

    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        print(f"出力ディレクトリを作成しました: {output_dir}")

    html_files = sorted(glob.glob(os.path.join(input_dir, "*.html")))
    if not html_files:
        print(f"警告: {input_dir} には HTML ファイルが見つかりませんでした。")
        return

    total = len(html_files)
    for idx, html_file in enumerate(html_files, 1):
        base = os.path.basename(html_file)
        pdf_file = os.path.join(output_dir, os.path.splitext(base)[0] + ".pdf")
        print(f"変換中 [{idx}/{total}]: {html_file} -> {pdf_file}")
        try:
            convert_html_to_pdf(html_file, pdf_file)
            print(f"変換完了: {pdf_file}")
        except Exception as e:
            print(f"変換失敗: {html_file} : {e}")

if __name__ == "__main__":
    main()
