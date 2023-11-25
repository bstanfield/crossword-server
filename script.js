const fetch = require("node-fetch");
const fs = require("fs");
const moment = require("moment");
const { execSync } = require("child_process");
require("dotenv").config();

// Configure Git for username and email
try {
  execSync('git config --global user.name "bstanfield"');
  execSync('git config --global user.email "bnstnfld@gmail.com"');
} catch (error) {
  console.error("Error configuring Git:", error);
}

// Configure Git remote URL with PAT
try {
  const githubToken = process.env.GITHUB_TOKEN;
  execSync(
    `git remote set-url origin https://x-access-token:${githubToken}@github.com/bstanfield/crossword-server.git`
  );
} catch (error) {
  console.error("Error setting up Git remote URL:", error);
}

// Function to find the most recent crossword date
function findMostRecentCrosswordDate() {
  const years = fs.readdirSync("./crosswords").sort((a, b) => b - a);
  for (const year of years) {
    const months = fs.readdirSync(`./crosswords/${year}`).sort((a, b) => b - a);
    for (const month of months) {
      const days = fs
        .readdirSync(`./crosswords/${year}/${month}`)
        .map((file) => parseInt(file, 10))
        .sort((a, b) => b - a);
      if (days.length > 0) {
        const latestDay = days[0];
        return moment(`${year}-${month}-${latestDay}`, "YYYY-MM-DD");
      }
    }
  }
  return moment(); // Return current date if no files are found
}

// Define dates for fetching crosswords
var startDate = findMostRecentCrosswordDate();
var endDate = moment(); // Today's date

let newFilesAdded = false; // Flag to track if new files are added

async function init() {
  for (
    var m = moment(startDate);
    m.diff(endDate, "days") <= 0;
    m.add(1, "days")
  ) {
    const dateToUse = m.format("YYYY-MM-DD");
    let url =
      "https://www.xwordinfo.com/JSON/Data.ashx?format=text&date=" + dateToUse;

    let options = {
      method: "GET",
      headers: {
        accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
        "accept-language": "en-US,en;q=0.9",
        "cache-control": "no-cache",
        pragma: "no-cache",
        "sec-ch-ua":
          '".Not/A)Brand";v="99", "Google Chrome";v="103", "Chromium";v="103"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"macOS"',
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "same-origin",
        "sec-fetch-user": "?1",
        "upgrade-insecure-requests": "1",
        cookie: "ASP.NET_SessionId=jphhhsmu01pvz2p2qnbf2tvo",
        Referer: "https://www.xwordinfo.com/JSON/",
        "Referrer-Policy": "strict-origin-when-cross-origin",
      },
    };

    try {
      const response = await fetch(url, options);
      const json = await response.json();

      const year = new Date(json.date).getFullYear();
      const month = new Date(json.date).getMonth() + 1; // Adding 1 since getMonth() returns 0-11
      const day = new Date(json.date).getDate();

      findOrCreateDirectory(year, month, day, json);
    } catch (error) {
      console.error("Error fetching or processing crossword data:", error);
    }

    await sleep(2000);
  }

  // Check if there are changes to commit
  const status = execSync("git status --porcelain").toString();

  if (status) {
    // If there are changes, proceed with add, commit, and push
    try {
      execSync("git add .");
      execSync('git commit -m "New crossword puzzles added"');
      execSync("git push");
    } catch (error) {
      console.error("Failed to push to GitHub:", error);
    }
  } else {
    console.log("No changes to commit. Skipping Git push.");
  }
}

function findOrCreateDirectory(year, month, day, json) {
  const dirPath = `./crosswords/${year}/${String(month).padStart(2, "0")}`;
  const filePath = `${dirPath}/${day}.json`; // No zero padding for day

  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(json, null, 2));
    console.log(`File added: ${filePath}`);
    newFilesAdded = true;
  } else {
    console.log(`File already exists: ${filePath}`);
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

init();
