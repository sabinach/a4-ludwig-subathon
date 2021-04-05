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
			await page.setDefaultNavigationTimeout(0);  // remove timeout (set to unlimited load time)
            await page.goto(URL);

            let evaluated = await page.evaluate(() => {
				
				const hourDomId = "td.s140"; 								// hardcoded dom element id
				const minuteDomId = "td.s141";								// hardcoded dom element id

                const hourDom = document.querySelectorAll(hourDomId);
                const minuteDom = document.querySelectorAll(minuteDomId);
				
                const hourList = [0];  										// missing hour 0 in first line
                const minuteList = [];

                hourDom.forEach((domItem) => {
                    const hour = domItem.innerText;
                    hour!=='' 
                        ? hourList.push(hour==='NULL' ? null : parseInt(hour))
                        : null;
                });
                minuteDom.forEach((domItem) => {
                    const minute = domItem.innerText;
                    minute!=='' 
                        ? minuteList.push(minute==='NULL' ? null : parseInt(minute))
                        : null;
                });

                const data = {
                    hour: hourList,
                    minute: minuteList
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
