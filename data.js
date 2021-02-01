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

const createDownAndAcrossWordGroupings = (board) => {
  let word = ''
  let wordPositions = [];

  let acrossWordMappings = [];
  let acrossRowPosition = 0;
  board.grid.map((letter, index) => {
    acrossRowPosition++;

    if (letter === '.') {
      if (word !== '') acrossWordMappings.push({ [word]: wordPositions })
      word = ''
      wordPositions = []
    } else {
      word = word + letter
      wordPositions.push(index + 1);
    }

    if (acrossRowPosition === 15) {
      if (word !== '') acrossWordMappings.push({ [word]: wordPositions });
      acrossRowPosition = 0;
      word = '';
      wordPositions = [];
    }
  })

  let position = 1
  let grouping = []
  while (position <= 225) {
    if (board.grid[position - 1] !== '.') {
      let match = false
      if (grouping.length === 0) {
        grouping.push([position])
      } else {
        grouping.map((group, index) => {
          if (group.includes(position - 15)) {
            match = true
            grouping[index].push(position)
          }
        })
        if (!match) {
          grouping.push([position])
        }
      }
    }
    position++;
  }

  // TODO: Use this code to add to ijnitial obj instead of using frontend
  const downWordMappings = grouping.map(group => {
    let word = '';
    let positions = [];
    group.map(position => {
      word = word + board.grid[position - 1];
      positions.push(position);
    });
    return { [word]: positions };
  })

  return {
    down: downWordMappings,
    across: acrossWordMappings,
  }
}

const searchDirectionForLongestWord = (mapping) => {
  let longestWord = { word: '', positions: [], direction: '' };
  mapping.map(wordMappingObj => {
    Object.entries(wordMappingObj).forEach(entry => {
      const [word, positions] = entry;
      if (word.length > longestWord.word.length) {
        longestWord = { word, positions, direction: 'across' }
      }
    })
  })
  return longestWord;
}

const findLongestWord = (mappings, scores) => {
  const longestAcross = searchDirectionForLongestWord(mappings.across);
  const longestDown = searchDirectionForLongestWord(mappings.down);
  return longestAcross.word.length > longestDown.word.length ? longestAcross : longestDown;

}

const checkIfLetterAddsToScore = (puzzle, player, position, letter, correct) => {
  // mappings = mapping of answer strings to positions on board (ie 'JETS' => 1, 2, 3, 4)
  const { scores, mappings, guesses } = puzzle;
  letter = letter.toLowerCase();
  // Claimed Guesses
  if (correct) {
    scores.claimedGuesses.push(position);
    if (scores.claimedGuessesLookup[player]) {
      scores.claimedGuessesLookup[player].push(position);
    } else {
      scores.claimedGuessesLookup[player] = [position];
    }
  }

  // Case: highestAccuracy
  if (correct) {
    if (scores.highestAccuracy[player]) {
      scores.highestAccuracy[player].correct++;
    } else {
      scores.highestAccuracy[player] = { correct: 1, incorrect: 0 };
    }
  } else {
    if (scores.highestAccuracy[player]) {
      scores.highestAccuracy[player].incorrect++;
    } else {
      scores.highestAccuracy[player] = { correct: 0, incorrect: 1 };
    }
  }

  // Case: toughLetters
  if (correct && ['x', 'y', 'z'].includes(letter)) {
    if (scores.toughLetters[player]) {
      scores.toughLetters[player]++;
    } else {
      scores.toughLetters[player] = 1;
    }
  }

  // Case: hotStreak
  if (correct) {
    if (scores.hotStreak[player]) {
      const lastItem = scores.hotStreak[player].length - 1;
      // Not sure if this works
      scores.hotStreak[player][lastItem] = scores.hotStreak[player][lastItem] + 1;
    } else {
      scores.hotStreak[player] = [1];
    }
  }
  if (!correct && scores.hotStreak[player]) {
    const lastItem = scores.hotStreak[player].length - 1;

    // Prevents endless number of 0's for endless incorrect guesses
    if (scores.hotStreak[player][lastItem] !== 0) {
      scores.hotStreak[player].push(0);
    }
  }

  // Longest word
  // TODO: Make sure this conditional *works* && !guesses.includes('')
  if (correct) {
    const longestWord = findLongestWord(mappings, scores);

    Object.entries(scores.claimedGuessesLookup).forEach(entry => {
      const [person, values] = entry;
      // values = [1,2,3]
      // person = 'ben'

      // check each number in positions and if it exists in person's values
      let successfulMapping = false;
      for (const position of longestWord.positions) {
        if (values.includes(position)) {
          successfulMapping = true;
        } else {
          successfulMapping = false;
          break;
        }
      }

      if (successfulMapping) {
        scores.longestWord[person] = longestWord.word;
        console.log('MATCH: ', longestWord.word, ' from ', person);
      } else {
        scores.longestWord['2 people'] = longestWord.word;
        console.log('No one has answered longest word ', longestWord.word)
      }
    })
  }

}

module.exports = {
  findNewPuzzle,
  createDownAndAcrossWordGroupings,
  checkIfLetterAddsToScore,
}