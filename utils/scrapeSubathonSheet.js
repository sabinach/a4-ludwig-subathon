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
				
				const timeStreamedDomId = "td.s208"; 	// hardcoded dom element id -- TODO: incorrect values scraped
                const timeStreamedDomId_2 = "td.s233"   // hardcoded dom element id (highlighted values on the spreadsheet have different domid)

				const timeLeftDomId = "td.s209";		// hardcoded dom element id
				const subsGainedDomId = "td.s212";		// hardcoded dom element id

                const timeStreamedDom = document.querySelectorAll(timeStreamedDomId);
                const timeStreamedDom_2 = document.querySelectorAll(timeStreamedDomId_2);
                const timeLeftDom = document.querySelectorAll(timeLeftDomId);
				const subsGainedDom = document.querySelectorAll(subsGainedDomId);
				
                const timeStreamedList = []; 
                const timeStreamedList_2 = []; 									
                const timeLeftList = [];
				const subsGainedList = [];

                timeStreamedDom.forEach((domItem) => {
                    const timeStreamed = parseFloat(domItem.innerText);
                    timeStreamed!=='' && !isNaN(timeStreamed)
                        ? timeStreamedList.push(timeStreamed)
                        : null;
                });

                timeStreamedDom_2.forEach((domItem) => {
                    const timeStreamed = parseFloat(domItem.innerText);
                    timeStreamed!=='' && !isNaN(timeStreamed)
                        ? timeStreamedList_2.push(timeStreamed)
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
                    timeStreamed_2: timeStreamedList_2,
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
