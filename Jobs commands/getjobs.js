// Jobs.js
import fs from 'fs/promises'; // Import fs.promises using ES module syntax
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve the directory of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default class Jobs {
   #socket;
   #getText;
   #sendMessage;
   #membersLimit;
   #trigger;

   constructor(config = {}) {
      this.#membersLimit = config.membersLimit || 100;
      this.#trigger = config.trigger;
   }

   init(socket, getText, sendMessage) {
      this.#socket = socket;
      this.#getText = getText;
      this.#sendMessage = sendMessage;
   }

   async process(key, message) {
      try {
         const grp = await this.#socket.groupMetadata(key.remoteJid);
         const members = grp.participants;
         const text = this.#getText(key, message);

         if (!text.includes("!" + this.#trigger)) return;

         // Path to the JSON data file
         const dataFilePath = path.join(__dirname, 'data.json'); // Adjusted to use __dirname

         // Read and parse JSON data
         const jsonData = JSON.parse(await fs.readFile(dataFilePath, 'utf-8'));

         // Handle the command
         const response = this.handleCommand(text, jsonData);

         if (members.length < this.#membersLimit) {
            await this.#sendMessage(
               key.remoteJid,
               { text: response },
               { quoted: { key, message } }
            );
         }

      } catch (err) {
         console.error("Error in Jobs class:", err);
      }
   }

   getJobsByRole(jobs, role, n) {
      const filteredJobs = jobs.filter(job => job.role.toLowerCase() === role.toLowerCase());
      return filteredJobs.slice(0, n);
   }

   handleCommand(text, jobs) {
      const commandRegex = /^!jobs-position-(.+?)\s(\d+)$/;
      const match = text.match(commandRegex);

      if (match) {
         const role = match[1];
         const n = parseInt(match[2], 10);

         if (isNaN(n) || n < 1 || n > 10) {
            return 'Please provide a number between 1 and 10.';
         }

         const topJobs = this.getJobsByRole(jobs, role, n);

         if (topJobs.length > 0) {
            return topJobs.map(job =>
               `Role: ${job.role}, Company: ${job.company}, Location: ${job.location}`
            ).join('\n');
         } else {
            return 'No jobs found for the specified role.';
         }
      } else {
         return 'Invalid command format. Use !jobs-position-<role> <n>.';
      }
   }
}
