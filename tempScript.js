const {
    findPuzzleBySearchString
} = require("./data");
const moment = require("moment");
  
const main = async () => {
    await findPuzzleBySearchString('01/05/2000');

    // const spelledOut = Date.parse('January 1, 2000');
    // const noZero = Date.parse('1/1/2000');
    // const trailingZero = Date.parse('01/01/2000');

    // console.log(noZero, trailingZero, spelledOut);
}

main();