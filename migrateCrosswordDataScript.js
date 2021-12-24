const fetch = require('node-fetch');
const fs = require('fs').promises;
const moment = require('moment');
const db = require('./db');
const glob = require('glob-promise');
const { exit } = require('process');


const main = async () => {
    const filePaths = await glob('crosswords/**/*.json');
    const cwData = await Promise.all(filePaths.map(fp => fs.readFile(fp, 'utf8')));

    let crosswordCount = 0;
    let total = cwData.length;
    while (crosswordCount < total) {
        console.log('on crossword: ', crosswordCount)
        await db.addPuzzleDataToPuzzlesTable(JSON.parse(cwData[crosswordCount]))
        crosswordCount++;
    }
    
    console.log('success!')
    exit
}

main()
