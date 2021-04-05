# Ludwig Subathon

### Website URL
https://6859-sp21.github.io/a4-ludwig-subathon/

### Overview

Subathon Dates:
- START: March 14, 2021 (2:00pm PST) 
- END: XXX

Current Data Extracted from SullyGnome (manually updated):
- START: March 02, 2021
- END: March 31, 2021

Dataset Credits To:
- [Ludwig Subathon Tracker](https://docs.google.com/spreadsheets/d/e/2PACX-1vThvKnVHDeF0iGgL7Bkx6wz_SE2hh2RvxzqEHyqtZvR3H0DXuOwwh5MdwnbzMYvluul97ld364VANqm/pubhtml#)
- [SullyGnome](https://sullygnome.com/channel/ludwig)
	* [viewers.json](https://sullygnome.com/api/charts/linecharts/getconfig/ChannelViewers/30/0/12171601/ludwig/%20/%20/0/0/%20/) 
	* [followers.json](https://sullygnome.com/api/charts/linecharts/getconfig/ChannelFollowers/7/0/12171601/ludwig/%20/%20/0/0/%20/)
- [Twitch Clips](https://docs.google.com/spreadsheets/d/e/2PACX-1vQLW71Ytd45ilfzRnforyZJthghXUickXMZdhY_phG8rAEO7eYqOCTj2u5DlxN0x5s1xP-ondSwf3RD/pubhtml#)

### To Run Locally:

- Use Brackets IDE. 
- Open ```index.html``` via 'Live Preview'

### To Preprocess Data:
```
cd utils/
node scrapeSubathonSheet.js
node scrapeHighlightsSheet.js
node formatSullyGnome.js
```

### To Deploy:

- Since the website is hosted on Github Pages, just push to the github repo to deploy updates...


### Tools Used:
- [JSON Formatter](https://jsonformatter.curiousconcept.com/)
