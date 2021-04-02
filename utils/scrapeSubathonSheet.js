const puppeteer = require('puppeteer');

const URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vThvKnVHDeF0iGgL7Bkx6wz_SE2hh2RvxzqEHyqtZvR3H0DXuOwwh5MdwnbzMYvluul97ld364VANqm/pubhtml#";

const scrapeSpreadsheet = () => {
    return new Promise(async (resolve, reject) => {
        try {
            const browser = await puppeteer.launch();
            const page = await browser.newPage();
            await page.goto(URL);

            let evaluated = await page.evaluate(() => {

                const hourDom = document.querySelectorAll('td.s128');       // hardcoded dom element id
                const minuteDom = document.querySelectorAll('td.s129');     // hardcoded dom element id

                const hourList = [0];                                       // missing hour 0 in first line
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

scrapeSpreadsheet()
    .then(data => {
        console.log("hello");
        console.log(data);
    })
    .catch(error => {
        console.error(error);
    });
