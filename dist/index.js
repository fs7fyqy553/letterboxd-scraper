/* eslint-disable */
import puppeteer from "puppeteer";
import { parse } from "node-html-parser";
import { scrollPageToBottom } from "puppeteer-autoscroll-down";
function getFilmBackdropWrapper(filmPageDoc) {
    return filmPageDoc.querySelector('#backdrop');
}
function extractNodeListText(nodeList) {
    const textArray = [];
    for (let i = 0; i < nodeList.length; i += 1) {
        textArray.push(nodeList[i].textContent);
    }
    return textArray;
}
function getFilmBackdropImageURL(filmPageDoc) {
    const filmBackdropWrapper = getFilmBackdropWrapper(filmPageDoc);
    return filmBackdropWrapper && filmBackdropWrapper.getAttribute('data-backdrop');
}
function getFilmPosterURL(filmPageDoc) {
    const filmPosterURLElement = filmPageDoc.querySelector('#poster-large > div > div > img');
    return filmPosterURLElement && filmPosterURLElement.getAttribute('src');
}
function getAverageRatingString(filmPageDoc) {
    const averageRatingStringElement = filmPageDoc.querySelector('.display-rating');
    return averageRatingStringElement && averageRatingStringElement.textContent;
}
function getDirectorNameArray(filmPageDoc) {
    const directorNodeList = filmPageDoc.querySelectorAll("[href^='/director/']>span");
    return extractNodeListText(directorNodeList);
}
function getReleaseYearString(filmPageDoc) {
    const releaseYearStringElement = filmPageDoc.querySelector("[href^='/films/year/']");
    return releaseYearStringElement && releaseYearStringElement.textContent;
}
function getFilmTitle(filmPageDoc) {
    const filmTitleElement = filmPageDoc.querySelector(".headline-1");
    return filmTitleElement && filmTitleElement.textContent;
}
function checkIfAdult(filmPageDoc) {
    return !!filmPageDoc.querySelector('.-adult');
}
async function getDynamicFilmPageBody(filmPageURL, filmPuppeteerPage) {
    await filmPuppeteerPage.goto(filmPageURL);
    return getInnerHTMLFromPuppeteerPage(filmPuppeteerPage);
}
function getFilmObject(filmPageDoc) {
    if (checkIfAdult(filmPageDoc)) {
        return null;
    }
    const filmTitle = getFilmTitle(filmPageDoc);
    return {
        filmTitle,
        releaseYearString: getReleaseYearString(filmPageDoc),
        directorNameArray: getDirectorNameArray(filmPageDoc),
        averageRatingString: getAverageRatingString(filmPageDoc),
        filmPosterURL: getFilmPosterURL(filmPageDoc),
        filmBackdropImageURL: getFilmBackdropImageURL(filmPageDoc),
    };
}
async function getFilmPageDoc(filmPageURL, filmPuppeteerPage) {
    const filmPageBody = await getDynamicFilmPageBody(filmPageURL, filmPuppeteerPage);
    return parse(filmPageBody);
}
function isValidFilmObject(filmObject) {
    return (filmObject.filmTitle !== undefined && typeof (filmObject.filmTitle) === "string" &&
        filmObject.releaseYearString !== undefined && typeof (filmObject.releaseYearString) === "string" &&
        filmObject.directorNameArray !== undefined && Array.isArray(filmObject.directorNameArray) &&
        // @ts-ignore
        filmObject.directorNameArray.every((element) => typeof (element) === "string") &&
        filmObject.averageRatingString !== undefined && typeof (filmObject.averageRatingString) === "string" &&
        filmObject.filmPosterURL !== undefined && typeof (filmObject.filmPosterURL) === "string" &&
        filmObject.filmBackdropImageURL !== undefined && typeof (filmObject.filmBackdropImageURL) === "string");
}
async function getDetailsObjectFromFilmPage(filmPageURL, filmPuppeteerPage) {
    const filmPageDoc = await getFilmPageDoc(filmPageURL, filmPuppeteerPage);
    return getFilmObject(filmPageDoc);
}
async function processFilmPage(filmPageURL, filmPuppeteerPage, processor) {
    const filmDetailsObject = await getDetailsObjectFromFilmPage(filmPageURL, filmPuppeteerPage);
    if (isValidFilmObject(filmDetailsObject)) {
        await processor(filmDetailsObject);
    }
    else {
        console.error(`Extracted film object invalid. Object: ${JSON.stringify(filmDetailsObject)}`);
    }
}
function getFilmPagePath(filmAnchorNode) {
    return filmAnchorNode.getAttribute('href');
}
async function processFilmAnchorNode(node, filmPuppeteerPage, processor) {
    const filmPagePath = getFilmPagePath(node);
    const filmPageURL = getLetterboxdURL(filmPagePath);
    await processFilmPage(filmPageURL, filmPuppeteerPage, processor);
}
async function getInnerHTMLFromPuppeteerPage(page) {
    return page.evaluate(() => document.body.innerHTML);
}
function getLetterboxdURL(path) {
    return `https://letterboxd.com${path}`;
}
async function processFilmAnchorNodeList(nodeList, filmPuppeteerPage, processor) {
    for (let i = 0; i < nodeList.length; i += 1) {
        const filmAnchorNode = nodeList[i];
        // eslint-disable-next-line no-await-in-loop
        await processFilmAnchorNode(filmAnchorNode, filmPuppeteerPage, processor);
    }
}
async function getDynamicFilmListPageBody(listPageURL, puppeteerPage) {
    await puppeteerPage.goto(listPageURL);
    // @ts-ignore
    await scrollPageToBottom(puppeteerPage, {});
    return getInnerHTMLFromPuppeteerPage(puppeteerPage);
}
async function getNextFilmListPageURL(filmListPageDoc) {
    const nextPageAnchor = filmListPageDoc.querySelector('.next');
    if (nextPageAnchor === null) {
        return null;
    }
    const nextPagePath = nextPageAnchor.getAttribute('href');
    return getLetterboxdURL(nextPagePath);
}
async function processFilmsOnListPage(listPageDoc, filmPuppeteerPage, processor) {
    const filmAnchorNodeList = listPageDoc.querySelectorAll('.film-list .frame');
    await processFilmAnchorNodeList(filmAnchorNodeList, filmPuppeteerPage, processor);
}
async function getListPageDoc(listPageURL, listPuppeteerPage) {
    const listPageBody = await getDynamicFilmListPageBody(listPageURL, listPuppeteerPage);
    return parse(listPageBody);
}
async function processListPageAndGetNextURL(listPageURL, listPuppeteerPage, filmPuppeteerPage, processor) {
    const listPageDoc = await getListPageDoc(listPageURL, listPuppeteerPage);
    await processFilmsOnListPage(listPageDoc, filmPuppeteerPage, processor);
    return getNextFilmListPageURL(listPageDoc);
}
async function getPuppeteerPage(browser) {
    const page = await browser.newPage();
    // NOTE: necessary for deployment
    page.setDefaultNavigationTimeout(0);
    return page;
}
async function usePuppeteerPages(listPuppeteerPage, filmPuppeteerPage, firstListPageURL, processor) {
    let listPageURL = firstListPageURL;
    while (listPageURL !== null) {
        // eslint-disable-next-line no-await-in-loop
        listPageURL = await processListPageAndGetNextURL(listPageURL, listPuppeteerPage, filmPuppeteerPage, processor);
    }
}
function getPuppeteerPages(browser, numberOfPages) {
    const promiseArray = Array(numberOfPages).fill(getPuppeteerPage(browser));
    return Promise.all(promiseArray);
}
async function closeBrowser(browser) {
    await browser.close();
}
async function useBrowser(browser, firstListPageURL, processor) {
    const [listPuppeteerPage, filmPuppeteerPage] = await getPuppeteerPages(browser, 2);
    await usePuppeteerPages(listPuppeteerPage, filmPuppeteerPage, firstListPageURL, processor);
}
async function getHeadlessBrowser() {
    return puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        ignoreDefaultArgs: ['--disable-extensions'],
    });
}
async function processFilmsInList(firstListPageURL, processor) {
    // NOTE: list page must be the page of a Letterboxd list in grid view
    const browser = await getHeadlessBrowser();
    await useBrowser(browser, firstListPageURL, processor);
    await closeBrowser(browser);
}
export default processFilmsInList;
