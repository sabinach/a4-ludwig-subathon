# Ludwig Subathon

### Website URL
https://6859-sp21.github.io/a4-ludwig-subathon/

### Overview

Subathon Dates:
- START: March 14, 2021 (2:00pm PST = 5:00pm EST) 
- END: XXX

Current Data Extracted from Subathon Tracker (manually updated):
- START: 0 hr
- END: 563.5 hr

Current Data Extracted from SullyGnome (manually updated):
- START: March 08, 2021, 0:00  est(?)
- END: April 07, 2021, 23:00 est(?)

Note to self:
- all dates converted to EST
- subathon tracker (add # hr of time streamed to 5pm EST start)
- sullygnome (assume already in est) -- TODO: need to confirm

Dataset Credits To:
- [baddog86, smartax1111, itzdanbarz, and ogsheeper](https://docs.google.com/spreadsheets/d/e/2PACX-1vThvKnVHDeF0iGgL7Bkx6wz_SE2hh2RvxzqEHyqtZvR3H0DXuOwwh5MdwnbzMYvluul97ld364VANqm/pubhtml#)
- [SullyGnome](https://sullygnome.com/channel/ludwig)
	* [viewers.json](https://sullygnome.com/api/charts/linecharts/getconfig/ChannelViewers/30/0/12171601/ludwig/%20/%20/0/0/%20/) 
	* [followers.json](https://sullygnome.com/api/charts/linecharts/getconfig/ChannelFollowers/7/0/12171601/ludwig/%20/%20/0/0/%20/)
- [Twitch Highlight Clips](https://docs.google.com/spreadsheets/d/e/2PACX-1vQLW71Ytd45ilfzRnforyZJthghXUickXMZdhY_phG8rAEO7eYqOCTj2u5DlxN0x5s1xP-ondSwf3RD/pubhtml#)

### To Preprocess Data:
```
cd utils/
node scrapeSubathonSheet.js
node scrapeHighlightsSheet.js
```

### To Run Locally:

- Use Brackets IDE. 
- Open ```index.html``` via 'Live Preview'

### To Deploy:

- Since the website is hosted on Github Pages, just push to the github repo to deploy updates. Just make sure that ```index.html``` is in the root folder.


### Tools Used:
- [JSON Formatter](https://jsonformatter.curiousconcept.com/)
