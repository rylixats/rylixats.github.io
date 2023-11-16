const fs = require('fs');
const wordListPath = require('word-list');

// Convert the array to JSON
let wordArray = fs.readFileSync(wordListPath, 'utf8').split('\n');
let json = JSON.stringify(wordArray);

// Write the JSON to a file
fs.writeFileSync('etc/words.json', json);
