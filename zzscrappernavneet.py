import time
import datetime

def run_code():
    print("hi")
    import requests
    from bs4 import BeautifulSoup
    import csv
    import math

    # Set the target URL template for the internship search with a placeholder for page number
    target_url = 'https://www.linkedin.com/jobs/search/?currentJobId=3977230580&keywords=tech%20jobs&location=India&origin=JOBS_HOME_SEARCH_BUTTON&refresh=true'

    # Initialize for storing the job IDs
    job_ids = set()

    # Loop to extract unique job IDs
    for i in range(0, math.ceil(117/25)):
        res = requests.get(target_url.format(i))
        soup = BeautifulSoup(res.text, 'html.parser')
        all_jobs_on_this_page = soup.find_all("li")

        for job_elem in all_jobs_on_this_page:
            base_card_elem = job_elem.find("div", {"class": "base-card"})
            if base_card_elem:
                job_id = base_card_elem.get('data-entity-urn').split(":")[3]
                job_ids.add(job_id)

    # Initialize to store the scraped data
    scraped_data = []
    print("mid")
    # Loop through unique job IDs and scrape job details
    for job_id in job_ids:
        target_url_job = f"https://www.linkedin.com/jobs/search/?currentJobId={job_id}&keywords=tech%20jobs&location=India&origin=JOBS_HOME_SEARCH_BUTTON&refresh=true"
        resp = requests.get(target_url_job)
        soup = BeautifulSoup(resp.text, 'html.parser')

        job_details = {}

        heading_tags = ["h3"]
        for tags in soup.find_all('h3',class_='base-search-card__title'):
            job_details["Job Role"]=tags.text.strip()
        heading_tags2 = ["h4"]
        for tags2 in soup.find_all(heading_tags2):
            job_details["company"]=tags2.text.strip()
        location_elem = soup.find('span', class_="job-search-card__location")
        if location_elem:
            job_details["location"] = location_elem.text.strip()
        else:
            job_details["location"] = "Location Not Available"

        job_apply_link = soup.find('a', class_='base-card__full-link')
        if job_apply_link:
            job_details["apply"] = job_apply_link['href']
        else:
            job_details["apply"] = "Application Link Not Available"


        scraped_data.append(job_details)


    with open('scrapper.csv', 'w', newline='') as file:
        writer = csv.DictWriter(file, fieldnames=['Job Role', 'company', 'location', 'apply'])
        writer.writeheader()
        writer.writerows(scraped_data)

    print("Data scraped and saved to scrapper.csv")
    print("Code executed at:", datetime.datetime.now())

last_execution = datetime.datetime.now()

while True:
    print("start")
    # elapsed_time = datetime.datetime.now() - last_execution
    # if elapsed_time.total_seconds() > 12 * 60 * 60:
    run_code()
    #     last_execution = datetime.datetime.now()
    # time.sleep(10) # Sleep for 10 seconds before checking the elapsed time again