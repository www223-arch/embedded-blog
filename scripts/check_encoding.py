
# -*- coding: utf-8 -*-
import sys
from pathlib import Path

def analyze_file(filepath):
    print(f"Analyzing: {filepath}")
    print("=" * 60)
    
    with open(filepath, 'rb') as f:
        data = f.read()
    
    # 查找包含中文字符的位置
    lines = data.split(b'\n')
    for i, line in enumerate(lines):
        # 检查是否有非ASCII字符
        has_non_ascii = any(b &gt; 127 for b in line)
        if has_non_ascii:
            print(f"\nLine {i+1} (has non-ASCII):")
            print(f"  Hex: {line.hex()}")
            print(f"  UTF-8: {line.decode('utf-8', errors='replace')}")
            try:
                print(f"  GBK: {line.decode('gbk', errors='replace')}")
            except:
                pass
            print(f"  Raw bytes: {line!r}")

# 检查主要文件
base = Path(r"c:\Users\86199\Desktop\Code\embedded-blog")
analyze_file(base / "src" / "features" / "docs" / "view.ts")
analyze_file(base / "src" / "features" / "life" / "view.ts")
analyze_file(base / "index.html")
