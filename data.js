const glob = require('glob-promise');
const fs = require("fs").promises;


const findNewPuzzle = async (dow) => {
  const filePaths = await glob('crosswords/**/*.json');
  const cwData = await Promise.all(filePaths.map(fp => fs.readFile(fp, 'utf8')))
  const cwJSON = cwData.map(cw => JSON.parse(cw))

  const fifteenByFifteenCrosswords = cwJSON.filter(cw => cw.size.cols === 15 && cw.size.rows === 15)

  const dowCrosswords = fifteenByFifteenCrosswords.filter(cw => cw.dow === dow)
  return dowCrosswords[Math.floor(Math.random() * dowCrosswords.length)];
};

module.exports = {
  findNewPuzzle
}