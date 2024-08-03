from bs4 import BeautifulSoup
import json
import requests

headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
}
url = 'https://www.linkedin.com/jobs/search?keywords=Tech%20Jobs&location=India&geoId=102713980&f_TPR=r86400&position=1&pageNum=0'

#Fetch the page 
page = requests.get(url,headers=headers)
soup = BeautifulSoup(page.text,'html.parser')

# List to store job details
job_listings = []

# Find all job postings
job_postings = soup.find_all('div', class_='base-search-card__info')

for job in job_postings:
    # Extract company 
    company_tag = job.find('a', class_='hidden-nested-link')
    company = company_tag.text.strip() if company_tag else 'N/A'
    
    # Extract job role
    role_tag = job.find('h3', class_='base-search-card__title')
    role = role_tag.text.strip() if role_tag else 'N/A'
    
    # Extract location
    location_tag = job.find('span', class_='job-search-card__location')
    location = location_tag.text.strip() if location_tag else 'N/A'
    
    # Extract link
    link_tag = job.find('a', class_='hidden-nested-link')
    link = link_tag['href'] if link_tag else 'N/A'

    # Extract posting time
    time_tag = job.find('time', class_='job-search-card__listdate--new')
    posted_time = time_tag.text.strip() if time_tag else 'N/A'
    
    #Json Format
    job_details = {
        "MainData": {
            "Company": company,
            "Role": role,
            "Location": location,
            "Link": link,
            "Posted":posted_time
        }
    }
    
    print(job_details)
    job_listings.append(job_details)

# Convert to JSON 
job_listings_json = json.dumps(job_listings, ensure_ascii=False, indent=4)
# Save JSON to file
with open('linkedin.json', 'w', encoding='utf-8') as file:
    file.write(job_listings_json)

print("Job locations have been saved to 'linkedin.json'.")
