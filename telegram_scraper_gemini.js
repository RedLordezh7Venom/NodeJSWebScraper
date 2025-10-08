import fs from 'fs';
import { JSDOM } from 'jsdom';
import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Load environment variables
const GOOGLE_AI_KEY = process.env.GOOGLE_AI_KEY;

// Configure the generative AI model
const genAI = new GoogleGenerativeAI(GOOGLE_AI_KEY);

const textGenerationConfig = {
  temperature: 0.5,
  top_p: 1,
  top_k: 1,
  max_output_tokens: 512,
};

const safetySettings = [
  { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
  { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
];

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
  'https://web.telegram.org/k/#@yet_another_internship_finder',
];

// Function to check if a message contains valid data based on keywords
const keywords = (content) => {
  if (content.includes('hiring')) return true;
  if (content.includes('company') || content.includes('role') || content.includes('location')) {
    if (content.includes('role')) return true;
  }
  return false;
};

// Function to read the last processed tags from the JSON file
const readLastTags = (filePath) => {
  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  }
  return {};
};

// Function to write the last processed tags to the JSON file
const writeLastTags = (filePath, tags) => {
  const data = JSON.stringify(tags, null, 4);
  fs.writeFileSync(filePath, data, 'utf8');
};

// Read the last processed tags from JSON file
const lastTags = readLastTags(lastTagFile);

// Iterate over each URL
(async () => {
  for (const url of urls) {
    try {
      const response = await axios.get(url);
      const htmlContent = response.data;

      // Parse HTML content with jsdom
      const { document } = (new JSDOM(htmlContent)).window;
      const jobMessages = Array.from(document.querySelectorAll('.tgme_widget_message_text.js-message_text'));

      // Reverse the order of job messages
      jobMessages.reverse();

      // Get the last tag
      const lastTag = lastTags[url];

      // Check if the first tag is equal to the last tag
      if (lastTag && jobMessages.length > 0 && jobMessages[0].textContent.trim() === lastTag) {
        continue; // Skip this URL if the first tag is equal to the last tag
      }

      // Initialize variables to store new last tag and found new messages
      let foundNewMessages = !lastTag; // If there's no last tag, consider all messages as new

      // Iterate over each job message
      for (const message of jobMessages) {
        if (lastTag && message.textContent.includes(lastTag)) {
          foundNewMessages = true;
          break;
        }

        if (keywords(message.textContent.toLowerCase())) {
          // Print new job message
          console.log(`Job Post from ${url}`);
          console.log(message.textContent);
          console.log();

          // Uncomment and adjust the following block to use the Generative AI model
          const prompt = `Generate the following data in JSON form with the following format: {MainData: {Company: '', Role: '', Location: '', Link: ''}, Additionals: {// with any keys as per posting like batch, duration, type, salary}}} ${message.textContent}`;
          const result = await genAI.generateText({
            prompt,
            generationConfig: textGenerationConfig,
            safetySettings,
          });
          console.log(result);
          
        }
      }

      // Save the first tag from reversed job messages as the last processed tag
      if (jobMessages.length > 0) {
        lastTags[url] = jobMessages[0].textContent.trim();
      }
    } catch (error) {
      console.error(`Error fetching URL ${url}:`, error);
    }
  }

  // Write the updated last processed tags to the JSON file
  writeLastTags(lastTagFile, lastTags);
})();
