import json
import requests
from bs4 import BeautifulSoup
import time

def scrape_faculty():
    base_url = "https://www.saif.sjtu.edu.cn"
    categories = {
        "全职教授": "/faculty-research/full-time-professor",
        "访问教授": "/faculty-research/special-term-professor",
        "兼职教授": "/faculty-research/adjunct-professor",
        "兼聘教授": "/faculty-research/affiliated-professor"
    }
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
    
    people_data = {}
    
    for category, path in categories.items():
        url = base_url + path
        print(f"Scraping {category}: {url}")
        
        try:
            response = requests.get(url, headers=headers)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Find all professor items
            items = soup.find_all('li', class_='saifProfessor_list2-item')
            
            for item in items:
                link_tag = item.find('a')
                if not link_tag or 'href' not in link_tag.attrs:
                    continue
                
                profile_url = base_url + link_tag['href']
                name_tag = item.find('p', class_='name')
                title_tag = item.find('p', class_='desc')
                
                if name_tag and title_tag:
                    name = name_tag.get_text(strip=True)
                    title = title_tag.get_text(strip=True)
                    
                    print(f"  - Scraping profile for: {name}")
                    try:
                        profile_resp = requests.get(profile_url, headers=headers)
                        profile_resp.raise_for_status()
                        profile_soup = BeautifulSoup(profile_resp.text, 'html.parser')
                        
                        # Find the professor introduction
                        # Assuming it's in a specific div, let's try to find common class names for introductions
                        # We might need to inspect the HTML of a professor's page to get the exact class
                        intro_div = profile_soup.find('div', class_='intro-content') # Placeholder, need to verify
                        intro_text = ""
                        
                        # content_div = profile_soup.find('div', class_='saifProfessorDetail_r')
                        
                        # Inspect the professor detail page structure
                        # Usually the biography is in a div with some class like `Professor_substance_r` or `intro`
                        # Based on typical SAIF site structure, let's try a few common patterns
                        intro_div = profile_soup.find('div', class_='saifProfessor_substance_r')
                        if not intro_div:
                            intro_div = profile_soup.find('div', class_='saifProfessor_substance')
                        
                        if intro_div:
                            # Try to find paragraphs that might contain the introduction
                            p_tags = intro_div.find_all('p')
                            for p in p_tags:
                                text = p.get_text(strip=True)
                                # Skip empty paragraphs or very short ones that might be labels
                                if len(text) > 30 and "教授" in text:
                                    intro_text += text + " "
                                    break # We just want the first substantial paragraph describing the professor
                            
                            # If no p tag matches, just get all text and take the first chunk
                            if not intro_text:
                                text_content = intro_div.get_text(separator=' ', strip=True)
                                # Heuristic: take first 200 chars or until a newline
                                intro_text = text_content[:200] + "..." if len(text_content) > 200 else text_content
                        else:
                            # Fallback if specific classes aren't found
                            content_area = profile_soup.find('div', class_='content')
                            if content_area:
                                p_tags = content_area.find_all('p')
                                for p in p_tags:
                                    text = p.get_text(strip=True)
                                    if len(text) > 30 and name in text:
                                        intro_text = text
                                        break
                        
                        # If we found an intro, use it. Otherwise, fallback to title.
                        final_desc = intro_text.strip() if intro_text.strip() else title
                        
                        # Combine title and intro for better context
                        if final_desc != title:
                            final_desc = f"{title}, {final_desc}"
                            
                        people_data[name] = final_desc
                        
                        time.sleep(0.5) # Be polite
                        
                    except Exception as e:
                        print(f"    Error scraping profile for {name}: {e}")
                        people_data[name] = title # Fallback to title
                    
            print(f"Finished {category}")
            time.sleep(1) # Be polite to the server
            
        except Exception as e:
            print(f"Error scraping {category}: {e}")
            
    # Format according to people.json structure
    output_data = {
        "people": people_data
    }
    
    # Save to file
    with open("data/people_scraped.json", "w", encoding="utf-8") as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)
        
    print(f"Successfully saved {len(people_data)} people to data/people_scraped.json")

if __name__ == "__main__":
    scrape_faculty()
