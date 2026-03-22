import requests
from bs4 import BeautifulSoup

def test_single_profile(url):
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
    
    print(f"Testing profile URL: {url}")
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    
    soup = BeautifulSoup(response.text, 'html.parser')
    
    # 尝试找到包含简介的 div
    intro_div = soup.find('div', class_='saifProfessor_substance_r')
    if not intro_div:
        intro_div = soup.find('div', class_='saifProfessor_substance')
        
    if not intro_div:
        # 如果还是找不到，尝试查找包含特定内容的 div，比如包含“教授”二字
        print("Warning: Standard wrapper div not found. Trying fallback.")
        content_area = soup.find('div', class_='content')
        if content_area:
             intro_div = content_area
    
    intro_text = ""
    if intro_div:
        # 很多时候，个人简介可能是直接的文本，也可能是包裹在 p 标签里
        p_tags = intro_div.find_all('p')
        if p_tags:
            for p in p_tags:
                text = p.get_text(strip=True)
                # 过滤掉很短的无用信息
                if len(text) > 30:
                    intro_text += text + " "
                    # 为了避免提取太多，我们可以只取前两段或者限制字数
                    if len(intro_text) > 300:
                        break
        
        # 如果 p 标签没找到内容，尝试直接获取文字
        if not intro_text:
             # 获取所有文本，去掉多余空格
             text_content = intro_div.get_text(separator=' ', strip=True)
             # 找一个足够长的句子作为简介
             if len(text_content) > 50:
                  intro_text = text_content[:500] + "..." if len(text_content) > 500 else text_content
                  
    print("\n--- Extracted Introduction ---")
    print(intro_text.strip() if intro_text else "No introduction found.")
    print("------------------------------\n")

if __name__ == "__main__":
    # 测试提供的链接
    test_url = "https://www.saif.sjtu.edu.cn/faculty-research/faculty/ma-weihua"
    test_single_profile(test_url)
    
    # 再测试一个全职教授
    test_url2 = "https://www.saif.sjtu.edu.cn/faculty-research/faculty/cheng-shijun"
    test_single_profile(test_url2)
