import os
import requests
from bs4 import BeautifulSoup
import json
import sys

# Ensure the script uses UTF-8 encoding for output
sys.stdout.reconfigure(encoding='utf-8')

# File to store the last processed tags for each link
last_tag_file = 'lasttags.json'

# List of URLs
urls = [
    'https://t.me/s/goyalarsh',
    'https://t.me/s/internfreak',
    'https://t.me/s/techwithmukulcode',
    'https://t.me/s/TechProgramMind_official',
    'https://t.me/s/gocareers',
    'https://t.me/s/riddhi_dutta',
    'https://web.telegram.org/k/#@yet_another_internship_finder'
]

# Function to check if a message contains valid data based on keywords
def keywords(content):
    if "hiring" in content:
        return True
    if "company" in content or "role" in content or "location" in content:
        if "role" in content:
            return True
    return False

# Function to read the last processed tags from the JSON file
def read_last_tags(file_path):
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as file:
            return json.load(file)
    return {}

# Function to write the last processed tags to the JSON file
def write_last_tags(file_path, tags):
    with open(file_path, 'w', encoding='utf-8') as file:
        json.dump(tags, file, ensure_ascii=False, indent=4)

# Function to extract job details from the message content
def extract_job_details(message):
    # For simplicity, this example assumes a basic extraction. Adjust the logic as per the actual content structure.
    lines = message.split('\n')
    main_data = {
        "Company": next((line.split(':')[1].strip() for line in lines if 'Company' in line), 'N/A'),
        "Role": next((line.split(':')[1].strip() for line in lines if 'Role' in line), 'N/A'),
        "Location": next((line.split(':')[1].strip() for line in lines if 'Location' in line), 'N/A'),
        "Link": next((line.split(':')[1].strip() for line in lines if 'Link' in line), 'N/A')
    }
    additional_data = {line.split(':')[0].strip(): line.split(':')[1].strip() for line in lines if ':' in line and 'Company' not in line and 'Role' not in line and 'Location' not in line and 'Link' not in line}
    return {"MainData": main_data, "Additionals": additional_data}

# Read the last processed tags from JSON file
last_tags = read_last_tags(last_tag_file)

# Initialize a list to store all job postings
all_job_posts = []

# Iterate over each URL
for url in urls:
    response = None
    try:
        response = requests.get(url)
    except:
        print(f"Failed to retrieve {url}")
    
    # Parsing HTML content
    soup = BeautifulSoup(response.content, "html.parser")
    
    # Find all job messages
    job_messages = soup.find_all("div", class_="tgme_widget_message_text js-message_text")
    
    # Reverse the order of job messages
    job_messages.reverse()
    
    # Get the last tag
    last_tag = last_tags.get(url)
    
    # Check if the first tag is equal to the last tag
    if last_tag and job_messages and job_messages[0].text.strip() == last_tag:
        continue  # Skip this URL if the first tag is equal to the last tag
    
    # Initialize variables to store new last tag and found new messages
    found_new_messages = not last_tag  # If there's no last tag, consider all messages as new
    
    # Iterate over each job message
    for message in job_messages:
        if last_tag and last_tag in message.text:
            found_new_messages = True 
            break

        if keywords(message.text.lower()):
            # Extract job details and add to all job posts list
            job_details = extract_job_details(message.text)
            all_job_posts.append(job_details)
    
    # Save the first tag from reversed job messages as the last processed tag
    if job_messages:
        last_tags[url] = job_messages[0].text.strip()

# Write the updated last processed tags to the JSON file
write_last_tags(last_tag_file, last_tags)

# Output all job posts as JSON
print(json.dumps(all_job_posts, ensure_ascii=False, indent=4))
