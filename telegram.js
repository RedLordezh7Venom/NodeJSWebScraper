import axios from 'axios';
import cheerio from 'cheerio'; 
import  fs from 'fs';
import path from 'path';

// File to store the last processed tags for each link
const lastTagFile = 'lasttags.json';

// List of URLs
const urls = [
    'https://t.me/s/goyalarsh',
    'https://t.me/s/internfreak',
    'https://t.me/s/techwithmukulcode',
    'https://t.me/s/TechProgramMind_official',
    'https://t.me/s/gocareers',
    'https://t.me/s/riddhi_dutta',
    'https://web.telegram.org/k/#@yet_another_internship_finder'
];

// Function to check if a message contains valid data based on keywords
function keywords(content) {
    if (content.includes("hiring")) return true;
    if (content.includes("company") || content.includes("role") || content.includes("location")) {
        if (content.includes("role")) return true;
    }
    return false;
}

// Function to read the last processed tags from the JSON file
function readLastTags(filePath) {
    if (fs.existsSync(filePath)) {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
    return {};
}

// Function to write the last processed tags to the JSON file
function writeLastTags(filePath, tags) {
    fs.writeFileSync(filePath, JSON.stringify(tags, null, 4), 'utf8');
}

// Function to extract job details from the message content
function extractJobDetails(message) {
    const mainData = {
        Company: 'N/A',
        Role: 'N/A',
        Location: 'N/A',
        Salary: 'N/A',
        Link: 'N/A'
    };

    const additionalData = {};

    // Extract Company
    const companyMatch = message.match(/Company\s*Name\s*:\s*(.*?)(?=\n|Role\s*|Batch\s*|Location\s*|Stipend\s*|Salary\s*|Link\s*|KnowMore\s*|Know More\s*|Skill Set\s*|Skillset\s*|http:\/\/|https:\/\/|www\.|$)/i);
    const hiringMatch = message.match(/\b(\w+)\s*is\s*hiring\b/i);
    if (companyMatch) {
        mainData.Company = companyMatch[1].trim();
    }
    if (hiringMatch) {
        mainData.Company = hiringMatch[1].trim();
    }


    // Extract Role
    const roleMatch = message.match(/(?:Role|Roles)\s*:\s*(.*?)(?=\n|Batch\s*|Location\s*|Stipend\s*|Salary\s*|Link\s*|KnowMore\s*|Know More\s*|Skill Set\s*|Skillset\s*|Company\s*|http:\/\/|https:\/\/|www\.|$)/i);
    const hiringRole = message.match(/is\s+hiring(?:\s+for)?\s*(.*?)(?=\s*(?:Location|Batch|SkillSet|Skill\s+set|Know\s+More|KnowMore|Stipend|Salary|For|$))/i);
    if (roleMatch) {
        mainData.Role = roleMatch[1].trim();
    }
    if (hiringRole){
        mainData.Role = hiringRole[1].trim();
    }

    // Extract Location
    const locationMatch = message.match(/Location\s*:\s*(.*?)(?=\n|Role\s*|Batch\s*|Stipend\s*|Salary\s*|Link\s*|KnowMore\s*|Know More\s*|Skill Set\s*|Skillset\s*|Company\s*|http:\/\/|https:\/\/|www\.|$)/i);
    if (locationMatch) {
        mainData.Location = locationMatch[1].trim();
    }

    // Extract Salary or Stipend
    const salaryMatch = message.match(/(?:Stipend|Salary)\s*:\s*(.*?)(?=\n|Role\s*|Batch\s*|Location\s*|Link\s*|KnowMore\s*|Know More\s*|Skill Set\s*|Skillset\s*|Company\s*|http:\/\/|https:\/\/|www\.|$)/i);
    if (salaryMatch) {
        mainData.Salary = salaryMatch[1].trim();
    }

    // Extract Link
    const linkMatch = message.match(/Link\s*:\s*(https?:\/\/[^\s]+)/i);
    if (linkMatch) {
        mainData.Link = linkMatch[1].trim();
    } else {
        // Extract any remaining https links directly from the message
        const httpsLinks = message.match(/https:\/\/[^\s]+/g);
        if (httpsLinks && httpsLinks.length > 0) {
            mainData.Link = httpsLinks[0].trim(); // Use the first link found
        }
    }

    // Extract remaining fields as additional data
    const remainingLines = message.split('\n').filter(line => line.trim() !== '');
    remainingLines.forEach(line => {
        const [key, ...valueParts] = line.split(':');
        if (key && valueParts.length) {
            const keyTrimmed = key.trim();
            const valueTrimmed = valueParts.join(':').trim();
            if (keyTrimmed && !Object.keys(mainData).includes(keyTrimmed)) {
                additionalData[keyTrimmed] = valueTrimmed;
            }
        }
    });

    return { MainData: mainData, Additionals: {} };
}


// Read the last processed tags from JSON file
const lastTags = readLastTags(lastTagFile);

// Initialize an array to store all job postings
const allJobPosts = [];

// Main function to scrape job posts
async function scrapeJobs() {
    for (const url of urls) {
        try {
            const response = await axios.get(url);
            const $ = cheerio.load(response.data);

            // Find all job messages
            const jobMessages = [];
            $('.tgme_widget_message_text.js-message_text').each((i, el) => {
                jobMessages.push($(el).text().trim());
            });

            // Reverse the order of job messages
            jobMessages.reverse();

            // Get the last tag
            const lastTag = lastTags[url];

            // Check if the first tag is equal to the last tag
            if (lastTag && jobMessages.length > 0 && jobMessages[0] === lastTag) {
                continue; // Skip this URL if the first tag is equal to the last tag
            }

            // Initialize variables to store new last tag and found new messages
            let foundNewMessages = !lastTag; // If there's no last tag, consider all messages as new

            // Iterate over each job message
            for (const message of jobMessages) {
                if (lastTag && message.includes(lastTag)) {
                    foundNewMessages = true;
                    break;
                }

                if (keywords(message.toLowerCase())) {
                    // Extract job details and add to all job posts list
                    const jobDetails = extractJobDetails(message);
                    allJobPosts.push(jobDetails);
                }
            }

            // Save the first tag from reversed job messages as the last processed tag
            if (jobMessages.length > 0) {
                lastTags[url] = jobMessages[0];
            }
        } catch (error) {
            console.error(`Error scraping ${url}:`, error);
        }
    }

    // Write the updated last processed tags to the JSON file
    writeLastTags(lastTagFile, lastTags);

    // Output all job posts as JSON
    console.log(JSON.stringify(allJobPosts, null, 4));
}

// Run the scrapeJobs function
scrapeJobs();
