const fetch = require('node-fetch');
const fs = require('fs');
const moment = require('moment');

// Modify these dates to download new crosswords locally.

var a = moment('2022-09-20');
var b = moment('2022-09-30');

async function init() {
  for (var m = moment(a); m.diff(b, 'days') <= 0; m.add(1, 'days')) {
    const dateToUse = m.format('L');

    let url = 'https://www.xwordinfo.com/JSON/Data.ashx?format=text&date=' + dateToUse;

    let options = {
      method: 'GET',
      "headers": {
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
        "accept-language": "en-US,en;q=0.9",
        "cache-control": "no-cache",
        "pragma": "no-cache",
        "sec-ch-ua": "\".Not/A)Brand\";v=\"99\", \"Google Chrome\";v=\"103\", \"Chromium\";v=\"103\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"macOS\"",
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "same-origin",
        "sec-fetch-user": "?1",
        "upgrade-insecure-requests": "1",
        "cookie": "ASP.NET_SessionId=jphhhsmu01pvz2p2qnbf2tvo",
        "Referer": "https://www.xwordinfo.com/JSON/",
        "Referrer-Policy": "strict-origin-when-cross-origin"
      },
    };

    // Try disabling fetch and running a new fn to check what gaps there are.
    fetch(url, options)
      .then(res => res.json())
      .then(json => {
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

        // console.log('Year: ', year);
        // console.log('Month: ', months[month]);
        // console.log('Day: ', day);

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

              if (fs.existsSync('./crosswords/' + year + '/' + month + '/' + day + '.json')) {
                console.log(m.format('L'), 'File exists already.')
              } else if (fs.existsSync('./crosswords/' + year + '/' + month + '/' + `0${day}` + '.json')) {
                console.log(m.format('L'), 'File exists already.')
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
              if (fs.existsSync('./crosswords/' + year + '/' + month + '/' + day + '.json') || fs.existsSync('./crosswords/' + year + '/' + month + '/' + `0${day}` + '.json')) {
                console.log(m.format('L'), 'File exists already.')
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


