require('dotenv').config();
const emailService = require('./services/emailService');

async function listFolders() {
    try {
        console.log('Fetching folders...');
        const folders = await emailService.getFolders();
        console.log('Folders:', JSON.stringify(folders, null, 2));
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

listFolders();
