// index.js
import Jobs from './getjobs.js';
 
// Mock functions and data
const mockSocket = {
   groupMetadata: async () => ({
      participants: Array(5).fill({}) // Mock group members
   })
};

const mockGetText = (key, message) => message.text; // Mock getText function
const mockSendMessage = async (jid, message, options) => {
   console.log(`Message sent to ${jid}: ${message.text}`);
};

// Instantiate and use the Jobs class
const jobs = new Jobs({ membersLimit: 100, trigger: 'jobs' });
jobs.init(mockSocket, mockGetText, mockSendMessage);

// Test with a sample command
const key = { remoteJid: 'test-group-id' };
const message = { text: '!jobs-position-data scientist 2' };

(async () => {
   await jobs.process(key, message);
})();
