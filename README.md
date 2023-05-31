Tool built using TypeScript and Puppeteer to scrape data from films in a Letterboxd lists. Can extract data for each film in a Letterboxd list at a rate of ~1s per film.

Letterboxd lists and film pages load data dynamically, hence the use of Puppeteer. Letterboxd lists require scrolling in order to load all list content, which the package puppeteer-autoscroll-down is used for https://www.npmjs.com/package/puppeteer-autoscroll-down.

Installation:

    npm install letterboxd-list-scraper

Quick Start:

1. Import processFilmsInList from the package. For now, only ES6+ imports are enabled:

    ```
    import processFilmsInList from 'letterboxd-list-scraper'
    ```

2. When using the function processFilmsInList, make sure firstListPageURL links to a Letterboxd list page in grid view.

    ```
    processFilmsInList(
        firstListPageURL: string,
        processor: Function
    );
    ```

3. Format of the film object passed to processor for each film:

    ```
    {
        filmTitle: string,
        releaseYearString: string,
        directorNameArray: string[],
        averageRatingString: string,
        filmPosterURL: string,
        filmBackdropImageURL: string,
    }
    ```