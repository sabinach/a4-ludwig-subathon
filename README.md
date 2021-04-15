# Visualizing Ludwig's 31-Day Subathon

## MIT 6.859 Spring 2021

#### Project Description
- Kind of a meme project :) More details to come when I do the actual writeup..    

#### Project Deliverables
- Final Submission [[Writeup](https://github.com/6859-sp21/a4-ludwig-subathon/blob/main/README.md)]
- MVP [[Video](https://youtu.be/nUda4JRYS7U)] [[Slides](https://docs.google.com/presentation/d/1e-SIilkMOaA-3OfUn5qYDrHJ5L7LxpdqVNObbwEFuuA/edit?usp=sharing)]

#### Deploy URL
https://6859-sp21.github.io/a4-ludwig-subathon/

-----------------------------

## Dev Notes

### Overview

THE SUBATHON HAS OFFICIALLY ENDED. CONGRATS LUDWIG!!!!!! 
- It's been a wild ride! To fellow Ludwig fans out there, I hope you find this visualization interesting. I had a blast making it :) 

Subathon Dates:
- START: March 14, 2021 @ 2:00pm PST (5:00pm EST)
- END: April 13, 2021 @ 8:59pm PST (11:59pm EST)

Current Data Extracted from baddog86's spreadsheet (manually updated):
- START: 0 hr
- END: 694.5 hr (missing 681-693.5 hr due to deleted VOD)

Current Data Extracted from SullyGnome (manually updated):
- viewers: 2021-03-11 16:00 EST ... 2021-04-14 00:00 EST
- followers: 2021-03-09 19:00 EST ... 2021-04-14 18:00 EST

Dataset Credits To:
- [baddog86, smartax1111, itzdanbarz, and ogsheeper](https://docs.google.com/spreadsheets/d/e/2PACX-1vThvKnVHDeF0iGgL7Bkx6wz_SE2hh2RvxzqEHyqtZvR3H0DXuOwwh5MdwnbzMYvluul97ld364VANqm/pubhtml#)
	* timeLeft.json (scraped from spreadsheet)
	* ludwigModcast.json (hardcoded based on spreadsheet -- TODO: go back to check vods on missing data)
- [SullyGnome](https://sullygnome.com/channel/ludwig)
	* [viewers.json](https://sullygnome.com/api/charts/linecharts/getconfig/ChannelViewers/30/0/12171601/ludwig/%20/%20/0/0/%20/) (directly download)
	* [followers.json](https://sullygnome.com/api/charts/linecharts/getconfig/ChannelFollowers/7/0/12171601/ludwig/%20/%20/0/0/%20/) (directly downloaded)
	* gameImages.json (manually checked loaded image urls)
- [Twitch Highlight Clips](https://docs.google.com/spreadsheets/d/e/2PACX-1vQLW71Ytd45ilfzRnforyZJthghXUickXMZdhY_phG8rAEO7eYqOCTj2u5DlxN0x5s1xP-ondSwf3RD/pubhtml#)
	* highlights.json (manually consolidated)

### To Preprocess Data:
```
cd utils/
node scrapeSubathonSheet.js
node scrapeHighlightsSheet.js
```
### To Run Locally:

- Use Brackets IDE for test server 
- Open ```index.html``` via 'Live Preview'

### To Deploy:

- ```index.html``` should be in the root folder.
- ```parentDomain``` in ```scripts/index.js``` MUST match the domain above (ie. ```6859-sp21.github.io``` on deploy, or ```127.0.0.1``` when testing via Brackets)
- Since the website is hosted on Github Pages, just push to the github repo to deploy updates. 

### Tools Used:
- [JSON Formatter](https://jsonformatter.curiousconcept.com/)

### Notes to Self:
- all dates are converted to EST
- name equivalents due to hacky legacy code: highlights = events; ludwigModcast = sleepAwake
- before scraping, make sure BOTH spreadsheets' COLUMN DIVS are still correct bc it's HARDCODED in the script, and constantly changing in real-time since the subathon is ongoing
	* for baddog's spreadsheet, specifically use the "Hours Streamed" and "Subathon Timer" column from the "Calculations" tab
- for baddog's spreadsheet:
	* to calculate datetime, add # hr of time streamed to 5pm EST start
	* hours were manually inserted (via code) from hour 719-727 (1-9pm PST inclusive) with subathon timer linearly decreasing in time from 8-0 hours (inclusive) because at that point the subathon timer was just a countdown since all subs went directly to charity, instead of adding to the timer.
- sullygnome (make sure to convert to EST on the bottom left dropdown of the website before downloading .json)

-----------------------------

## Writeup

### TBD
