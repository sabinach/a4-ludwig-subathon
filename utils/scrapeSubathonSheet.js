// import modules
const puppeteer = require('puppeteer');
const fs = require('fs');

// hardcoded values
const URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vThvKnVHDeF0iGgL7Bkx6wz_SE2hh2RvxzqEHyqtZvR3H0DXuOwwh5MdwnbzMYvluul97ld364VANqm/pubhtml#";
const saveFilename = "../data/timeLeft.json";

// scraper
const scrapeSpreadsheet = () => {
    return new Promise(async (resolve, reject) => {
        try {
            const browser = await puppeteer.launch();
            const page = await browser.newPage();
			await page.setDefaultNavigationTimeout(0);  // set to unlimited load time
            await page.goto(URL);

            let evaluated = await page.evaluate(() => {
				
				const timeStreamedDomId = "td.s179"; 	// hardcoded dom element id -- TODO: incorrect values scraped
				const timeLeftDomId = "td.s180";		// hardcoded dom element id
				const subsGainedDomId = "td.s183";		// hardcoded dom element id

                const timeStreamedDom = document.querySelectorAll(timeStreamedDomId);
                const timeLeftDom = document.querySelectorAll(timeLeftDomId);
				const subsGainedDom = document.querySelectorAll(subsGainedDomId);
				
                const timeStreamedList = [];  									
                const timeLeftList = [];
				const subsGainedList = [];

                timeStreamedDom.forEach((domItem) => {
                    const timeStreamed = parseFloat(domItem.innerText);
                    timeStreamed!=='' && !isNaN(timeStreamed)
                        ? timeStreamedList.push(timeStreamed)
                        : null;
                });
				
                timeLeftDom.forEach((domItem) => {
                    const timeLeft = domItem.innerText;
                    timeLeft!=='' 
                        ? timeLeftList.push(timeLeft)
                        : null;
                });
				
				subsGainedDom.forEach((domItem) => {
                    const subsGained = parseInt(domItem.innerText);
                    subsGained!=='' && !isNaN(subsGained)
                        ? subsGainedList.push(subsGained)
                        : null;
                });

                const data = {
                    timeStreamed: timeStreamedList,
                    timeLeft: timeLeftList,
					subsGained: subsGainedList
                };

                return data;
            })
            browser.close();
            return resolve(evaluated);

        } catch (error) {
            return reject(error);
        }
    })
}

// run
scrapeSpreadsheet()
    .then(data => {
        console.log(data);
		fs.writeFile(saveFilename, JSON.stringify(data), err => err ? console.log(err): null);
    })
    .catch(error => {
        console.error(error);
    });
