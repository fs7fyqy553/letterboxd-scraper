Tool built using TypeScript and Puppeteer to scrape data from films in a Letterboxd lists. For information on how to use this package.

Installation

    - Run "npm install letterboxd-list-scraper"

Quick Start:

1. Add "import processFilmsInList from 'letterboxd-list-scraper'" to top of file:

    - Note: for now, only ES imports are enabled

2. When using the function processFilmsInList:

    1. Pass as the first argument the URL of the first page in the Letterboxd list in grid view

    2. Pass as the second argument the function that is supposed to process the film object extracted for a given Letterboxd film page, ensuring the list is in grid view:

        - Film object contains the following keys: filmTitle (string), releaseYearString, directorNameArray, averageRatingString, filmPosterURL (string) and filmBackdropImageURL (string)