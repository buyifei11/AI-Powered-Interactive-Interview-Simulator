#!/usr/bin/env python3
"""Convert the two markdown reports to styled HTML files ready for PDF print."""
import markdown2

CSS = """
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Fira+Code:wght@400;500&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Inter', -apple-system, sans-serif;
    font-size: 13.5px;
    line-height: 1.7;
    color: #1a1a2e;
    background: #fff;
    padding: 40px 60px;
    max-width: 960px;
    margin: 0 auto;
  }
  h1 { font-size: 24px; font-weight: 700; color: #0f3460; border-bottom: 3px solid #0f3460; padding-bottom: 10px; margin: 0 0 28px; }
  h2 { font-size: 18px; font-weight: 700; color: #16213e; border-left: 4px solid #0f3460; padding-left: 12px; margin: 32px 0 14px; }
  h3 { font-size: 15px; font-weight: 600; color: #0f3460; margin: 22px 0 10px; }
  h4 { font-size: 13.5px; font-weight: 600; color: #444; margin: 16px 0 8px; }
  p  { margin: 0 0 12px; }
  ul, ol { margin: 0 0 12px 24px; }
  li { margin: 4px 0; }
  code {
    font-family: 'Fira Code', monospace;
    font-size: 12px;
    background: #f0f4ff;
    color: #c0392b;
    padding: 2px 6px;
    border-radius: 4px;
  }
  pre {
    background: #1a1a2e;
    color: #e0e0e0;
    padding: 18px 20px;
    border-radius: 10px;
    overflow-x: auto;
    margin: 14px 0 18px;
    font-family: 'Fira Code', monospace;
    font-size: 12px;
    line-height: 1.6;
  }
  pre code { background: none; color: inherit; padding: 0; }
  table {
    border-collapse: collapse;
    width: 100%;
    margin: 14px 0 20px;
    font-size: 13px;
  }
  th {
    background: #0f3460;
    color: #fff;
    font-weight: 600;
    padding: 8px 12px;
    text-align: left;
  }
  td {
    padding: 7px 12px;
    border-bottom: 1px solid #e8ecf5;
  }
  tr:nth-child(even) td { background: #f5f8ff; }
  hr { border: none; border-top: 1px solid #dde3f0; margin: 24px 0; }
  blockquote {
    border-left: 4px solid #4a90e2;
    background: #f0f6ff;
    padding: 10px 18px;
    margin: 14px 0;
    border-radius: 0 8px 8px 0;
    color: #333;
    font-style: italic;
  }
  strong { color: #0f3460; }
  @media print {
    body { padding: 20px 30px; font-size: 12px; }
    h1 { font-size: 20px; }
    h2 { font-size: 16px; }
    pre { font-size: 11px; }
    table { font-size: 11px; }
  }
</style>
"""

EXTRAS = ["tables", "fenced-code-blocks", "strike", "header-ids"]

files = [
    (
        "/Users/yifeibu/.gemini/antigravity/brain/d8849429-b8f4-4310-89fd-ae099617dff2/technical_report.md",
        "/Users/yifeibu/Desktop/AI_Interview_Technical_Report.html",
        "AI Interview Simulator — Technical Report"
    ),
    (
        "/Users/yifeibu/.gemini/antigravity/brain/d8849429-b8f4-4310-89fd-ae099617dff2/pipeline_detail.md",
        "/Users/yifeibu/Desktop/AI_Interview_Pipeline_Detail.html",
        "AI Interview Simulator — Detailed Pipeline"
    ),
]

for src, dst, title in files:
    with open(src, "r", encoding="utf-8") as f:
        md_content = f.read()

    body_html = markdown2.markdown(md_content, extras=EXTRAS)

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title}</title>
  {CSS}
</head>
<body>
{body_html}
</body>
</html>"""

    with open(dst, "w", encoding="utf-8") as f:
        f.write(html)

    print(f"✅  Exported: {dst}")

print("\nDone! Open each .html file in Chrome/Safari, then press Cmd+P → Save as PDF.")
