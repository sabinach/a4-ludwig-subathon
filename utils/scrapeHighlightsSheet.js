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
				
				const headers = ['time', 'type', 'title', 'url', 'description'];
				const types = ['subspike', 'highlight'];

				const typeDomId = "td.s0"; 			// hardcoded dom element id
				const titleDomId = "td.s1"; 		// hardcoded dom element id
				const urlDomId = "a"
				const descDomId = "td.s3"; 			// hardcoded dom element id
				
				const typeDom = document.querySelectorAll(typeDomId);  
                const titleDom = document.querySelectorAll(titleDomId);    
				const urlDom = document.querySelectorAll(urlDomId);  
				const descDom = document.querySelectorAll(descDomId); 
				
				const typeList = [];
                const titleList = []; 
				const urlList = []; 
				const descList = []; 
				
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
				
				urlDom.forEach((domItem) => {
                    const url = domItem.innerText;
                    url!=='' && url.includes('http')
                        ? urlList.push(url)
                        : null;
                });
				
				descDom.forEach((domItem) => {
                    const desc = domItem.innerText;
                    desc!==''
                        ? descList.push(desc)
                        : null;
                });

                const data = {
					type: typeList,
                    title: titleList,
					desc: descList,
					url: urlList
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
