const fetch = require('node-fetch');
const fs = require('fs');
const moment = require('moment');

var a = moment('2022-01-01');
var b = moment('2022-08-06');

async function init() {
  for (var m = moment(a); m.diff(b, 'days') <= 0; m.add(1, 'days')) {
    console.log(m.format('L'));
    const dateToUse = m.format('L');

    let url = 'https://www.xwordinfo.com/JSON/Data.ashx?format=text&date=' + dateToUse;

    let options = {
      method: 'GET',
      headers: {
        Connection: 'keep-alive',
        'sec-ch-ua': '" Not;A Brand";v="99", "Google Chrome";v="91", "Chromium";v="91"',
        'sec-ch-ua-mobile': '?0',
        Accept: '*/*',
        'Sec-Fetch-Site': 'cross-site',
        'Sec-Fetch-Mode': 'no-cors',
        'Sec-Fetch-Dest': 'empty',
        Referer: 'http://localhost:7000/',
        'Accept-Language': 'en-US,en;q=0.9',
        cookie: 'ASP.NET_SessionId=rma4cngoytmp2gcyf5a2gs3l; ARRAffinity=b84cfd8a83b6d9093e8bb66a11c64ff85f40266f8f5aeef3fc332cffffb9d643; WAWebSiteSID=cef7c92e37d141f0b5bb8ef1e074db95; '
      }
    };

    console.log('hitting URL: ', url);

    fetch(url, options)
      .then(res => res.json())
      .then(json => {
        console.log('Adding file to directory!');

        const months = [
          '01',
          '02',
          '03',
          '04',
          '05',
          '06',
          '07',
          '08',
          '09',
          '10',
          '11',
          '12'
        ]

        const year = new Date(json.date).getFullYear();
        const month = new Date(json.date).getMonth();
        const day = new Date(json.date).getDate();

        console.log('Year: ', year);
        console.log('Month: ', months[month]);
        console.log('Day: ', day);

        const findOrCreateDirectory = (year, month, day) => {
          fs.access('./crosswords/' + year + '/' + month, function (error) {
            if (error) {
              console.log('Directory does not exist.')
              console.log('Creating directory...');
              fs.mkdirSync(process.cwd() + '/crosswords/' + year + '/' + month, { recursive: true }, (error) => {
                if (error) {
                  console.error('An error occur: ', error);
                } else {
                  console.log('Directory created');
                }
              })

              console.log('Adding JSON file...')
              if (fs.existsSync('./crosswords/' + year + '/' + month + '/' + day + '.json')) {
                console.log('File exists already.')
              } else {
                fs.writeFile('./crosswords/' + year + '/' + month + '/' + day + '.json', JSON.stringify(json), (error) => {
                  if (error) {
                    console.error('An error occur: ', error);
                  } else {
                    console.log('File added!', year, month, day);
                  }
                })
              }

            } else {
              console.log("Directory exists.")
              console.log('Adding JSON file...')
              if (fs.existsSync('./crosswords/' + year + '/' + month + '/' + day + '.json')) {
                console.log('File exists already.')
              } else {
                fs.writeFile('./crosswords/' + year + '/' + month + '/' + day + '.json', JSON.stringify(json), (error) => {
                  if (error) {
                    console.error('An error occur HERE: ', error);
                  } else {
                    console.log('File added!', year, month, day);
                  }
                })
              }
            }
          })
        }

        findOrCreateDirectory(year, months[month], day)

      })
      .catch(err => console.error('error:' + err));

    await sleep(2000);
  }
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

init()


