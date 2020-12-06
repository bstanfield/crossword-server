const glob = require('glob-promise');
const fs = require("fs").promises;


const findNewPuzzle = async (dayOfWeek) => {
  const filePaths = await glob('crosswords/**/*.json');
  const crosswordData = await Promise.all(filePaths.map(fp => fs.readFile(fp, 'utf8')))
  const crosswordDataAsJSON = crosswordData.map(cw => JSON.parse(cw))

  const allCrosswordsFromDayOfWeek = crosswordDataAsJSON.filter(cw => cw.dow === dayOfWeek)
  const randomCrossword = allCrosswordsFromDayOfWeek[Math.floor(Math.random() * allCrosswordsFromDayOfWeek.length)];
  return randomCrossword;
};