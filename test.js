const fs = require("fs").promises;
const util = require("util");

var myArgs = process.argv.slice(2);

const findNewPuzzle = async (dayOfWeek) => {
  let years;
  let monthGroupings;
  let dayGroupings;
  try {
    years = await fs.readdir("./crosswords");
    // Arrays of months per year
    monthGroupings = await Promise.all(
      years.map((year) => fs.readdir(`./crosswords/${year}`))
    );
    // Array per year with array per month
    dayGroupings = await Promise.all(
      monthGroupings.map(
        async (monthGrouping, index) =>
          await Promise.all(
            monthGrouping.map((month) =>
              fs.readdir(`./crosswords/${years[index]}/${month}`)
            )
          )
      )
    );
    crosswords = await Promise.all(
      dayGroupings.map(
        async (yearGrouping, yearIndex) =>
          await Promise.all(
            yearGrouping.map(
              async (month, monthIndex) =>
                await Promise.all(
                  month.map((fileName) =>
                    fs.readFile(
                      `./crosswords/${years[yearIndex]}/${monthGroupings[yearIndex][monthIndex]}/${fileName}`,
                      "utf-8"
                    )
                  )
                )
            )
          )
      )
    );
  } catch (err) {
    console.log('err: ', err)
  }
  return crosswords[0].flat()
};

const run = async () => {
  const results = await findNewPuzzle(myArgs[0]);
  let jsonResults = []
  results.map(result => {
    try {
      jsonResults.push(JSON.parse(result))
    } catch (e) {
      console.log('e: ', e, result)
    }
  })
  console.log('json results: ', jsonResults)
};

run();
