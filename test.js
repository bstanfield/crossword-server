const fs = require("fs").promises;
const util = require("util");

var myArgs = process.argv.slice(2);

const findNewPuzzle = async (dayOfWeek) => {
  let options = [];
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
    console.log("day groupings: ", dayGroupings);
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
    return crosswords
  } catch (err) {
    console.log("err: ", err);
  }

  // fs.readdir('./crosswords', 'utf8', (err, years) => {
  //   if (err) {
  //     return console.log('err: ', err)
  //   }
  //   years.map(year => {
  //     fs.readdir(`./crosswords/${year}`, 'utf8', (err, months) => {
  //       if (err) {
  //         return console.log('err: ', err)
  //       }
  //       months.map(month => {
  //         fs.readdir(`./crosswords/${year}/${month}`, 'utf8', (err, days) => {
  //           if (err) {
  //             return console.log('err: ', err)
  //           }
  //           days.map(day => {
  //             fs.readFile(`./crosswords/${year}/${month}/${day}`, 'utf8', (err, crossword) => {
  //               if (err) {
  //                 return console.log('err: ', err)
  //               }
  //               try {
  //                 const crosswordJSON = JSON.parse(crossword);
  //                 if (dayOfWeek === crosswordJSON.dow) {
  //                   options.push(crosswordJSON)
  //                 }

  //               } catch (err) {
  //                 console.log('not in JSON format: ', `${year}/${month}/${day}`)
  //               }
  //             })
  //           })
  //         })
  //       })
  //     }
  //     )
  //   })
  // })
  return years;
};

const run = async () => {
  const results = await findNewPuzzle(myArgs[0]);
};

run();
