// Shared in-memory store for demo purposes only
// Replace with a database in production
// WARNING: Jobs will be lost when server restarts!

const fs = require('fs');
const path = require('path');

const JOBS_FILE = path.join(__dirname, '..', '..', 'data', 'jobs.json');

// Ensure data directory exists
const dataDir = path.dirname(JOBS_FILE);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let inMemoryJobs = [];

// Try to load existing jobs from file
try {
  if (fs.existsSync(JOBS_FILE)) {
    const data = fs.readFileSync(JOBS_FILE, 'utf8');
    inMemoryJobs = JSON.parse(data);
    console.log('📁 Loaded', inMemoryJobs.length, 'jobs from file');
  } else {
    console.log('📁 No existing jobs file found, starting with empty store');
  }
} catch (error) {
  console.error('❌ Error loading jobs from file:', error);
  inMemoryJobs = [];
}

// Function to save jobs to file
const saveJobsToFile = () => {
  try {
    fs.writeFileSync(JOBS_FILE, JSON.stringify(inMemoryJobs, null, 2));
    console.log('💾 Saved', inMemoryJobs.length, 'jobs to file');
  } catch (error) {
    console.error('❌ Error saving jobs to file:', error);
  }
};

// Add a warning log when the store is initialized
console.log('⚠️  WARNING: Using file-based job store. This is a temporary solution!');
console.log('⚠️  Consider implementing database persistence for production use.');

module.exports = {
  inMemoryJobs,
  saveJobsToFile
};


