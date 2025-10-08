def run_code():
    print("hi")
    import requests
    from bs4 import BeautifulSoup
    import csv
    import datetime
    import math

    # Set the target URL template for the internship search with a placeholder for page number
    target_url = 'https://www.linkedin.com/jobs/search/?currentJobId=3977230580&keywords=tech%20jobs&location=India&origin=JOBS_HOME_SEARCH_BUTTON&refresh=true'

    # Initialize for storing the job IDs
    job_ids = set()

    # Headers to mimic a real browser
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }

    # Loop to extract unique job IDs
    for i in range(0, math.ceil(117/25)):
        res = requests.get(target_url.format(i), headers=headers)
        soup = BeautifulSoup(res.text, 'html.parser')
        all_jobs_on_this_page = soup.find_all('li')

        for job_elem in all_jobs_on_this_page:
            base_card_elem = job_elem.find('div',class_ = 'base-card')
            if base_card_elem:
                job_id = base_card_elem.get('data-entity-urn').split(":")[3]
                job_ids.add(job_id)

    # Initialize to store the scraped data
    scraped_data = []
    print("mid")
    # Loop through unique job IDs and scrape job details
    for job_id in job_ids:
        target_url_job = f"https://www.linkedin.com/jobs/search/?currentJobId={job_id}keywords=tech%20jobs&location=India&origin=JOBS_HOME_SEARCH_BUTTON&refresh=true'"
        res = requests.get(target_url_job, headers=headers)
        soup = BeautifulSoup(res.text, 'html.parser')

        job_details = {}

        # Check for sign-in prompt
        # if "sign in" in soup.get_text().lower():
        #     print(f"Sign-in required for job ID {job_id}, skipping.")
        #     continue

        try:
            job_role_elem = soup.find('h3',class_='base-search-card__title')
            job_details["Job Role"] = job_role_elem.text.strip() if job_role_elem else "Not Available"
        except Exception as e:
            print(f"Error extracting job role: {e}")
            job_details["Job Role"] = "Error"

        try:
            company_elem = soup.find('a',class_="hidden-nested-link")
            job_details["company"] = company_elem.text.strip() if company_elem else "Not Available"
        except Exception as e:
            print(f"Error extracting company: {e}")
            job_details["company"] = "Error"

        location_elem = soup.find('span', class_ = 'job-search-card__location')
        job_details["location"] = location_elem.text.strip() if location_elem else "Location Not Available"

        job_apply_link = soup.find('a', class_='base-card__full-link')
        job_details["apply"] = job_apply_link['href'] if job_apply_link else "Application Link Not Available"

        scraped_data.append(job_details)

    with open('scrapper.csv', 'w', newline='',encoding='utf-8') as file:
        writer = csv.DictWriter(file, fieldnames=['Job Role', 'company', 'location', 'apply'])
        writer.writeheader()
        writer.writerows(scraped_data)

    print("Data scraped and saved to scrapper.csv")
    print("Code executed at:", datetime.datetime.now())

if __name__ == '__main__':
    run_code()
    