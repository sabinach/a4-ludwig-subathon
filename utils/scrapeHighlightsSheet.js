// import modules
const puppeteer = require('puppeteer');
const fs = require('fs');

// hardcoded values
const URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQLW71Ytd45ilfzRnforyZJthghXUickXMZdhY_phG8rAEO7eYqOCTj2u5DlxN0x5s1xP-ondSwf3RD/pubhtml#";
const saveFilename = "../data/highlights.json";

// scraper
const scrapeSpreadsheet = () => {
    return new Promise(async (resolve, reject) => {
        try {
            const browser = await puppeteer.launch();
            const page = await browser.newPage();
			await page.setDefaultNavigationTimeout(0);  // remove timeout (set to unlimited load time)
            await page.goto(URL);

            let evaluated = await page.evaluate(() => {
				
				const headers = ['datetime', 'type', 'title', 'url', 'embed', 'description'];
				const types = ['twitch', 'youtube'];

                const datetimeDomId = "td.s0";
				const typeDomId = "td.s0"; 			// hardcoded dom element id
				const titleDomId = "td.s1"; 		// hardcoded dom element id
				const descDomId = "td.s4"; 			// hardcoded dom element id
                const urlDomId = "a"
                const embedDomId = "a"
				
                const datetimeDom = document.querySelectorAll(datetimeDomId);
				const typeDom = document.querySelectorAll(typeDomId);  
                const titleDom = document.querySelectorAll(titleDomId);      
				const descDom = document.querySelectorAll(descDomId); 
                const urlDom = document.querySelectorAll(urlDomId);
                const embedDom = document.querySelectorAll(embedDomId);
				
                const datetimeList = [];
				const typeList = [];
                const titleList = []; 
				const descList = []; 
                const urlList = []; 
                const embedList = []; 

                datetimeDom.forEach((domItem) => {
                    const datetime = domItem.innerText;
                    datetime!=='' && datetime.includes(":")
                        ? datetimeList.push(datetime)
                        : null;
                });
				
				typeDom.forEach((domItem) => {
                    const type = domItem.innerText;
                    type!=='' && types.includes(type)
                        ? typeList.push(type)
                        : null;
                });

                titleDom.forEach((domItem) => {
                    const title = domItem.innerText;
                    title!=='' && !headers.includes(title)
                        ? titleList.push(title)
                        : null;
                });
				
				descDom.forEach((domItem) => {
                    const desc = domItem.innerText;
                    desc!==''
                        ? descList.push(desc)
                        : null;
                });

                urlDom.forEach((domItem) => {
                    const url = domItem.innerText;
                    url!=='' && url.includes('http') && !url.includes('embed')
                        ? urlList.push(url)
                        : null;
                });

                embedDom.forEach((domItem) => {
                    const embed = domItem.innerText;
                    embed!=='' && embed.includes('http') && embed.includes('embed')
                        ? embedList.push(embed)
                        : null;
                });

                const data = {
                    datetime: datetimeList,
					type: typeList,
                    title: titleList,
					desc: descList,
					url: urlList,
                    embed: embedList
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
