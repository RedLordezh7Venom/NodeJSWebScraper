import axios from 'axios';
import cheerio from 'cheerio';
import fs from 'fs';

const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
};

const url = 'https://www.linkedin.com/jobs/search?keywords=Tech%20Jobs&location=India&geoId=102713980&f_TPR=r86400&position=1&pageNum=0';

// Function to fetch and parse the page
async function fetchPage(url) {
    try {
        const { data } = await axios.get(url, { headers });
        const $ = cheerio.load(data);

        // List to store job details
        const jobListings = [];

        // Find all job postings
        $('div.base-search-card__info').each((i, element) => {
            const companyTag = $(element).find('a.hidden-nested-link').text().trim() || 'N/A';
            const roleTag = $(element).find('h3.base-search-card__title').text().trim() || 'N/A';
            const locationTag = $(element).find('span.job-search-card__location').text().trim() || 'N/A';
            const linkTag = $(element).find('a.hidden-nested-link').attr('href') || 'N/A';
            const timeTag = $(element).find('time.job-search-card__listdate--new').text().trim() || 'N/A';

            const jobDetails = {
                MainData: {
                    Company: companyTag,
                    Role: roleTag,
                    Location: locationTag,
                    Link: linkTag,
                    Posted: timeTag
                }
            };
            console.log(jobDetails)
            jobListings.push(jobDetails);
        });

        // Convert to JSON and save to file
        
        const jobListingsJson = JSON.stringify(jobListings, null, 4);
        fs.writeFileSync('linkedin.json', jobListingsJson, 'utf-8');
        console.log("Job locations have been saved to 'linkedin.json'.");
    } catch (error) {
        console.error('Error fetching the page:', error);
    }
}

// Run the function
fetchPage(url);
