import os
import requests
from datetime import datetime, timedelta
from bs4 import BeautifulSoup
import google.generativeai as genai
from dotenv import load_dotenv
import json
import sys

# Load environment variables
load_dotenv()
#add gemini key in .env file
GOOGLE_AI_KEY = os.environ.get('GOOGLE_AI_KEY')

# Configure the generative AI model
genai.configure(api_key=GOOGLE_AI_KEY)
text_generation_config = {
    "temperature": 0.5,
    "top_p": 1,
    "top_k": 1,
    "max_output_tokens": 512,
}
safety_settings = [{
    "category": "HARM_CATEGORY_HARASSMENT",
    "threshold": "BLOCK_MEDIUM_AND_ABOVE"
}, {
    "category": "HARM_CATEGORY_HATE_SPEECH",
    "threshold": "BLOCK_MEDIUM_AND_ABOVE"
}, {
    "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
    "threshold": "BLOCK_MEDIUM_AND_ABOVE"
}, {
    "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
    "threshold": "BLOCK_MEDIUM_AND_ABOVE"
}]
text_model = genai.GenerativeModel(model_name="gemini-pro",
                                   generation_config=text_generation_config,
                                   safety_settings=safety_settings)

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

# Read the last processed tags from JSON file
last_tags = read_last_tags(last_tag_file)

# Iterate over each URL
for url in urls:

    response = requests.get(url)
    
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
            # Print new job message
            print("Job Post from", url)
            prompt = f"Generate the following data in JSON form with the following format: {{MainData: {{Company: '', Role: '', Location: '', Link: ''}}, Additionals: {{// with any keys as per posting like batch, duration, type, salary}}}} {message.text}"
            cleaned_text = text_model.generate_content(prompt)
            print(cleaned_text.text.strip())
            print()

            #break
            
            
    
    # Save the first tag from reversed job messages as the last processed tag
    if job_messages:
        last_tags[url] = job_messages[0].text.strip()

# Write the updated last processed tags to the JSON file
write_last_tags(last_tag_file, last_tags)
