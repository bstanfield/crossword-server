const glob = require('glob-promise');
const fs = require("fs").promises;

// HARD CODED FOR TESTING
const findNewPuzzle = async (dow) => {
  console.log('retrieving the hardcoded daily puzzle...');
  // WHEN DONE TESTING, REPLACE WITH /**/*.json */
  const filePaths = await glob('crosswords/2021/06/28.json');
  const cwData = await Promise.all(filePaths.map(fp => fs.readFile(fp, 'utf8')))
  const cwJSON = cwData.map(cw => JSON.parse(cw))

  const fifteenByFifteenCrosswords = cwJSON.filter(cw => cw.size.cols === 15 && cw.size.rows === 15)

  // UNCOMMENT AND REMOVE DUPLICATE LINE
  // const dowCrosswords = fifteenByFifteenCrosswords.filter(cw => cw.dow === dow)
  const dowCrosswords = fifteenByFifteenCrosswords;
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
  const claimed = scores.claimedGuesses.includes(position);
  const puzzleIsComplete = !guesses.includes('');

  // Claimed Guesses
  if (correct && !claimed) {
    scores.claimedGuesses.push(position);
    if (scores.claimedGuessesLookup[player]) {
      scores.claimedGuessesLookup[player].push(position);
    } else {
      scores.claimedGuessesLookup[player] = [position];
    }
  }

  // Case: highestAccuracy
  if (correct && !claimed) {
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
  if (correct && ['x', 'y', 'z'].includes(letter) && !claimed) {
    if (scores.toughLetters[player]) {
      scores.toughLetters[player]++;
    } else {
      scores.toughLetters[player] = 1;
    }
  }

  // Tally incorrect guesses
  if (!correct) {
    if (scores.incorrectGuesses[player]) {
      scores.incorrectGuesses[player].push(position);
    } else {
      scores.incorrectGuesses[player] = [position];
    }
  }

  // Case: Editor (TODO: rename to "Medic")
  if (correct && !claimed) {
    Object.entries(scores.incorrectGuesses).forEach(entry => {
      const incorrectGuessesPlayer = Object.values(entry)[0];
      // Only look at other people's wrong guesses
      if (incorrectGuessesPlayer !== player) {
        if (scores.incorrectGuesses[incorrectGuessesPlayer].includes(position)) {
          // This means someone correctly fixed a previously incorrect guess!
          if (scores.editor[player]) {
            scores.editor[player]++;
          } else {
            scores.editor[player] = 1;
          }
        }
      }
    })
  }

  // Case: hotStreak
  if (correct && !claimed) {
    if (scores.hotStreak[player]) {
      const lastItem = scores.hotStreak[player].length - 1;
      scores.hotStreak[player][lastItem] = scores.hotStreak[player][lastItem] + 1;
    } else {
      scores.hotStreak[player] = [1];
    }
  }
  if (!correct && scores.hotStreak[player] && !claimed) {
    const lastItem = scores.hotStreak[player].length - 1;

    // Prevents endless number of 0's for endless incorrect guesses
    if (scores.hotStreak[player][lastItem] !== 0) {
      scores.hotStreak[player].push(0);
    }
  }

  // Longest word
  if (puzzleIsComplete) {
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
          // break;
          // ^ is this important?
        }
      }

      if (successfulMapping) {
        scores.longestWord[person] = longestWord.word;
      } else {
        scores.longestWord['2+ people'] = longestWord.word;
      }
    })
  }

  // Case: Thief
  if (puzzleIsComplete) {
    // Let's start with across
    const thiefScores = {};

    Object.entries(scores.claimedGuessesLookup).forEach(entry => {
      const [person, values] = entry;
      let thiefScore = 0;

      const wordMappings = [...mappings.across, ...mappings.down];

      // Map over each word...
      wordMappings.map(mapping => {
        // positions = ie [0, 1, 2, 3]
        let lettersAnsweredInWord = 0;
        const positions = Object.values(mapping)[0];

        // Map over each letter in word...
        positions.map(position => {
          if (values.includes(position)) {
            lettersAnsweredInWord++;
          }
        })

        if (lettersAnsweredInWord === 1) {
          thiefScore++;
        }
      })

      thiefScores[person] = thiefScore;
    })
    scores.thief = thiefScores;
  }

  // Case: Benchwarmer
  if (puzzleIsComplete) {
    let benchwarmerScores = {};
    Object.entries(scores.claimedGuessesLookup).forEach(entry => {
      const [person, values] = entry;
      benchwarmerScores[person] = values.length;
    })

    scores.benchwarmer = benchwarmerScores;
  }

  // Case: Workhorse
  if (puzzleIsComplete) {
    let workhorseScores = {};
    Object.entries(scores.claimedGuessesLookup).forEach(entry => {
      const [person, values] = entry;
      workhorseScores[person] = values.length;
    })
    scores.workhorse = workhorseScores;
  }

  // Check if puzzle is complete AND the last answer was correct
  // TODO: This actually might not provide the 100% correct completed_at time -- puzzle should 
  // only be complete if THERE ARE NO INCORRECTS
  if (correct && puzzleIsComplete) {
    const completed_at = new Date();
    return completed_at;
  }

}

module.exports = {
  findNewPuzzle,
  createDownAndAcrossWordGroupings,
  checkIfLetterAddsToScore,
}