# Notes

- Can extract data for each film in a Letterboxd list at a rate of ~1s per film.
- Letterboxd lists and film pages load data dynamically, hence the use of Puppeteer.
- Letterboxd lists require scrolling in order to load all list content, which the package puppeteer-autoscroll-down is used for https://www.npmjs.com/package/puppeteer-autoscroll-down.
