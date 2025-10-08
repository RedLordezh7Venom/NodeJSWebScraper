import puppeteer from 'puppeteer';

(async () => {
    const currentTimestamp = new Date().toLocaleDateString(); // Get the current date

    // Launch the browser
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    try {
        // Navigate to the website
        await page.goto('https://www.naukri.com/internship-jobs?src=discovery_trendingWdgt_homepage_srch&functionAreaIdGid=5&jobAge=1', {
            waitUntil: 'networkidle2',
        });

        // Wait for the first set of job listings to load
        await page.waitForSelector('.srp-jobtuple-wrapper');

        // Scrape job data from the first selector
        const jobsFromFirstSelector = await page.evaluate((currentTimestamp) => {
            const jobNodes = document.querySelectorAll('.srp-jobtuple-wrapper');

            const jobs = [];
            jobNodes.forEach(job => {
                const Role = job.querySelector('.title')?.innerText || 'N/A';
                const Company = job.querySelector('.comp-name')?.innerText || 'N/A';
                const Location = job.querySelector('.locWdth')?.innerText || 'N/A';
                const Stipend = job.querySelector('.sal-wrap.ver-line')?.innerText || 'N/A';
                const Date = job.querySelector('.job-post-day')?.innerText || currentTimestamp;
                const ApplyLink = job.querySelector('.title a')?.href || 'N/A';

                jobs.push({
                    mainData: { Role, Company, Location, ApplyLink },
                    additionalData: { Stipend, Date }
                });
            });

            return jobs;
        }, currentTimestamp);

        // Print the filtered job data
        jobsFromFirstSelector.forEach((job, index) => {
            console.log("Main Data:");
            console.log(job.mainData);
            console.log("Additional Data:");
            console.log(job.additionalData);
            console.log('---------------------------');
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await browser.close();
    }
})();
