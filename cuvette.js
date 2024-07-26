import { Builder, By, until, logging } from 'selenium-webdriver';
import { Options, ServiceBuilder } from 'selenium-webdriver/chrome.js';
import chromedriver from 'chromedriver';

async function createDriver() {
   const options = new Options();
   options.addArguments('--headless');
   options.addArguments('--disable-gpu');
   options.addArguments('--no-sandbox');
   options.addArguments('--disable-dev-shm-usage');

   return new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .withCapabilities({ 'goog:chromeOptions': { binary: chromedriver.path } })
      .build();
}

const type = {
   'internships': {
      containerClass: 'StudentInternshipCard_innerContainer__3shqY',
      headingClass: 'StudentInternshipCard_heading__1JfH4',
      keyClass: 'StudentInternshipCard_infoTop__3yl8o',
      valueClass: 'StudentInternshipCard_infoValue__E3Alf',
      postTimeClass: 'StudentInternshipCard_currentInfoLeft__1jLNL',
      shareBtnCSS: '.StudentInternshipCard_shareBtn__fR5A0.icon-on-hover',
      cancelBtnCSS: '.Button_button__2Lf63.Share_cancelButton__35Ggc',
      textareaCSS: '.custom-scroll.basic-input',
   },
   'fulltimeJobs': {
      containerClass: 'StudentJobCard_innerContainer__1HYXP',
      headingClass: 'StudentJobCard_heading__3eoXb',
      keyClass: 'StudentJobCard_infoTop__2HBCx',
      valueClass: 'StudentJobCard_infoValue__pLPuG',
      postTimeClass: 'StudentJobCard_currentInfoLeft___NbOf',
      shareBtnCSS: '.StudentJobCard_shareBtn__bkNrl.icon-on-hover',
      cancelBtnCSS: '.Button_button__2Lf63.Share_cancelButton__35Ggc',
      textareaCSS: '.custom-scroll.basic-input',
   }
}

async function scrapeWebsite(retryCount = 5) {
   let driver = await createDriver();
   try {
      await driver.get('https://cuvette.tech/app/student/login');

      // Log in
      // Wait for the username field to be located
      const usernameField = await driver.wait(until.elementLocated(By.css('.basic-input.LoginWithEmail_darkBorder__3htqi')), 20000);
      await driver.wait(until.elementIsVisible(usernameField), 20000);
      await usernameField.sendKeys('nogofa@cyclelove.cc');

      // Wait for the password field to be located
      const passwordField = await driver.wait(until.elementLocated(By.css('.PasswordInput_formPasswordInput__1A7J_.PasswordInput_darkBorder__1tlYC>input')), 20000);
      await driver.wait(until.elementIsVisible(passwordField), 20000);
      await passwordField.sendKeys('cosmo@cuvette');

      const submitButton = await driver.wait(until.elementLocated(By.css('.Button_button__2Lf63.LoginWithEmail_login__T6YaR')), 20000);
      await driver.wait(until.elementIsVisible(submitButton), 20000);
      await submitButton.click();

      // This is to make sure that the page has loaded completely after logging in
      await driver.wait(until.elementLocated(By.css('.DashboardPanel_navigation__10Cmg')), 20000);

      const fulltimeJobs = await scrape('fulltimeJobs', driver);
      const internships = await scrape('internships', driver);

      console.log(data);

   } catch (error) {
      if (retryCount > 0) {
         console.log(`Error while navigating to the page to be scraped. Retrying... (${retryCount} retries left)`);
         await driver.quit();
         await new Promise(resolve => setTimeout(resolve, 2000));
         await scrapeWebsite(retryCount - 1);
      } else {
         console.log(`Error while navigating to the page to be scraped. No retries left. \nError: ${error}`);
      }
   } finally {
      await driver.quit();
   }
}

const data = [];

async function scrape(t, driver, retryCount = 5) {
   try {
      // The page to be scraped
      await driver.get(`https://cuvette.tech/app/student/jobs/${t}/filters?sortByDate=true`);
      // Ensuring data has loaded
      await driver.wait(until.elementLocated(By.css(`.${type[t].valueClass}`)), 20000);

      await driver.wait(until.elementLocated(By.css(`.${type[t].containerClass}`)), 20000);

      const containers = await driver.findElements(By.className(type[t].containerClass));

      // Iterate over the elements and extract their content
      for (let i = 0; i < containers.length; i++) {

         const obj = {
            mainData: {},
            additionalData: {},
         };

         // Filtering out last 12hrs postings
         const postTimeString = await containers[i].findElement(By.css(`.${type[t].postTimeClass}>p`)).getText();
         let postedString = postTimeString.split(' ');
         postedString = postedString[postedString.length - 2];
         let posted = parseInt(postedString);

         if ((postedString.search('h') === -1 || posted >= 12) && postedString.search('m') === -1) break;

         const Title = await containers[i].findElement(By.css(`.${type[t].headingClass} h3`)).getText();

         let locNcomp = await containers[i].findElement(By.css(`.${type[t].headingClass} p`)).getText();
         locNcomp = locNcomp.split('|');

         const Company = locNcomp[0];
         const Location = locNcomp[1];

         
         const shareBtn = await driver.wait(until.elementLocated(By.css(type[t].shareBtnCSS), 20000));
         await driver.executeScript("arguments[0].click();", shareBtn);
         const textarea = await driver.wait(until.elementLocated(By.css(type[t].textareaCSS)));
         let value = await textarea.getAttribute('value');
         const Link = value.split('Link:')[1];
         const cancelBtn = await driver.wait(until.elementLocated(By.css(type[t].cancelBtnCSS)), 20000);
         await driver.executeScript("arguments[0].click();", cancelBtn);
         
         obj.mainData = { Title, Company, Location, Link};

         let keys = await containers[i].findElements(By.className(type[t].keyClass));
         let values = await containers[i].findElements(By.className(type[t].valueClass));

         for (let j = 0; j < keys.length; j++) {
            const key = await keys[j].getText();
            if (key === 'Office Location') continue;
            obj.additionalData[key] = await values[j].getText();
         }

         data.push(obj);
      }
   } catch (error) {
      if (retryCount > 0) {
         console.log(`Error while scraping data. Error: ${error}. Retrying... (${retryCount} retries left)`);
         await new Promise(resolve => setTimeout(resolve, 5000));
         await scrape(t, driver, retryCount - 1);
      } else {
         console.log(`Error while scraping data. No retries left. \nError: ${error}`);
      }
   }
   return data;
}

scrapeWebsite();