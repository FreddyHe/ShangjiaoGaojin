import sys
import json
from pathlib import Path

# 将 backend 目录加入到 sys.path，以便能够导入 main.py 中的函数
backend_dir = Path(__file__).resolve().parent.parent
sys.path.append(str(backend_dir))

# 导入需要测试的核心函数和模型
from main import (
    classify_type_for_texts, 
    outline_for_text, 
    load_types, 
    TypeItem,
    _section_to_dict
)

def test_extract_outline():
    print("="*50)
    print("开始测试大纲提取核心逻辑")
    print("="*50)

    # 1. 准备测试用的新闻稿文本（模拟用户上传的解析后文本）
    sample_text = """
    【新闻稿】上海交通大学上海高级金融学院成功举办2024年秋季开学典礼暨迎新大会

    2024年9月10日，上海交通大学上海高级金融学院（高金/SAIF）2024年秋季开学典礼在徐汇校区隆重举行。来自全球各地的300余名新生齐聚一堂，共同开启在SAIF的学术与职业新征程。

    开幕致辞中，高金执行院长发表了热情洋溢的讲话。他指出，在当前全球经济深刻变革的背景下，高金始终致力于培养具备国际视野和创新能力的顶尖金融人才。他勉励新生们要勇于探索未知，将理论与实践深度结合。

    随后，知名经济学家、高金特聘教授进行了主旨演讲，深入剖析了数字化转型对金融行业生态的重塑，引发了现场师生的热烈反响。在随后的圆桌讨论环节，多位行业专家与校友代表围绕“金融科技的未来机遇与挑战”展开了深入的交流与思想碰撞，达成了一系列重要共识。

    最后，活动在热烈的掌声中圆满落下帷幕。本次开学典礼不仅为新生们指明了方向，也再次彰显了高金在金融教育领域的卓越影响力。
    """
    
    print("\n[1] 正在测试文本分类 (classify_type_for_texts)...")
    try:
        types = load_types()
    except Exception as e:
        print(f"加载类型失败，使用默认类型。错误: {e}")
        types = [
            TypeItem(id="news", name="新闻稿"), 
            TypeItem(id="activity", name="活动报道"),
            TypeItem(id="report", name="综述稿")
        ]
        
    selected_type = classify_type_for_texts([sample_text], types)
    print(f"✅ 分类成功！识别出的文章类型: ID={selected_type.id}, Name={selected_type.name}")
    
    print("\n[2] 正在测试大纲提取 (outline_for_text)...")
    print("调用大模型提取结构化大纲，这可能需要几秒钟...")
    outline_sections = outline_for_text(sample_text, selected_type.name)
    
    print("\n✅ 大纲提取成功！以下是提取出的结构化大纲：")
    print("-" * 40)
    
    # 将提取结果转换为字典并美化打印
    result_dict = [_section_to_dict(s) for s in outline_sections]
    print(json.dumps(result_dict, ensure_ascii=False, indent=2))
    
    print("-" * 40)
    print("测试完成。")

if __name__ == "__main__":
    test_extract_outline()
