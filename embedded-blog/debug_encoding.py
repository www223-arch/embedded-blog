
# -*- coding: utf-8 -*-
# 分析经典的编码问题

# 假设原始中文 "技术文档"
original_utf8 = "技术文档".encode('utf-8')
print(f"原始 '技术文档' UTF-8 字节: {original_utf8.hex()}")
print(f"原始 '技术文档': 技术文档\n")

# 模拟错误: 把 UTF-8 字节当作 GBK 读取
try:
    wrong_read_as_gbk = original_utf8.decode('gbk')
    print(f"错误地把 UTF-8 当作 GBK 读取: {wrong_read_as_gbk}")
    
    # 然后又把这个错误的字符串用 UTF-8 保存回去
    wrong_saved_utf8 = wrong_read_as_gbk.encode('utf-8')
    print(f"然后用 UTF-8 保存后的字节: {wrong_saved_utf8.hex()}")
    print(f"最终乱码结果: {wrong_saved_utf8.decode('utf-8', 'replace')}\n")
except Exception as e:
    print(f"Error: {e}")

# 测试 "全部"
original_quanbu = "全部".encode('utf-8')
print(f"原始 '全部' UTF-8 字节: {original_quanbu.hex()}")
try:
    wrong_read_as_gbk = original_quanbu.decode('gbk')
    print(f"错误地把 UTF-8 当作 GBK 读取: {wrong_read_as_gbk}")
    wrong_saved_utf8 = wrong_read_as_gbk.encode('utf-8')
    print(f"最终乱码结果: {wrong_saved_utf8.decode('utf-8', 'replace')}")
except Exception as e:
    print(f"Error: {e}")
