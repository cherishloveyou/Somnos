
function addItem(n, an, p, date){
    var item = document.createElement('div');
    item.className = "asgnItem";
    //LATE
    var late = document.createElement("span");
    late.innerHTML = "LATE! ";
    late.className = "late itemText";
    item.appendChild(late);
    //name
    var name = document.createElement("span");
    name.innerHTML = n + " ";
    name.className = "studentName itemText";
    item.appendChild(name);
    //submitted
    var s = document.createElement("span");
    s.innerHTML ="submitted ";
    item.appendChild(s);
    //an
    var asgnName = document.createElement("span");
    asgnName.innerHTML = an + " ";
    asgnName.className = "assignmentName itemText";
    item.appendChild(asgnName);
    //p
    var per = document.createElement("span");
    per.innerHTML = "[Period: " + p + "] ";
    per.className = "period";
    item.appendChild(per);
    //date
    var x = document.createElement("span");
    x.innerHTML = "X";
    x.className = "xIcon";
    item.appendChild(x);


    document.getElementById("container").appendChild(item);

}
const {BrowserWindow, app, ipcMain} = require("electron");
const path = require('path');
const pie = require("puppeteer-in-electron");
const puppeteer = require("puppeteer-core");
var data = [];
var lateAs = [];
var UGColumns = [];
app.commandLine.appendSwitch ("disable-http-cache");

async function main() {
  await pie.initialize(app);
  const browser = await pie.connect(app, puppeteer);

  await app.whenReady();

  ipcMain.on("a-m", async (e, a) =>{
    e.reply('a-m', "yayeet", lateAs, data, UGColumns);
  })

  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false,
    }

  })

  //win.webContents.openDevTools();
  win.loadFile('index.html')
  win.setIcon(path.join(__dirname, '/src/logo.jpg'));
}

async function scrapeGrade(browser, url, OGurl){
  const window = new BrowserWindow();
  await window.loadURL(url);
  const page = await pie.getPage(browser, window);

  try{
    await page.waitForSelector('#tilesHolder')
    await page.keyboard.press('\r');
  }catch(e){
    await page.waitForSelector('#i0116');

  }
  await page.waitForNavigation({ waitUntil: 'networkidle0' });
  try{
  await page.waitForSelector('#idSIButton9');
  await page.click("#idSIButton9");
}catch(e){
}
    await page.waitForSelector('#i0118');

    await page.keyboard.press('\r');
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2' }),
  ])
  await window.loadURL(OGurl);
  //logged into Canvas
  /*Sample Parsing sequence
  await page.waitForXPath('//*[@id="global_nav_profile_link"]');
  const [el] = await page.$x('//*[@id="global_nav_profile_link"]');
  console.log(el);
  const src = await el.getProperty('innerHTML');
  const srcTxt = await src.jsonValue();
*/
  var browser = 0;
  await page.waitForSelector("#menu > li:nth-child(3)");
  await page.click("#global_nav_courses_link");
  //await page.waitForXPath('//*[@id="nav-tray-portal"]/span/span/div/div/div/div/div');
  const urls = [];
  await page.waitForSelector("#nav-tray-portal > span > span > div > div > div > div > div > ul:nth-child(4) > li:nth-child(1) > a");
  const [classCont] = await page.$$(".fClCc_fLbg");
  const li = await classCont.$$eval("li", i => i.map(o=>o.children[0].getAttribute("href")));
  const cn = await classCont.$$eval("li", i => i.map(o=>o.children[0].innerHTML));

  //LI is the list of the HREFS of the classes we have.
  console.log(li);
  for (var i =0; i< li.length; i++){
	if(cn[i].includes("AP")){
		 await scrapeTables(OGurl, browser, page, li[i], cn[i]);
    await page.goto(url);
}

  }
  console.log(data);
  console.log(lateAs);
  window.destroy();



}
//all of the above code is boilerplate stuff for electron to work
function sleep(ms){
  return new Promise((res) => {setTimeout(res, ms)});
}
async function scrapeTables(url, browser, page, li ,classN){
  const link = url + li + "/grades";
  await page.setViewport({
    width: 1920,
    height: 1080,
    deviceScaleFactor: 0.05,
  });
  await page.goto(link);
  await page.waitForSelector("#gradebook-grid-wrapper");
  const AG = await page.$eval("#gradebook_grid", e => e.style.overflow = "visible")
  await sleep(7000);
  //const [classN] = await page.$$eval("#breadcrumbs > ul > li:nth-child(2) > a > span", i=>i.map(q=>q.innerHTML));
  //await page.waitForNavigation({waitUntil: "networkidle0"});
  const assignments = await page.$$eval("div > span > div > div > span > span > span > span > span > a", i=>i.map( o=>o.getAttribute('href')));
  const asn = await page.$$eval(".assignment-name", i=>i.map( o=>o.innerHTML));
  data.push(asn)

  var d = {
    students: [],
    assignments: [],
    lateAssignments: [],
  };
  var sarr = await page.$$eval(".student > div > a", i=>i.map(e=>e.innerHTML));
  console.log(sarr, asn)
  var c = sarr.length;
  var GD = await page.$$eval(".slick-row > div > div", i => i.map(e=> [e.innerText]));
  GD = GD.splice(c);
  var cells = await page.$$eval(".slick-row > div > div", i => i.map(e=>[e.className, e.innerHTML]));
  cells = cells.splice(c);
  //cells: a collection of all assignments
  //we need to parse through this now
  //There is an extra 5 cells per row; i+=5 for that
  //Keep iterating through assignmnets?
  //This is for Every Student
  //p is index for asgn and asn
  //s is the index for students
    const lenA = assignments.length;
    var p = 0;
    var s = 0;
    var sBase = Array(lenA).join(".").split(".");


    for (var i = 0; i< cells.length; i++){
      if(cells[i][0].includes("late") && cells[i][1].includes("icon-not-graded")){
        d.lateAssignments.push({
          studentName: sarr[s],
          assignment: assignments[p],
          class: classN,
          aName: asn[p],
        })
        console.log(assignments ,p);
      }
      sBase[p] += (GD[i].includes("-"))? "a" : "b";
      p++;
      if(p >= lenA){
        p = 0;
        i+=5;
        s+=1;
      }
    }
    console.log(sBase, UGColumns)
  for(var i = 0; i< sBase.length; i++){
    if(!sBase[i].includes("b")){
      UGColumns.push([asn[i], assignments[i]]);
    }
  }


  //sarr.map(a => a.children[0].innerHTML);

  //sarr = sarr.splice(1, sarr.length-1);
  lateAs.push(...d.lateAssignments);
  d.students.push(...sarr);
  d.assignments.push(...assignments);
  console.log(d.lateAssignments);
  data.push(d);
  return 0
  //console.log(data)
  //parse here


}
main()
{
  "name": "my-electron-app",
  "version": "1.0.0",
  "lockfileVersion": 2,
  "requires": true,
  "packages": {
    "node_modules/@electron-forge/async-ora": {
      "version": "6.0.0-beta.63",
      "resolved": "https://registry.npmjs.org/@electron-forge/async-ora/-/async-ora-6.0.0-beta.63.tgz",
      "integrity": "sha512-e1BbeUV20yWZWeRJ3LDLcloPPgHwTXV1wAJXpAdDbmTmcRyAGx9iVx2Qyh6t878c7zX36XXlqfCIOvODsgiuOQ==",
      "dev": true,
      "dependencies": {
        "chalk": "^4.0.0",
        "debug": "^4.3.1",
        "log-symbols": "^4.0.0",
        "ora": "^5.0.0",
        "pretty-ms": "^7.0.0"
      },
      "engines": {
        "node": ">= 12.13.0"
      }
    },
    "node_modules/@electron-forge/cli": {
      "version": "6.0.0-beta.63",
      "resolved": "https://registry.npmjs.org/@electron-forge/cli/-/cli-6.0.0-beta.63.tgz",
      "integrity": "sha512-I2B/hX16IDbuc2ip6JjAxrTF8XSQfuoIkb/EoqzEluPrdCx6VTzEahOQlUH+CvPohpwD/LDsH4Usd9/krKlkfg==",
      "dev": true,
      "funding": [
        {
          "type": "individual",
          "url": "https://github.com/sponsors/malept"
        },
        {
          "type": "tidelift",
          "url": "https://tidelift.com/subscription/pkg/npm-.electron-forge-cli?utm_medium=referral&utm_source=npm_fund"
        }
      ],
      "dependencies": {
        "@electron-forge/async-ora": "6.0.0-beta.63",
        "@electron-forge/core": "6.0.0-beta.63",
        "@electron-forge/shared-types": "6.0.0-beta.63",
        "@electron/get": "^1.9.0",
        "chalk": "^4.0.0",
        "commander": "^4.1.1",
        "debug": "^4.3.1",
        "fs-extra": "^10.0.0",
        "inquirer": "^8.0.0",
        "semver": "^7.2.1"
      },
      "bin": {
        "electron-forge": "dist/electron-forge.js",
        "electron-forge-vscode-nix": "script/vscode.sh",
        "electron-forge-vscode-win": "script/vscode.cmd"
      },
      "engines": {
        "node": ">= 12.13.0"
      }
    },
    "node_modules/@electron-forge/cli/node_modules/fs-extra": {
      "version": "10.0.0",
      "resolved": "https://registry.npmjs.org/fs-extra/-/fs-extra-10.0.0.tgz",
      "integrity": "sha512-C5owb14u9eJwizKGdchcDUQeFtlSHHthBk8pbX9Vc1PFZrLombudjDnNns88aYslCyF6IY5SUw3Roz6xShcEIQ==",
      "dev": true,
      "dependencies": {
        "graceful-fs": "^4.2.0",
        "jsonfile": "^6.0.1",
        "universalify": "^2.0.0"
      },
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/@electron-forge/cli/node_modules/jsonfile": {
      "version": "6.1.0",
      "resolved": "https://registry.npmjs.org/jsonfile/-/jsonfile-6.1.0.tgz",
      "integrity": "sha512-5dgndWOriYSm5cnYaJNhalLNDKOqFwyDB/rr1E9ZsGciGvKPs8R2xYGCacuf3z6K1YKDz182fd+fY3cn3pMqXQ==",
      "dev": true,
      "dependencies": {
        "universalify": "^2.0.0"
      },
      "optionalDependencies": {
        "graceful-fs": "^4.1.6"
      }
    },
    "node_modules/@electron-forge/cli/node_modules/semver": {
      "version": "7.3.5",
      "resolved": "https://registry.npmjs.org/semver/-/semver-7.3.5.tgz",
      "integrity": "sha512-PoeGJYh8HK4BTO/a9Tf6ZG3veo/A7ZVsYrSA6J8ny9nb3B1VrpkuN+z9OE5wfE5p6H4LchYZsegiQgbJD94ZFQ==",
      "dev": true,
      "dependencies": {
        "lru-cache": "^6.0.0"
      },
      "bin": {
        "semver": "bin/semver.js"
      },
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/@electron-forge/cli/node_modules/universalify": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/universalify/-/universalify-2.0.0.tgz",
      "integrity": "sha512-hAZsKq7Yy11Zu1DE0OzWjw7nnLZmJZYTDZZyEFHZdUhV8FkH5MCfoU1XMaxXovpyW5nq5scPqq0ZDP9Zyl04oQ==",
      "dev": true,
      "engines": {
        "node": ">= 10.0.0"
      }
    },
    "node_modules/@electron-forge/core": {
      "version": "6.0.0-beta.63",
      "resolved": "https://registry.npmjs.org/@electron-forge/core/-/core-6.0.0-beta.63.tgz",
      "integrity": "sha512-NuiWRXUfpv6/PwP8AgPxcmRPiWvQMfllTHz163wmBWz8UBclzhu7Brpu6dwmszAJG68erW15ym+cUlpvGDEltg==",
      "dev": true,
      "funding": [
        {
          "type": "individual",
          "url": "https://github.com/sponsors/malept"
        },
        {
          "type": "tidelift",
          "url": "https://tidelift.com/subscription/pkg/npm-.electron-forge-core?utm_medium=referral&utm_source=npm_fund"
        }
      ],
      "dependencies": {
        "@electron-forge/async-ora": "6.0.0-beta.63",
        "@electron-forge/installer-base": "6.0.0-beta.63",
        "@electron-forge/installer-deb": "6.0.0-beta.63",
        "@electron-forge/installer-dmg": "6.0.0-beta.63",
        "@electron-forge/installer-exe": "6.0.0-beta.63",
        "@electron-forge/installer-rpm": "6.0.0-beta.63",
        "@electron-forge/installer-zip": "6.0.0-beta.63",
        "@electron-forge/maker-base": "6.0.0-beta.63",
        "@electron-forge/plugin-base": "6.0.0-beta.63",
        "@electron-forge/publisher-base": "6.0.0-beta.63",
        "@electron-forge/shared-types": "6.0.0-beta.63",
        "@electron-forge/template-base": "6.0.0-beta.63",
        "@electron-forge/template-typescript": "6.0.0-beta.63",
        "@electron-forge/template-typescript-webpack": "6.0.0-beta.63",
        "@electron-forge/template-webpack": "6.0.0-beta.63",
        "@electron/get": "^1.9.0",
        "@malept/cross-spawn-promise": "^2.0.0",
        "chalk": "^4.0.0",
        "debug": "^4.3.1",
        "electron-packager": "^15.4.0",
        "electron-rebuild": "^3.2.6",
        "fast-glob": "^3.2.7",
        "find-up": "^5.0.0",
        "fs-extra": "^10.0.0",
        "lodash": "^4.17.20",
        "log-symbols": "^4.0.0",
        "node-fetch": "^2.6.0",
        "nugget": "^2.0.1",
        "resolve-package": "^1.0.1",
        "semver": "^7.2.1",
        "source-map-support": "^0.5.13",
        "sudo-prompt": "^9.1.1",
        "username": "^5.1.0",
        "yarn-or-npm": "^3.0.1"
      },
      "engines": {
        "node": ">= 12.13.0"
      }
    },
    "node_modules/@electron-forge/core/node_modules/fs-extra": {
      "version": "10.0.0",
      "resolved": "https://registry.npmjs.org/fs-extra/-/fs-extra-10.0.0.tgz",
      "integrity": "sha512-C5owb14u9eJwizKGdchcDUQeFtlSHHthBk8pbX9Vc1PFZrLombudjDnNns88aYslCyF6IY5SUw3Roz6xShcEIQ==",
      "dev": true,
      "dependencies": {
        "graceful-fs": "^4.2.0",
        "jsonfile": "^6.0.1",
        "universalify": "^2.0.0"
      },
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/@electron-forge/core/node_modules/jsonfile": {
      "version": "6.1.0",
      "resolved": "https://registry.npmjs.org/jsonfile/-/jsonfile-6.1.0.tgz",
      "integrity": "sha512-5dgndWOriYSm5cnYaJNhalLNDKOqFwyDB/rr1E9ZsGciGvKPs8R2xYGCacuf3z6K1YKDz182fd+fY3cn3pMqXQ==",
      "dev": true,
      "dependencies": {
        "universalify": "^2.0.0"
      },
      "optionalDependencies": {
        "graceful-fs": "^4.1.6"
      }
    },
    "node_modules/@electron-forge/core/node_modules/semver": {
      "version": "7.3.5",
      "resolved": "https://registry.npmjs.org/semver/-/semver-7.3.5.tgz",
      "integrity": "sha512-PoeGJYh8HK4BTO/a9Tf6ZG3veo/A7ZVsYrSA6J8ny9nb3B1VrpkuN+z9OE5wfE5p6H4LchYZsegiQgbJD94ZFQ==",
      "dev": true,
      "dependencies": {
        "lru-cache": "^6.0.0"
      },
      "bin": {
        "semver": "bin/semver.js"
      },
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/@electron-forge/core/node_modules/universalify": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/universalify/-/universalify-2.0.0.tgz",
      "integrity": "sha512-hAZsKq7Yy11Zu1DE0OzWjw7nnLZmJZYTDZZyEFHZdUhV8FkH5MCfoU1XMaxXovpyW5nq5scPqq0ZDP9Zyl04oQ==",
      "dev": true,
      "engines": {
        "node": ">= 10.0.0"
      }
    },
    "node_modules/@electron-forge/installer-base": {
      "version": "6.0.0-beta.63",
      "resolved": "https://registry.npmjs.org/@electron-forge/installer-base/-/installer-base-6.0.0-beta.63.tgz",
      "integrity": "sha512-y4SKJZaxE8lnfwicWuAiUZBpBY6UB/mE/dA+w6uigKEffZzRPbrbBUIuknII6wEaFnnScmCrQaBRjxy+zsEihQ==",
      "dev": true,
      "dependencies": {
        "@electron-forge/async-ora": "6.0.0-beta.63"
      },
      "engines": {
        "node": ">= 12.13.0"
      }
    },
    "node_modules/@electron-forge/installer-darwin": {
      "version": "6.0.0-beta.63",
      "resolved": "https://registry.npmjs.org/@electron-forge/installer-darwin/-/installer-darwin-6.0.0-beta.63.tgz",
      "integrity": "sha512-LQE6UKPP7tJ+Ki3tPzYUIBRAAzEpalqkz8zYUh+2pS/nk9w2BgQeOJ84NzWUfoeLWZnsWtjp8kox8xTS8/BsSQ==",
      "dev": true,
      "dependencies": {
        "@electron-forge/async-ora": "6.0.0-beta.63",
        "@electron-forge/installer-base": "6.0.0-beta.63",
        "fs-extra": "^10.0.0",
        "sudo-prompt": "^9.1.1"
      },
      "engines": {
        "node": ">= 12.13.0"
      }
    },
    "node_modules/@electron-forge/installer-darwin/node_modules/fs-extra": {
      "version": "10.0.0",
      "resolved": "https://registry.npmjs.org/fs-extra/-/fs-extra-10.0.0.tgz",
      "integrity": "sha512-C5owb14u9eJwizKGdchcDUQeFtlSHHthBk8pbX9Vc1PFZrLombudjDnNns88aYslCyF6IY5SUw3Roz6xShcEIQ==",
      "dev": true,
      "dependencies": {
        "graceful-fs": "^4.2.0",
        "jsonfile": "^6.0.1",
        "universalify": "^2.0.0"
      },
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/@electron-forge/installer-darwin/node_modules/jsonfile": {
      "version": "6.1.0",
      "resolved": "https://registry.npmjs.org/jsonfile/-/jsonfile-6.1.0.tgz",
      "integrity": "sha512-5dgndWOriYSm5cnYaJNhalLNDKOqFwyDB/rr1E9ZsGciGvKPs8R2xYGCacuf3z6K1YKDz182fd+fY3cn3pMqXQ==",
      "dev": true,
      "dependencies": {
        "universalify": "^2.0.0"
      },
      "optionalDependencies": {
        "graceful-fs": "^4.1.6"
      }
    },
    "node_modules/@electron-forge/installer-darwin/node_modules/universalify": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/universalify/-/universalify-2.0.0.tgz",
      "integrity": "sha512-hAZsKq7Yy11Zu1DE0OzWjw7nnLZmJZYTDZZyEFHZdUhV8FkH5MCfoU1XMaxXovpyW5nq5scPqq0ZDP9Zyl04oQ==",
      "dev": true,
      "engines": {
        "node": ">= 10.0.0"
      }
    },
    "node_modules/@electron-forge/installer-deb": {
      "version": "6.0.0-beta.63",
      "resolved": "https://registry.npmjs.org/@electron-forge/installer-deb/-/installer-deb-6.0.0-beta.63.tgz",
      "integrity": "sha512-gvjCXdGXBxC/O8QuwNHKsLIlfOwVc9y/e5pURcuFRvPf7Ibw7e53w3pfR2pquWHNzAccrw8P5WBEuPSeDPBlLw==",
      "dev": true,
      "dependencies": {
        "@electron-forge/installer-linux": "6.0.0-beta.63"
      },
      "engines": {
        "node": ">= 12.13.0"
      }
    },
    "node_modules/@electron-forge/installer-dmg": {
      "version": "6.0.0-beta.63",
      "resolved": "https://registry.npmjs.org/@electron-forge/installer-dmg/-/installer-dmg-6.0.0-beta.63.tgz",
      "integrity": "sha512-o+Zd2CmpoMQOk9SfuUPIoQ4GONVNHdlmI4mMIJ22OrLQnZJYAdsQUFO87jtxmJuippTpEbnqaKc9yl6mLh89TQ==",
      "dev": true,
      "dependencies": {
        "@electron-forge/installer-darwin": "6.0.0-beta.63",
        "@malept/cross-spawn-promise": "^2.0.0",
        "debug": "^4.3.1",
        "fs-extra": "^10.0.0"
      },
      "engines": {
        "node": ">= 12.13.0"
      }
    },
    "node_modules/@electron-forge/installer-dmg/node_modules/fs-extra": {
      "version": "10.0.0",
      "resolved": "https://registry.npmjs.org/fs-extra/-/fs-extra-10.0.0.tgz",
      "integrity": "sha512-C5owb14u9eJwizKGdchcDUQeFtlSHHthBk8pbX9Vc1PFZrLombudjDnNns88aYslCyF6IY5SUw3Roz6xShcEIQ==",
      "dev": true,
      "dependencies": {
        "graceful-fs": "^4.2.0",
        "jsonfile": "^6.0.1",
        "universalify": "^2.0.0"
      },
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/@electron-forge/installer-dmg/node_modules/jsonfile": {
      "version": "6.1.0",
      "resolved": "https://registry.npmjs.org/jsonfile/-/jsonfile-6.1.0.tgz",
      "integrity": "sha512-5dgndWOriYSm5cnYaJNhalLNDKOqFwyDB/rr1E9ZsGciGvKPs8R2xYGCacuf3z6K1YKDz182fd+fY3cn3pMqXQ==",
      "dev": true,
      "dependencies": {
        "universalify": "^2.0.0"
      },
      "optionalDependencies": {
        "graceful-fs": "^4.1.6"
      }
    },
    "node_modules/@electron-forge/installer-dmg/node_modules/universalify": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/universalify/-/universalify-2.0.0.tgz",
      "integrity": "sha512-hAZsKq7Yy11Zu1DE0OzWjw7nnLZmJZYTDZZyEFHZdUhV8FkH5MCfoU1XMaxXovpyW5nq5scPqq0ZDP9Zyl04oQ==",
      "dev": true,
      "engines": {
        "node": ">= 10.0.0"
      }
    },
    "node_modules/@electron-forge/installer-exe": {
      "version": "6.0.0-beta.63",
      "resolved": "https://registry.npmjs.org/@electron-forge/installer-exe/-/installer-exe-6.0.0-beta.63.tgz",
      "integrity": "sha512-HhogUMTTgOXTEMQE+A20USamuAcnClSSWzlInzVQ2cGT5AdZio6zqNJ/et7zPx7Jz71gmJ/cfhNstzc/ew1IAA==",
      "dev": true,
      "dependencies": {
        "@electron-forge/installer-base": "6.0.0-beta.63",
        "open": "^8.1.0"
      },
      "engines": {
        "node": ">= 12.13.0"
      }
    },
    "node_modules/@electron-forge/installer-linux": {
      "version": "6.0.0-beta.63",
      "resolved": "https://registry.npmjs.org/@electron-forge/installer-linux/-/installer-linux-6.0.0-beta.63.tgz",
      "integrity": "sha512-yC2wYQ3uXGnvWEG4AdjSmas5qaXXtXIoxO6/cXJrywMT9ujWlp2GB1i+I5xrFCusgbjdvdzJ3JhLRmIAKpW6ZA==",
      "dev": true,
      "dependencies": {
        "@electron-forge/installer-base": "6.0.0-beta.63",
        "sudo-prompt": "^9.1.1"
      },
      "engines": {
        "node": ">= 12.13.0"
      }
    },
    "node_modules/@electron-forge/installer-rpm": {
      "version": "6.0.0-beta.63",
      "resolved": "https://registry.npmjs.org/@electron-forge/installer-rpm/-/installer-rpm-6.0.0-beta.63.tgz",
      "integrity": "sha512-4p+zDInl6sMnx1jdIcRSXgRAGFSwtcBPBStAlVuxPMefM8ElBPhskUyHrk33TqMZUdzbr+vYA+pQGj/6jlET4A==",
      "dev": true,
      "dependencies": {
        "@electron-forge/installer-linux": "6.0.0-beta.63"
      },
      "engines": {
        "node": ">= 12.13.0"
      }
    },
    "node_modules/@electron-forge/installer-zip": {
      "version": "6.0.0-beta.63",
      "resolved": "https://registry.npmjs.org/@electron-forge/installer-zip/-/installer-zip-6.0.0-beta.63.tgz",
      "integrity": "sha512-ZORm3jVvswvKSv+iuufTVXwIM/OOtBSQPeAay8hVubf6MudWBdntWv1Xg/BAUAcdRbAH/EIbMv83LZvmt7cufw==",
      "dev": true,
      "dependencies": {
        "@electron-forge/installer-darwin": "6.0.0-beta.63",
        "@malept/cross-spawn-promise": "^2.0.0",
        "fs-extra": "^10.0.0"
      },
      "engines": {
        "node": ">= 12.13.0"
      }
    },
    "node_modules/@electron-forge/installer-zip/node_modules/fs-extra": {
      "version": "10.0.0",
      "resolved": "https://registry.npmjs.org/fs-extra/-/fs-extra-10.0.0.tgz",
      "integrity": "sha512-C5owb14u9eJwizKGdchcDUQeFtlSHHthBk8pbX9Vc1PFZrLombudjDnNns88aYslCyF6IY5SUw3Roz6xShcEIQ==",
      "dev": true,
      "dependencies": {
        "graceful-fs": "^4.2.0",
        "jsonfile": "^6.0.1",
        "universalify": "^2.0.0"
      },
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/@electron-forge/installer-zip/node_modules/jsonfile": {
      "version": "6.1.0",
      "resolved": "https://registry.npmjs.org/jsonfile/-/jsonfile-6.1.0.tgz",
      "integrity": "sha512-5dgndWOriYSm5cnYaJNhalLNDKOqFwyDB/rr1E9ZsGciGvKPs8R2xYGCacuf3z6K1YKDz182fd+fY3cn3pMqXQ==",
      "dev": true,
      "dependencies": {
        "universalify": "^2.0.0"
      },
      "optionalDependencies": {
        "graceful-fs": "^4.1.6"
      }
    },
    "node_modules/@electron-forge/installer-zip/node_modules/universalify": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/universalify/-/universalify-2.0.0.tgz",
      "integrity": "sha512-hAZsKq7Yy11Zu1DE0OzWjw7nnLZmJZYTDZZyEFHZdUhV8FkH5MCfoU1XMaxXovpyW5nq5scPqq0ZDP9Zyl04oQ==",
      "dev": true,
      "engines": {
        "node": ">= 10.0.0"
      }
    },
    "node_modules/@electron-forge/maker-base": {
      "version": "6.0.0-beta.63",
      "resolved": "https://registry.npmjs.org/@electron-forge/maker-base/-/maker-base-6.0.0-beta.63.tgz",
      "integrity": "sha512-0Fh6OOjS/1sXIGReKgU5NCMf8ZUyaCUSjd190oUNaX8OSxGDbHrbWO3CgIbsAOsxRnxzhYY1UtPo6VkexjCQBA==",
      "dev": true,
      "dependencies": {
        "@electron-forge/shared-types": "6.0.0-beta.63",
        "fs-extra": "^10.0.0",
        "which": "^2.0.2"
      },
      "engines": {
        "node": ">= 12.13.0"
      }
    },
    "node_modules/@electron-forge/maker-base/node_modules/fs-extra": {
      "version": "10.0.0",
      "resolved": "https://registry.npmjs.org/fs-extra/-/fs-extra-10.0.0.tgz",
      "integrity": "sha512-C5owb14u9eJwizKGdchcDUQeFtlSHHthBk8pbX9Vc1PFZrLombudjDnNns88aYslCyF6IY5SUw3Roz6xShcEIQ==",
      "dev": true,
      "dependencies": {
        "graceful-fs": "^4.2.0",
        "jsonfile": "^6.0.1",
        "universalify": "^2.0.0"
      },
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/@electron-forge/maker-base/node_modules/jsonfile": {
      "version": "6.1.0",
      "resolved": "https://registry.npmjs.org/jsonfile/-/jsonfile-6.1.0.tgz",
      "integrity": "sha512-5dgndWOriYSm5cnYaJNhalLNDKOqFwyDB/rr1E9ZsGciGvKPs8R2xYGCacuf3z6K1YKDz182fd+fY3cn3pMqXQ==",
      "dev": true,
      "dependencies": {
        "universalify": "^2.0.0"
      },
      "optionalDependencies": {
        "graceful-fs": "^4.1.6"
      }
    },
    "node_modules/@electron-forge/maker-base/node_modules/universalify": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/universalify/-/universalify-2.0.0.tgz",
      "integrity": "sha512-hAZsKq7Yy11Zu1DE0OzWjw7nnLZmJZYTDZZyEFHZdUhV8FkH5MCfoU1XMaxXovpyW5nq5scPqq0ZDP9Zyl04oQ==",
      "dev": true,
      "engines": {
        "node": ">= 10.0.0"
      }
    },
    "node_modules/@electron-forge/maker-deb": {
      "version": "6.0.0-beta.63",
      "resolved": "https://registry.npmjs.org/@electron-forge/maker-deb/-/maker-deb-6.0.0-beta.63.tgz",
      "integrity": "sha512-6U4SQ9qFqd0UPCTfJU6358ifxnLvMxJmwyy3Z/4lZlYIfL2112gsQRyvlv7UcFXamw+1CZ9n9SY3f/K50susEQ==",
      "dev": true,
      "dependencies": {
        "@electron-forge/maker-base": "6.0.0-beta.63",
        "@electron-forge/shared-types": "6.0.0-beta.63"
      },
      "engines": {
        "node": ">= 12.13.0"
      },
      "optionalDependencies": {
        "electron-installer-debian": "^3.0.0"
      }
    },
    "node_modules/@electron-forge/maker-rpm": {
      "version": "6.0.0-beta.63",
      "resolved": "https://registry.npmjs.org/@electron-forge/maker-rpm/-/maker-rpm-6.0.0-beta.63.tgz",
      "integrity": "sha512-htKNsA3/7nOd5PL6jjdrYCcSXrrIj43aJyOfIuFHswFpjFFmYEgsDCrN8lKZH5y1qdXQefaGOc9MapuBC0GO+w==",
      "dev": true,
      "dependencies": {
        "@electron-forge/maker-base": "6.0.0-beta.63",
        "@electron-forge/shared-types": "6.0.0-beta.63"
      },
      "engines": {
        "node": ">= 12.13.0"
      },
      "optionalDependencies": {
        "electron-installer-redhat": "^3.2.0"
      }
    },
    "node_modules/@electron-forge/maker-squirrel": {
      "version": "6.0.0-beta.63",
      "resolved": "https://registry.npmjs.org/@electron-forge/maker-squirrel/-/maker-squirrel-6.0.0-beta.63.tgz",
      "integrity": "sha512-18eLRQmMZ6zBcI1Jhuqvhm50bmmatRCbyOUHTaIbhVf1M6ksq34xXXVWKUGlqDiCNLLLNzVw5MIb9O04eUdfIg==",
      "dev": true,
      "dependencies": {
        "@electron-forge/maker-base": "6.0.0-beta.63",
        "@electron-forge/shared-types": "6.0.0-beta.63",
        "fs-extra": "^10.0.0"
      },
      "engines": {
        "node": ">= 12.13.0"
      },
      "optionalDependencies": {
        "electron-winstaller": "^5.0.0"
      }
    },
    "node_modules/@electron-forge/maker-squirrel/node_modules/fs-extra": {
      "version": "10.0.0",
      "resolved": "https://registry.npmjs.org/fs-extra/-/fs-extra-10.0.0.tgz",
      "integrity": "sha512-C5owb14u9eJwizKGdchcDUQeFtlSHHthBk8pbX9Vc1PFZrLombudjDnNns88aYslCyF6IY5SUw3Roz6xShcEIQ==",
      "dev": true,
      "dependencies": {
        "graceful-fs": "^4.2.0",
        "jsonfile": "^6.0.1",
        "universalify": "^2.0.0"
      },
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/@electron-forge/maker-squirrel/node_modules/jsonfile": {
      "version": "6.1.0",
      "resolved": "https://registry.npmjs.org/jsonfile/-/jsonfile-6.1.0.tgz",
      "integrity": "sha512-5dgndWOriYSm5cnYaJNhalLNDKOqFwyDB/rr1E9ZsGciGvKPs8R2xYGCacuf3z6K1YKDz182fd+fY3cn3pMqXQ==",
      "dev": true,
      "dependencies": {
        "universalify": "^2.0.0"
      },
      "optionalDependencies": {
        "graceful-fs": "^4.1.6"
      }
    },
    "node_modules/@electron-forge/maker-squirrel/node_modules/universalify": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/universalify/-/universalify-2.0.0.tgz",
      "integrity": "sha512-hAZsKq7Yy11Zu1DE0OzWjw7nnLZmJZYTDZZyEFHZdUhV8FkH5MCfoU1XMaxXovpyW5nq5scPqq0ZDP9Zyl04oQ==",
      "dev": true,
      "engines": {
        "node": ">= 10.0.0"
      }
    },
    "node_modules/@electron-forge/maker-zip": {
      "version": "6.0.0-beta.63",
      "resolved": "https://registry.npmjs.org/@electron-forge/maker-zip/-/maker-zip-6.0.0-beta.63.tgz",
      "integrity": "sha512-tXNX58ly2TYj0Z7G9bKP3FbEHLfeNv+lJgmlDBwP5Uh4yG0d/dxIBUzP5Dv+pIjsH/l3K3dVfCCM3fc4q+u3Mg==",
      "dev": true,
      "dependencies": {
        "@electron-forge/maker-base": "6.0.0-beta.63",
        "@electron-forge/shared-types": "6.0.0-beta.63",
        "cross-zip": "^4.0.0",
        "fs-extra": "^10.0.0"
      },
      "engines": {
        "node": ">= 12.13.0"
      }
    },
    "node_modules/@electron-forge/maker-zip/node_modules/fs-extra": {
      "version": "10.0.0",
      "resolved": "https://registry.npmjs.org/fs-extra/-/fs-extra-10.0.0.tgz",
      "integrity": "sha512-C5owb14u9eJwizKGdchcDUQeFtlSHHthBk8pbX9Vc1PFZrLombudjDnNns88aYslCyF6IY5SUw3Roz6xShcEIQ==",
      "dev": true,
      "dependencies": {
        "graceful-fs": "^4.2.0",
        "jsonfile": "^6.0.1",
        "universalify": "^2.0.0"
      },
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/@electron-forge/maker-zip/node_modules/jsonfile": {
      "version": "6.1.0",
      "resolved": "https://registry.npmjs.org/jsonfile/-/jsonfile-6.1.0.tgz",
      "integrity": "sha512-5dgndWOriYSm5cnYaJNhalLNDKOqFwyDB/rr1E9ZsGciGvKPs8R2xYGCacuf3z6K1YKDz182fd+fY3cn3pMqXQ==",
      "dev": true,
      "dependencies": {
        "universalify": "^2.0.0"
      },
      "optionalDependencies": {
        "graceful-fs": "^4.1.6"
      }
    },
    "node_modules/@electron-forge/maker-zip/node_modules/universalify": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/universalify/-/universalify-2.0.0.tgz",
      "integrity": "sha512-hAZsKq7Yy11Zu1DE0OzWjw7nnLZmJZYTDZZyEFHZdUhV8FkH5MCfoU1XMaxXovpyW5nq5scPqq0ZDP9Zyl04oQ==",
      "dev": true,
      "engines": {
        "node": ">= 10.0.0"
      }
    },
    "node_modules/@electron-forge/plugin-base": {
      "version": "6.0.0-beta.63",
      "resolved": "https://registry.npmjs.org/@electron-forge/plugin-base/-/plugin-base-6.0.0-beta.63.tgz",
      "integrity": "sha512-K9nyGRI9NY2kax7aS/1eWxGrOSwNO3JnmbfvFQf5I0Yl/HKClrfGJq4o3q4N9lf55arPRJBROP8+rHJ115VCrA==",
      "dev": true,
      "dependencies": {
        "@electron-forge/shared-types": "6.0.0-beta.63"
      },
      "engines": {
        "node": ">= 12.13.0"
      }
    },
    "node_modules/@electron-forge/publisher-base": {
      "version": "6.0.0-beta.63",
      "resolved": "https://registry.npmjs.org/@electron-forge/publisher-base/-/publisher-base-6.0.0-beta.63.tgz",
      "integrity": "sha512-ag+/e6eqM6k1jxUhXg8618IbUa1IsF8OcbZtjcLSZSp/ZEGLAlZ3IpfIrk5C9cRUdibhDJyT6oFLfbG7KUhpRg==",
      "dev": true,
      "dependencies": {
        "@electron-forge/shared-types": "6.0.0-beta.63"
      },
      "engines": {
        "node": ">= 12.13.0"
      }
    },
    "node_modules/@electron-forge/shared-types": {
      "version": "6.0.0-beta.63",
      "resolved": "https://registry.npmjs.org/@electron-forge/shared-types/-/shared-types-6.0.0-beta.63.tgz",
      "integrity": "sha512-ayw8IBtHKZ1oIN3y3t3Jm80TTvstvKrPASCXMEJ/fh4gHah8pUmDFZEvyAsGgy/XFHqsjlpTmD2hdOtQqCRpMQ==",
      "dev": true,
      "dependencies": {
        "@electron-forge/async-ora": "6.0.0-beta.63",
        "electron-packager": "^15.4.0",
        "electron-rebuild": "^3.2.6",
        "ora": "^5.0.0"
      },
      "engines": {
        "node": ">= 12.13.0"
      }
    },
    "node_modules/@electron-forge/template-base": {
      "version": "6.0.0-beta.63",
      "resolved": "https://registry.npmjs.org/@electron-forge/template-base/-/template-base-6.0.0-beta.63.tgz",
      "integrity": "sha512-u1rPlrc8bqajkiKe2tmGROL9/o0xx8OzMBHsT7i2+oAFPicSZoyrELCxx9htCeLgUf0iR0K0EzLsFjdyRjTBkg==",
      "dev": true,
      "dependencies": {
        "@electron-forge/async-ora": "6.0.0-beta.63",
        "@electron-forge/shared-types": "6.0.0-beta.63",
        "@malept/cross-spawn-promise": "^2.0.0",
        "debug": "^4.3.1",
        "fs-extra": "^10.0.0",
        "username": "^5.1.0"
      },
      "engines": {
        "node": ">= 12.13.0"
      }
    },
    "node_modules/@electron-forge/template-base/node_modules/fs-extra": {
      "version": "10.0.0",
      "resolved": "https://registry.npmjs.org/fs-extra/-/fs-extra-10.0.0.tgz",
      "integrity": "sha512-C5owb14u9eJwizKGdchcDUQeFtlSHHthBk8pbX9Vc1PFZrLombudjDnNns88aYslCyF6IY5SUw3Roz6xShcEIQ==",
      "dev": true,
      "dependencies": {
        "graceful-fs": "^4.2.0",
        "jsonfile": "^6.0.1",
        "universalify": "^2.0.0"
      },
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/@electron-forge/template-base/node_modules/jsonfile": {
      "version": "6.1.0",
      "resolved": "https://registry.npmjs.org/jsonfile/-/jsonfile-6.1.0.tgz",
      "integrity": "sha512-5dgndWOriYSm5cnYaJNhalLNDKOqFwyDB/rr1E9ZsGciGvKPs8R2xYGCacuf3z6K1YKDz182fd+fY3cn3pMqXQ==",
      "dev": true,
      "dependencies": {
        "universalify": "^2.0.0"
      },
      "optionalDependencies": {
        "graceful-fs": "^4.1.6"
      }
    },
    "node_modules/@electron-forge/template-base/node_modules/universalify": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/universalify/-/universalify-2.0.0.tgz",
      "integrity": "sha512-hAZsKq7Yy11Zu1DE0OzWjw7nnLZmJZYTDZZyEFHZdUhV8FkH5MCfoU1XMaxXovpyW5nq5scPqq0ZDP9Zyl04oQ==",
      "dev": true,
      "engines": {
        "node": ">= 10.0.0"
      }
    },
    "node_modules/@electron-forge/template-typescript": {
      "version": "6.0.0-beta.63",
      "resolved": "https://registry.npmjs.org/@electron-forge/template-typescript/-/template-typescript-6.0.0-beta.63.tgz",
      "integrity": "sha512-npFOyak+F+p086GoSifCWwhBxRSJqzzvEwztnONpbjp7BasvtWUyOVpXyyzvt7GaawjRg5Gx/NUgVi5Oi9BIfg==",
      "dev": true,
      "dependencies": {
        "@electron-forge/async-ora": "6.0.0-beta.63",
        "@electron-forge/shared-types": "6.0.0-beta.63",
        "@electron-forge/template-base": "6.0.0-beta.63",
        "fs-extra": "^10.0.0"
      },
      "engines": {
        "node": ">= 12.13.0"
      }
    },
    "node_modules/@electron-forge/template-typescript-webpack": {
      "version": "6.0.0-beta.63",
      "resolved": "https://registry.npmjs.org/@electron-forge/template-typescript-webpack/-/template-typescript-webpack-6.0.0-beta.63.tgz",
      "integrity": "sha512-8S3GW2MRmYF6BsgozCm0CPqAuqaK48MZvJJ3v3XbO1tWPtz4vvw21XxQeOqRMpECdNbqnRBtil4QxVditEx3Kw==",
      "dev": true,
      "dependencies": {
        "@electron-forge/async-ora": "6.0.0-beta.63",
        "@electron-forge/shared-types": "6.0.0-beta.63",
        "@electron-forge/template-base": "6.0.0-beta.63",
        "fs-extra": "^10.0.0"
      },
      "engines": {
        "node": ">= 12.13.0"
      }
    },
    "node_modules/@electron-forge/template-typescript-webpack/node_modules/fs-extra": {
      "version": "10.0.0",
      "resolved": "https://registry.npmjs.org/fs-extra/-/fs-extra-10.0.0.tgz",
      "integrity": "sha512-C5owb14u9eJwizKGdchcDUQeFtlSHHthBk8pbX9Vc1PFZrLombudjDnNns88aYslCyF6IY5SUw3Roz6xShcEIQ==",
      "dev": true,
      "dependencies": {
        "graceful-fs": "^4.2.0",
        "jsonfile": "^6.0.1",
        "universalify": "^2.0.0"
      },
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/@electron-forge/template-typescript-webpack/node_modules/jsonfile": {
      "version": "6.1.0",
      "resolved": "https://registry.npmjs.org/jsonfile/-/jsonfile-6.1.0.tgz",
      "integrity": "sha512-5dgndWOriYSm5cnYaJNhalLNDKOqFwyDB/rr1E9ZsGciGvKPs8R2xYGCacuf3z6K1YKDz182fd+fY3cn3pMqXQ==",
      "dev": true,
      "dependencies": {
        "universalify": "^2.0.0"
      },
      "optionalDependencies": {
        "graceful-fs": "^4.1.6"
      }
    },
    "node_modules/@electron-forge/template-typescript-webpack/node_modules/universalify": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/universalify/-/universalify-2.0.0.tgz",
      "integrity": "sha512-hAZsKq7Yy11Zu1DE0OzWjw7nnLZmJZYTDZZyEFHZdUhV8FkH5MCfoU1XMaxXovpyW5nq5scPqq0ZDP9Zyl04oQ==",
      "dev": true,
      "engines": {
        "node": ">= 10.0.0"
      }
    },
    "node_modules/@electron-forge/template-typescript/node_modules/fs-extra": {
      "version": "10.0.0",
      "resolved": "https://registry.npmjs.org/fs-extra/-/fs-extra-10.0.0.tgz",
      "integrity": "sha512-C5owb14u9eJwizKGdchcDUQeFtlSHHthBk8pbX9Vc1PFZrLombudjDnNns88aYslCyF6IY5SUw3Roz6xShcEIQ==",
      "dev": true,
      "dependencies": {
        "graceful-fs": "^4.2.0",
        "jsonfile": "^6.0.1",
        "universalify": "^2.0.0"
      },
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/@electron-forge/template-typescript/node_modules/jsonfile": {
      "version": "6.1.0",
      "resolved": "https://registry.npmjs.org/jsonfile/-/jsonfile-6.1.0.tgz",
      "integrity": "sha512-5dgndWOriYSm5cnYaJNhalLNDKOqFwyDB/rr1E9ZsGciGvKPs8R2xYGCacuf3z6K1YKDz182fd+fY3cn3pMqXQ==",
      "dev": true,
      "dependencies": {
        "universalify": "^2.0.0"
      },
      "optionalDependencies": {
        "graceful-fs": "^4.1.6"
      }
    },
    "node_modules/@electron-forge/template-typescript/node_modules/universalify": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/universalify/-/universalify-2.0.0.tgz",
      "integrity": "sha512-hAZsKq7Yy11Zu1DE0OzWjw7nnLZmJZYTDZZyEFHZdUhV8FkH5MCfoU1XMaxXovpyW5nq5scPqq0ZDP9Zyl04oQ==",
      "dev": true,
      "engines": {
        "node": ">= 10.0.0"
      }
    },
    "node_modules/@electron-forge/template-webpack": {
      "version": "6.0.0-beta.63",
      "resolved": "https://registry.npmjs.org/@electron-forge/template-webpack/-/template-webpack-6.0.0-beta.63.tgz",
      "integrity": "sha512-CE5zjnyfmHlapwQSJ54kUeTNsvhx/7HAjvfMXpE689LxlFnr0VhiTxuc5kwEetPcxsXhei7IBy/PdJ41v4dswA==",
      "dev": true,
      "dependencies": {
        "@electron-forge/async-ora": "6.0.0-beta.63",
        "@electron-forge/shared-types": "6.0.0-beta.63",
        "@electron-forge/template-base": "6.0.0-beta.63",
        "fs-extra": "^10.0.0"
      },
      "engines": {
        "node": ">= 12.13.0"
      }
    },
    "node_modules/@electron-forge/template-webpack/node_modules/fs-extra": {
      "version": "10.0.0",
      "resolved": "https://registry.npmjs.org/fs-extra/-/fs-extra-10.0.0.tgz",
      "integrity": "sha512-C5owb14u9eJwizKGdchcDUQeFtlSHHthBk8pbX9Vc1PFZrLombudjDnNns88aYslCyF6IY5SUw3Roz6xShcEIQ==",
      "dev": true,
      "dependencies": {
        "graceful-fs": "^4.2.0",
        "jsonfile": "^6.0.1",
        "universalify": "^2.0.0"
      },
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/@electron-forge/template-webpack/node_modules/jsonfile": {
      "version": "6.1.0",
      "resolved": "https://registry.npmjs.org/jsonfile/-/jsonfile-6.1.0.tgz",
      "integrity": "sha512-5dgndWOriYSm5cnYaJNhalLNDKOqFwyDB/rr1E9ZsGciGvKPs8R2xYGCacuf3z6K1YKDz182fd+fY3cn3pMqXQ==",
      "dev": true,
      "dependencies": {
        "universalify": "^2.0.0"
      },
      "optionalDependencies": {
        "graceful-fs": "^4.1.6"
      }
    },
    "node_modules/@electron-forge/template-webpack/node_modules/universalify": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/universalify/-/universalify-2.0.0.tgz",
      "integrity": "sha512-hAZsKq7Yy11Zu1DE0OzWjw7nnLZmJZYTDZZyEFHZdUhV8FkH5MCfoU1XMaxXovpyW5nq5scPqq0ZDP9Zyl04oQ==",
      "dev": true,
      "engines": {
        "node": ">= 10.0.0"
      }
    },
    "node_modules/@electron/get": {
      "version": "1.13.1",
      "resolved": "https://registry.npmjs.org/@electron/get/-/get-1.13.1.tgz",
      "integrity": "sha512-U5vkXDZ9DwXtkPqlB45tfYnnYBN8PePp1z/XDCupnSpdrxT8/ThCv9WCwPLf9oqiSGZTkH6dx2jDUPuoXpjkcA==",
      "dev": true,
      "dependencies": {
        "debug": "^4.1.1",
        "env-paths": "^2.2.0",
        "fs-extra": "^8.1.0",
        "got": "^9.6.0",
        "progress": "^2.0.3",
        "semver": "^6.2.0",
        "sumchecker": "^3.0.1"
      },
      "engines": {
        "node": ">=8.6"
      },
      "optionalDependencies": {
        "global-agent": "^3.0.0",
        "global-tunnel-ng": "^2.7.1"
      }
    },
    "node_modules/@gar/promisify": {
      "version": "1.1.2",
      "resolved": "https://registry.npmjs.org/@gar/promisify/-/promisify-1.1.2.tgz",
      "integrity": "sha512-82cpyJyKRoQoRi+14ibCeGPu0CwypgtBAdBhq1WfvagpCZNKqwXbKwXllYSMG91DhmG4jt9gN8eP6lGOtozuaw==",
      "dev": true
    },
    "node_modules/@malept/cross-spawn-promise": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/@malept/cross-spawn-promise/-/cross-spawn-promise-2.0.0.tgz",
      "integrity": "sha512-1DpKU0Z5ThltBwjNySMC14g0CkbyhCaz9FkhxqNsZI6uAPJXFS8cMXlBKo26FJ8ZuW6S9GCMcR9IO5k2X5/9Fg==",
      "dev": true,
      "funding": [
        {
          "type": "individual",
          "url": "https://github.com/sponsors/malept"
        },
        {
          "type": "tidelift",
          "url": "https://tidelift.com/subscription/pkg/npm-.malept-cross-spawn-promise?utm_medium=referral&utm_source=npm_fund"
        }
      ],
      "dependencies": {
        "cross-spawn": "^7.0.1"
      },
      "engines": {
        "node": ">= 12.13.0"
      }
    },
    "node_modules/@nodelib/fs.scandir": {
      "version": "2.1.5",
      "resolved": "https://registry.npmjs.org/@nodelib/fs.scandir/-/fs.scandir-2.1.5.tgz",
      "integrity": "sha512-vq24Bq3ym5HEQm2NKCr3yXDwjc7vTsEThRDnkp2DK9p1uqLR+DHurm/NOTo0KG7HYHU7eppKZj3MyqYuMBf62g==",
      "dev": true,
      "dependencies": {
        "@nodelib/fs.stat": "2.0.5",
        "run-parallel": "^1.1.9"
      },
      "engines": {
        "node": ">= 8"
      }
    },
    "node_modules/@nodelib/fs.stat": {
      "version": "2.0.5",
      "resolved": "https://registry.npmjs.org/@nodelib/fs.stat/-/fs.stat-2.0.5.tgz",
      "integrity": "sha512-RkhPPp2zrqDAQA/2jNhnztcPAlv64XdhIp7a7454A5ovI7Bukxgt7MX7udwAu3zg1DcpPU0rz3VV1SeaqvY4+A==",
      "dev": true,
      "engines": {
        "node": ">= 8"
      }
    },
    "node_modules/@nodelib/fs.walk": {
      "version": "1.2.8",
      "resolved": "https://registry.npmjs.org/@nodelib/fs.walk/-/fs.walk-1.2.8.tgz",
      "integrity": "sha512-oGB+UxlgWcgQkgwo8GcEGwemoTFt3FIO9ababBmaGwXIoBKZ+GTy0pP185beGg7Llih/NSHSV2XAs1lnznocSg==",
      "dev": true,
      "dependencies": {
        "@nodelib/fs.scandir": "2.1.5",
        "fastq": "^1.6.0"
      },
      "engines": {
        "node": ">= 8"
      }
    },
    "node_modules/@npmcli/fs": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/@npmcli/fs/-/fs-1.1.0.tgz",
      "integrity": "sha512-VhP1qZLXcrXRIaPoqb4YA55JQxLNF3jNR4T55IdOJa3+IFJKNYHtPvtXx8slmeMavj37vCzCfrqQM1vWLsYKLA==",
      "dev": true,
      "dependencies": {
        "@gar/promisify": "^1.0.1",
        "semver": "^7.3.5"
      },
      "engines": {
        "node": "^12.13.0 || ^14.15.0 || >=16"
      }
    },
    "node_modules/@npmcli/fs/node_modules/semver": {
      "version": "7.3.5",
      "resolved": "https://registry.npmjs.org/semver/-/semver-7.3.5.tgz",
      "integrity": "sha512-PoeGJYh8HK4BTO/a9Tf6ZG3veo/A7ZVsYrSA6J8ny9nb3B1VrpkuN+z9OE5wfE5p6H4LchYZsegiQgbJD94ZFQ==",
      "dev": true,
      "dependencies": {
        "lru-cache": "^6.0.0"
      },
      "bin": {
        "semver": "bin/semver.js"
      },
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/@npmcli/move-file": {
      "version": "1.1.2",
      "resolved": "https://registry.npmjs.org/@npmcli/move-file/-/move-file-1.1.2.tgz",
      "integrity": "sha512-1SUf/Cg2GzGDyaf15aR9St9TWlb+XvbZXWpDx8YKs7MLzMH/BCeopv+y9vzrzgkfykCGuWOlSu3mZhj2+FQcrg==",
      "dev": true,
      "dependencies": {
        "mkdirp": "^1.0.4",
        "rimraf": "^3.0.2"
      },
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/@npmcli/move-file/node_modules/mkdirp": {
      "version": "1.0.4",
      "resolved": "https://registry.npmjs.org/mkdirp/-/mkdirp-1.0.4.tgz",
      "integrity": "sha512-vVqVZQyf3WLx2Shd0qJ9xuvqgAyKPLAiqITEtqW0oIUjzo3PePDd6fW9iFz30ef7Ysp/oiWqbhszeGWW2T6Gzw==",
      "dev": true,
      "bin": {
        "mkdirp": "bin/cmd.js"
      },
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/@sindresorhus/is": {
      "version": "0.14.0",
      "resolved": "https://registry.npmjs.org/@sindresorhus/is/-/is-0.14.0.tgz",
      "integrity": "sha512-9NET910DNaIPngYnLLPeg+Ogzqsi9uM4mSboU5y6p8S5DzMTVEsJZrawi+BoDNUVBa2DhJqQYUFvMDfgU062LQ==",
      "dev": true,
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/@szmarczak/http-timer": {
      "version": "1.1.2",
      "resolved": "https://registry.npmjs.org/@szmarczak/http-timer/-/http-timer-1.1.2.tgz",
      "integrity": "sha512-XIB2XbzHTN6ieIjfIMV9hlVcfPU26s2vafYWQcZHWXHOxiaRZYEDKEwdl129Zyg50+foYV2jCgtrqSA6qNuNSA==",
      "dev": true,
      "dependencies": {
        "defer-to-connect": "^1.0.1"
      },
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/@tootallnate/once": {
      "version": "1.1.2",
      "resolved": "https://registry.npmjs.org/@tootallnate/once/-/once-1.1.2.tgz",
      "integrity": "sha512-RbzJvlNzmRq5c3O09UipeuXno4tA1FE6ikOjxZK0tuxVv3412l64l5t1W5pj4+rJq9vpkm/kwiR07aZXnsKPxw==",
      "dev": true,
      "engines": {
        "node": ">= 6"
      }
    },
    "node_modules/@types/async-retry": {
      "version": "1.4.3",
      "resolved": "https://registry.npmjs.org/@types/async-retry/-/async-retry-1.4.3.tgz",
      "integrity": "sha512-B3C9QmmNULVPL2uSJQ088eGWTNPIeUk35hca6CV8rRDJ8GXuQJP5CCVWA1ZUCrb9xYP7Js/RkLqnNNwKhe+Zsw==",
      "dependencies": {
        "@types/retry": "*"
      }
    },
    "node_modules/@types/cacheable-request": {
      "version": "6.0.2",
      "resolved": "https://registry.npmjs.org/@types/cacheable-request/-/cacheable-request-6.0.2.tgz",
      "integrity": "sha512-B3xVo+dlKM6nnKTcmm5ZtY/OL8bOAOd2Olee9M1zft65ox50OzjEHW91sDiU9j6cvW8Ejg1/Qkf4xd2kugApUA==",
      "dev": true,
      "dependencies": {
        "@types/http-cache-semantics": "*",
        "@types/keyv": "*",
        "@types/node": "*",
        "@types/responselike": "*"
      }
    },
    "node_modules/@types/fs-extra": {
      "version": "9.0.13",
      "resolved": "https://registry.npmjs.org/@types/fs-extra/-/fs-extra-9.0.13.tgz",
      "integrity": "sha512-nEnwB++1u5lVDM2UI4c1+5R+FYaKfaAzS4OococimjVm3nQw3TuzH5UNsocrcTBbhnerblyHj4A49qXbIiZdpA==",
      "dev": true,
      "optional": true,
      "dependencies": {
        "@types/node": "*"
      }
    },
    "node_modules/@types/glob": {
      "version": "7.2.0",
      "resolved": "https://registry.npmjs.org/@types/glob/-/glob-7.2.0.tgz",
      "integrity": "sha512-ZUxbzKl0IfJILTS6t7ip5fQQM/J3TJYubDm3nMbgubNNYS62eXeUpoLUC8/7fJNiFYHTrGPQn7hspDUzIHX3UA==",
      "dev": true,
      "optional": true,
      "dependencies": {
        "@types/minimatch": "*",
        "@types/node": "*"
      }
    },
    "node_modules/@types/http-cache-semantics": {
      "version": "4.0.1",
      "resolved": "https://registry.npmjs.org/@types/http-cache-semantics/-/http-cache-semantics-4.0.1.tgz",
      "integrity": "sha512-SZs7ekbP8CN0txVG2xVRH6EgKmEm31BOxA07vkFaETzZz1xh+cbt8BcI0slpymvwhx5dlFnQG2rTlPVQn+iRPQ==",
      "dev": true
    },
    "node_modules/@types/keyv": {
      "version": "3.1.3",
      "resolved": "https://registry.npmjs.org/@types/keyv/-/keyv-3.1.3.tgz",
      "integrity": "sha512-FXCJgyyN3ivVgRoml4h94G/p3kY+u/B86La+QptcqJaWtBWtmc6TtkNfS40n9bIvyLteHh7zXOtgbobORKPbDg==",
      "dev": true,
      "dependencies": {
        "@types/node": "*"
      }
    },
    "node_modules/@types/minimatch": {
      "version": "3.0.5",
      "resolved": "https://registry.npmjs.org/@types/minimatch/-/minimatch-3.0.5.tgz",
      "integrity": "sha512-Klz949h02Gz2uZCMGwDUSDS1YBlTdDDgbWHi+81l29tQALUtvz4rAYi5uoVhE5Lagoq6DeqAUlbrHvW/mXDgdQ==",
      "dev": true,
      "optional": true
    },
    "node_modules/@types/node": {
      "version": "14.18.9",
      "resolved": "https://registry.npmjs.org/@types/node/-/node-14.18.9.tgz",
      "integrity": "sha512-j11XSuRuAlft6vLDEX4RvhqC0KxNxx6QIyMXNb0vHHSNPXTPeiy3algESWmOOIzEtiEL0qiowPU3ewW9hHVa7Q=="
    },
    "node_modules/@types/node-fetch": {
      "version": "2.5.12",
      "resolved": "https://registry.npmjs.org/@types/node-fetch/-/node-fetch-2.5.12.tgz",
      "integrity": "sha512-MKgC4dlq4kKNa/mYrwpKfzQMB5X3ee5U6fSprkKpToBqBmX4nFZL9cW5jl6sWn+xpRJ7ypWh2yyqqr8UUCstSw==",
      "dependencies": {
        "@types/node": "*",
        "form-data": "^3.0.0"
      }
    },
    "node_modules/@types/node-fetch/node_modules/form-data": {
      "version": "3.0.1",
      "resolved": "https://registry.npmjs.org/form-data/-/form-data-3.0.1.tgz",
      "integrity": "sha512-RHkBKtLWUVwd7SqRIvCZMEvAMoGUp0XU+seQiZejj0COz3RI3hWP4sCv3gZWWLjJTd7rGwcsF5eKZGii0r/hbg==",
      "dependencies": {
        "asynckit": "^0.4.0",
        "combined-stream": "^1.0.8",
        "mime-types": "^2.1.12"
      },
      "engines": {
        "node": ">= 6"
      }
    },
    "node_modules/@types/puppeteer": {
      "version": "1.20.8",
      "resolved": "https://registry.npmjs.org/@types/puppeteer/-/puppeteer-1.20.8.tgz",
      "integrity": "sha512-yJZzz9NeEmTxRGaZzUxUtBIEAoVXTtAx40mG8K0eDPwEeWyuxXKC7Lredxs6uNcgbvMDc8xzYy4v54jbbpoqrg==",
      "dependencies": {
        "@types/node": "*"
      }
    },
    "node_modules/@types/puppeteer-core": {
      "version": "1.20.0",
      "resolved": "https://registry.npmjs.org/@types/puppeteer-core/-/puppeteer-core-1.20.0.tgz",
      "integrity": "sha512-oYsusroRxCydDjKlO9sG41xFFa+PlJr0ZTvCzA97z02PXS9Q3YxyEHvHruUdPZgAxaqwoe96kh66Ni1+fKzuPw==",
      "dependencies": {
        "@types/puppeteer": "^1"
      }
    },
    "node_modules/@types/responselike": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/@types/responselike/-/responselike-1.0.0.tgz",
      "integrity": "sha512-85Y2BjiufFzaMIlvJDvTTB8Fxl2xfLo4HgmHzVBz08w4wDePCTjYw66PdrolO0kzli3yam/YCgRufyo1DdQVTA==",
      "dev": true,
      "dependencies": {
        "@types/node": "*"
      }
    },
    "node_modules/@types/retry": {
      "version": "0.12.1",
      "resolved": "https://registry.npmjs.org/@types/retry/-/retry-0.12.1.tgz",
      "integrity": "sha512-xoDlM2S4ortawSWORYqsdU+2rxdh4LRW9ytc3zmT37RIKQh6IHyKwwtKhKis9ah8ol07DCkZxPt8BBvPjC6v4g=="
    },
    "node_modules/@types/uuid": {
      "version": "3.4.10",
      "resolved": "https://registry.npmjs.org/@types/uuid/-/uuid-3.4.10.tgz",
      "integrity": "sha512-BgeaZuElf7DEYZhWYDTc/XcLZXdVgFkVSTa13BqKvbnmUrxr3TJFKofUxCtDO9UQOdhnV+HPOESdHiHKZOJV1A=="
    },
    "node_modules/@types/yauzl": {
      "version": "2.9.2",
      "resolved": "https://registry.npmjs.org/@types/yauzl/-/yauzl-2.9.2.tgz",
      "integrity": "sha512-8uALY5LTvSuHgloDVUvWP3pIauILm+8/0pDMokuDYIoNsOkSwd5AiHBTSEJjKTDcZr5z8UpgOWZkxBF4iJftoA==",
      "optional": true,
      "dependencies": {
        "@types/node": "*"
      }
    },
    "node_modules/abbrev": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/abbrev/-/abbrev-1.1.1.tgz",
      "integrity": "sha512-nne9/IiQ/hzIhY6pdDnbBtz7DjPTKrY00P/zvPSm5pOFkl6xuGrGnXn/VtTNNfNtAfZ9/1RtehkszU9qcTii0Q==",
      "dev": true
    },
    "node_modules/agent-base": {
      "version": "6.0.2",
      "resolved": "https://registry.npmjs.org/agent-base/-/agent-base-6.0.2.tgz",
      "integrity": "sha512-RZNwNclF7+MS/8bDg70amg32dyeZGZxiDuQmZxKLAlQjr3jGyLx+4Kkk58UO7D2QdgFIQCovuSuZESne6RG6XQ==",
      "dependencies": {
        "debug": "4"
      },
      "engines": {
        "node": ">= 6.0.0"
      }
    },
    "node_modules/agentkeepalive": {
      "version": "4.2.0",
      "resolved": "https://registry.npmjs.org/agentkeepalive/-/agentkeepalive-4.2.0.tgz",
      "integrity": "sha512-0PhAp58jZNw13UJv7NVdTGb0ZcghHUb3DrZ046JiiJY/BOaTTpbwdHq2VObPCBV8M2GPh7sgrJ3AQ8Ey468LJw==",
      "dev": true,
      "dependencies": {
        "debug": "^4.1.0",
        "depd": "^1.1.2",
        "humanize-ms": "^1.2.1"
      },
      "engines": {
        "node": ">= 8.0.0"
      }
    },
    "node_modules/aggregate-error": {
      "version": "3.1.0",
      "resolved": "https://registry.npmjs.org/aggregate-error/-/aggregate-error-3.1.0.tgz",
      "integrity": "sha512-4I7Td01quW/RpocfNayFdFVk1qSuoh0E7JrbRJ16nH01HhKFQ88INq9Sd+nd72zqRySlr9BmDA8xlEJ6vJMrYA==",
      "dev": true,
      "dependencies": {
        "clean-stack": "^2.0.0",
        "indent-string": "^4.0.0"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/ajv": {
      "version": "6.12.6",
      "resolved": "https://registry.npmjs.org/ajv/-/ajv-6.12.6.tgz",
      "integrity": "sha512-j3fVLgvTo527anyYyJOGTYJbG+vnnQYvE0m5mmkc1TK+nxAppkCLMIL0aZ4dblVCNoGShhm+kzE4ZUykBoMg4g==",
      "dev": true,
      "dependencies": {
        "fast-deep-equal": "^3.1.1",
        "fast-json-stable-stringify": "^2.0.0",
        "json-schema-traverse": "^0.4.1",
        "uri-js": "^4.2.2"
      },
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/epoberezkin"
      }
    },
    "node_modules/ansi-escapes": {
      "version": "4.3.2",
      "resolved": "https://registry.npmjs.org/ansi-escapes/-/ansi-escapes-4.3.2.tgz",
      "integrity": "sha512-gKXj5ALrKWQLsYG9jlTRmR/xKluxHV+Z9QEwNIgCfM1/uwPMCuzVVnh5mwTd+OuBZcwSIMbqssNWRm1lE51QaQ==",
      "dev": true,
      "dependencies": {
        "type-fest": "^0.21.3"
      },
      "engines": {
        "node": ">=8"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/ansi-escapes/node_modules/type-fest": {
      "version": "0.21.3",
      "resolved": "https://registry.npmjs.org/type-fest/-/type-fest-0.21.3.tgz",
      "integrity": "sha512-t0rzBq87m3fVcduHDUFhKmyyX+9eo6WQjZvf51Ea/M0Q7+T374Jp1aUiyUl0GKxp8M/OETVHSDvmkyPgvX+X2w==",
      "dev": true,
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/ansi-regex": {
      "version": "5.0.1",
      "resolved": "https://registry.npmjs.org/ansi-regex/-/ansi-regex-5.0.1.tgz",
      "integrity": "sha512-quJQXlTSUGL2LH9SUXo8VwsY4soanhgo6LNSm84E1LBcE8s3O0wpdiRzyR9z/ZZJMlMWv37qOOb9pdJlMUEKFQ==",
      "dev": true,
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/ansi-styles": {
      "version": "4.3.0",
      "resolved": "https://registry.npmjs.org/ansi-styles/-/ansi-styles-4.3.0.tgz",
      "integrity": "sha512-zbB9rCJAT1rbjiVDb2hqKFHNYLxgtk8NURxZ3IZwD3F6NtxbXZQCnnSi1Lkx+IDohdPlFp222wVALIheZJQSEg==",
      "dev": true,
      "dependencies": {
        "color-convert": "^2.0.1"
      },
      "engines": {
        "node": ">=8"
      },
      "funding": {
        "url": "https://github.com/chalk/ansi-styles?sponsor=1"
      }
    },
    "node_modules/aproba": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/aproba/-/aproba-2.0.0.tgz",
      "integrity": "sha512-lYe4Gx7QT+MKGbDsA+Z+he/Wtef0BiwDOlK/XkBrdfsh9J/jPPXbX0tE9x9cl27Tmu5gg3QUbUrQYa/y+KOHPQ==",
      "dev": true
    },
    "node_modules/are-we-there-yet": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/are-we-there-yet/-/are-we-there-yet-2.0.0.tgz",
      "integrity": "sha512-Ci/qENmwHnsYo9xKIcUJN5LeDKdJ6R1Z1j9V/J5wyq8nh/mYPEpIKJbBZXtZjG04HiK7zV/p6Vs9952MrMeUIw==",
      "dev": true,
      "dependencies": {
        "delegates": "^1.0.0",
        "readable-stream": "^3.6.0"
      },
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/are-we-there-yet/node_modules/readable-stream": {
      "version": "3.6.0",
      "resolved": "https://registry.npmjs.org/readable-stream/-/readable-stream-3.6.0.tgz",
      "integrity": "sha512-BViHy7LKeTz4oNnkcLJ+lVSL6vpiFeX6/d3oSH8zCW7UxP2onchk+vTGB143xuFjHS3deTgkKoXXymXqymiIdA==",
      "dev": true,
      "dependencies": {
        "inherits": "^2.0.3",
        "string_decoder": "^1.1.1",
        "util-deprecate": "^1.0.1"
      },
      "engines": {
        "node": ">= 6"
      }
    },
    "node_modules/array-find-index": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/array-find-index/-/array-find-index-1.0.2.tgz",
      "integrity": "sha1-3wEKoSh+Fku9pvlyOwqWoexBh6E=",
      "dev": true,
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/asar": {
      "version": "3.1.0",
      "resolved": "https://registry.npmjs.org/asar/-/asar-3.1.0.tgz",
      "integrity": "sha512-vyxPxP5arcAqN4F/ebHd/HhwnAiZtwhglvdmc7BR2f0ywbVNTOpSeyhLDbGXtE/y58hv1oC75TaNIXutnsOZsQ==",
      "dev": true,
      "dependencies": {
        "chromium-pickle-js": "^0.2.0",
        "commander": "^5.0.0",
        "glob": "^7.1.6",
        "minimatch": "^3.0.4"
      },
      "bin": {
        "asar": "bin/asar.js"
      },
      "engines": {
        "node": ">=10.12.0"
      },
      "optionalDependencies": {
        "@types/glob": "^7.1.1"
      }
    },
    "node_modules/asar/node_modules/commander": {
      "version": "5.1.0",
      "resolved": "https://registry.npmjs.org/commander/-/commander-5.1.0.tgz",
      "integrity": "sha512-P0CysNDQ7rtVw4QIQtm+MRxV66vKFSvlsQvGYXZWR3qFU0jlMKHZZZgw8e+8DSah4UDKMqnknRDQz+xuQXQ/Zg==",
      "dev": true,
      "engines": {
        "node": ">= 6"
      }
    },
    "node_modules/asn1": {
      "version": "0.2.6",
      "resolved": "https://registry.npmjs.org/asn1/-/asn1-0.2.6.tgz",
      "integrity": "sha512-ix/FxPn0MDjeyJ7i/yoHGFt/EX6LyNbxSEhPPXODPL+KB0VPk86UYfL0lMdy+KCnv+fmvIzySwaK5COwqVbWTQ==",
      "dev": true,
      "dependencies": {
        "safer-buffer": "~2.1.0"
      }
    },
    "node_modules/assert-plus": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/assert-plus/-/assert-plus-1.0.0.tgz",
      "integrity": "sha1-8S4PPF13sLHN2RRpQuTpbB5N1SU=",
      "dev": true,
      "engines": {
        "node": ">=0.8"
      }
    },
    "node_modules/async-retry": {
      "version": "1.3.3",
      "resolved": "https://registry.npmjs.org/async-retry/-/async-retry-1.3.3.tgz",
      "integrity": "sha512-wfr/jstw9xNi/0teMHrRW7dsz3Lt5ARhYNZ2ewpadnhaIp5mbALhOAP+EAdsC7t4Z6wqsDVv9+W6gm1Dk9mEyw==",
      "dependencies": {
        "retry": "0.13.1"
      }
    },
    "node_modules/async-retry/node_modules/retry": {
      "version": "0.13.1",
      "resolved": "https://registry.npmjs.org/retry/-/retry-0.13.1.tgz",
      "integrity": "sha512-XQBQ3I8W1Cge0Seh+6gjj03LbmRFWuoszgK9ooCpwYIrhhoO80pfq4cUkU5DkknwfOfFteRwlZ56PYOGYyFWdg==",
      "engines": {
        "node": ">= 4"
      }
    },
    "node_modules/asynckit": {
      "version": "0.4.0",
      "resolved": "https://registry.npmjs.org/asynckit/-/asynckit-0.4.0.tgz",
      "integrity": "sha1-x57Zf380y48robyXkLzDZkdLS3k="
    },
    "node_modules/at-least-node": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/at-least-node/-/at-least-node-1.0.0.tgz",
      "integrity": "sha512-+q/t7Ekv1EDY2l6Gda6LLiX14rU9TV20Wa3ofeQmwPFZbOMo9DXrLbOjFaaclkXKWidIaopwAObQDqwWtGUjqg==",
      "dev": true,
      "engines": {
        "node": ">= 4.0.0"
      }
    },
    "node_modules/author-regex": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/author-regex/-/author-regex-1.0.0.tgz",
      "integrity": "sha1-0IiFvmubv5Q5/gh8dihyRfCoFFA=",
      "dev": true,
      "engines": {
        "node": ">=0.8"
      }
    },
    "node_modules/aws-sign2": {
      "version": "0.7.0",
      "resolved": "https://registry.npmjs.org/aws-sign2/-/aws-sign2-0.7.0.tgz",
      "integrity": "sha1-tG6JCTSpWR8tL2+G1+ap8bP+dqg=",
      "dev": true,
      "engines": {
        "node": "*"
      }
    },
    "node_modules/aws4": {
      "version": "1.11.0",
      "resolved": "https://registry.npmjs.org/aws4/-/aws4-1.11.0.tgz",
      "integrity": "sha512-xh1Rl34h6Fi1DC2WWKfxUTVqRsNnr6LsKz2+hfwDxQJWmrx8+c7ylaqBMcHfl1U1r2dsifOvKX3LQuLNZ+XSvA==",
      "dev": true
    },
    "node_modules/balanced-match": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/balanced-match/-/balanced-match-1.0.2.tgz",
      "integrity": "sha512-3oSeUO0TMV67hN1AmbXsK4yaqU7tjiHlbxRDZOpH0KW9+CeX4bRAaX0Anxt0tx2MrpRpWwQaPwIlISEJhYU5Pw=="
    },
    "node_modules/base64-js": {
      "version": "1.5.1",
      "resolved": "https://registry.npmjs.org/base64-js/-/base64-js-1.5.1.tgz",
      "integrity": "sha512-AKpaYlHn8t4SVbOHCy+b5+KKgvR4vrsD8vbvrbiQJps7fKDTkjkDry6ji0rUJjC0kzbNePLwzxq8iypo41qeWA==",
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/feross"
        },
        {
          "type": "patreon",
          "url": "https://www.patreon.com/feross"
        },
        {
          "type": "consulting",
          "url": "https://feross.org/support"
        }
      ]
    },
    "node_modules/bcrypt-pbkdf": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/bcrypt-pbkdf/-/bcrypt-pbkdf-1.0.2.tgz",
      "integrity": "sha1-pDAdOJtqQ/m2f/PKEaP2Y342Dp4=",
      "dev": true,
      "dependencies": {
        "tweetnacl": "^0.14.3"
      }
    },
    "node_modules/bl": {
      "version": "4.1.0",
      "resolved": "https://registry.npmjs.org/bl/-/bl-4.1.0.tgz",
      "integrity": "sha512-1W07cM9gS6DcLperZfFSj+bWLtaPGSOHWhPiGzXmvVJbRLdG82sH/Kn8EtW1VqWVA54AKf2h5k5BbnIbwF3h6w==",
      "dependencies": {
        "buffer": "^5.5.0",
        "inherits": "^2.0.4",
        "readable-stream": "^3.4.0"
      }
    },
    "node_modules/bl/node_modules/readable-stream": {
      "version": "3.6.0",
      "resolved": "https://registry.npmjs.org/readable-stream/-/readable-stream-3.6.0.tgz",
      "integrity": "sha512-BViHy7LKeTz4oNnkcLJ+lVSL6vpiFeX6/d3oSH8zCW7UxP2onchk+vTGB143xuFjHS3deTgkKoXXymXqymiIdA==",
      "dependencies": {
        "inherits": "^2.0.3",
        "string_decoder": "^1.1.1",
        "util-deprecate": "^1.0.1"
      },
      "engines": {
        "node": ">= 6"
      }
    },
    "node_modules/bluebird": {
      "version": "3.7.2",
      "resolved": "https://registry.npmjs.org/bluebird/-/bluebird-3.7.2.tgz",
      "integrity": "sha512-XpNj6GDQzdfW+r2Wnn7xiSAd7TM3jzkxGXBGTtWKuSXv1xUV+azxAm8jdWZN06QTQk+2N2XB9jRDkvbmQmcRtg==",
      "dev": true
    },
    "node_modules/boolean": {
      "version": "3.1.4",
      "resolved": "https://registry.npmjs.org/boolean/-/boolean-3.1.4.tgz",
      "integrity": "sha512-3hx0kwU3uzG6ReQ3pnaFQPSktpBw6RHN3/ivDKEuU8g1XSfafowyvDnadjv1xp8IZqhtSukxlwv9bF6FhX8m0w==",
      "dev": true,
      "optional": true
    },
    "node_modules/brace-expansion": {
      "version": "1.1.11",
      "resolved": "https://registry.npmjs.org/brace-expansion/-/brace-expansion-1.1.11.tgz",
      "integrity": "sha512-iCuPHDFgrHX7H2vEI/5xpz07zSHB00TpugqhmYtVmMO6518mCuRMoOYFldEBl0g187ufozdaHgWKcYFb61qGiA==",
      "dependencies": {
        "balanced-match": "^1.0.0",
        "concat-map": "0.0.1"
      }
    },
    "node_modules/braces": {
      "version": "3.0.2",
      "resolved": "https://registry.npmjs.org/braces/-/braces-3.0.2.tgz",
      "integrity": "sha512-b8um+L1RzM3WDSzvhm6gIz1yfTbBt6YTlcEKAvsmqCZZFw46z626lVj9j1yEPW33H5H+lBQpZMP1k8l+78Ha0A==",
      "dev": true,
      "dependencies": {
        "fill-range": "^7.0.1"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/buffer": {
      "version": "5.7.1",
      "resolved": "https://registry.npmjs.org/buffer/-/buffer-5.7.1.tgz",
      "integrity": "sha512-EHcyIPBQ4BSGlvjB16k5KgAJ27CIsHY/2JBmCRReo48y9rQ3MaUzWX3KVlBa4U7MyX02HdVj0K7C3WaB3ju7FQ==",
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/feross"
        },
        {
          "type": "patreon",
          "url": "https://www.patreon.com/feross"
        },
        {
          "type": "consulting",
          "url": "https://feross.org/support"
        }
      ],
      "dependencies": {
        "base64-js": "^1.3.1",
        "ieee754": "^1.1.13"
      }
    },
    "node_modules/buffer-alloc": {
      "version": "1.2.0",
      "resolved": "https://registry.npmjs.org/buffer-alloc/-/buffer-alloc-1.2.0.tgz",
      "integrity": "sha512-CFsHQgjtW1UChdXgbyJGtnm+O/uLQeZdtbDo8mfUgYXCHSM1wgrVxXm6bSyrUuErEb+4sYVGCzASBRot7zyrow==",
      "dev": true,
      "dependencies": {
        "buffer-alloc-unsafe": "^1.1.0",
        "buffer-fill": "^1.0.0"
      }
    },
    "node_modules/buffer-alloc-unsafe": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/buffer-alloc-unsafe/-/buffer-alloc-unsafe-1.1.0.tgz",
      "integrity": "sha512-TEM2iMIEQdJ2yjPJoSIsldnleVaAk1oW3DBVUykyOLsEsFmEc9kn+SFFPz+gl54KQNxlDnAwCXosOS9Okx2xAg==",
      "dev": true
    },
    "node_modules/buffer-crc32": {
      "version": "0.2.13",
      "resolved": "https://registry.npmjs.org/buffer-crc32/-/buffer-crc32-0.2.13.tgz",
      "integrity": "sha1-DTM+PwDqxQqhRUq9MO+MKl2ackI=",
      "engines": {
        "node": "*"
      }
    },
    "node_modules/buffer-fill": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/buffer-fill/-/buffer-fill-1.0.0.tgz",
      "integrity": "sha1-+PeLdniYiO858gXNY39o5wISKyw=",
      "dev": true
    },
    "node_modules/buffer-from": {
      "version": "1.1.2",
      "resolved": "https://registry.npmjs.org/buffer-from/-/buffer-from-1.1.2.tgz",
      "integrity": "sha512-E+XQCRwSbaaiChtv6k6Dwgc+bx+Bs6vuKJHHl5kox/BaKbhiXzqQOwK4cO22yElGp2OCmjwVhT3HmxgyPGnJfQ==",
      "dev": true
    },
    "node_modules/cacache": {
      "version": "15.3.0",
      "resolved": "https://registry.npmjs.org/cacache/-/cacache-15.3.0.tgz",
      "integrity": "sha512-VVdYzXEn+cnbXpFgWs5hTT7OScegHVmLhJIR8Ufqk3iFD6A6j5iSX1KuBTfNEv4tdJWE2PzA6IVFtcLC7fN9wQ==",
      "dev": true,
      "dependencies": {
        "@npmcli/fs": "^1.0.0",
        "@npmcli/move-file": "^1.0.1",
        "chownr": "^2.0.0",
        "fs-minipass": "^2.0.0",
        "glob": "^7.1.4",
        "infer-owner": "^1.0.4",
        "lru-cache": "^6.0.0",
        "minipass": "^3.1.1",
        "minipass-collect": "^1.0.2",
        "minipass-flush": "^1.0.5",
        "minipass-pipeline": "^1.2.2",
        "mkdirp": "^1.0.3",
        "p-map": "^4.0.0",
        "promise-inflight": "^1.0.1",
        "rimraf": "^3.0.2",
        "ssri": "^8.0.1",
        "tar": "^6.0.2",
        "unique-filename": "^1.1.1"
      },
      "engines": {
        "node": ">= 10"
      }
    },
    "node_modules/cacache/node_modules/mkdirp": {
      "version": "1.0.4",
      "resolved": "https://registry.npmjs.org/mkdirp/-/mkdirp-1.0.4.tgz",
      "integrity": "sha512-vVqVZQyf3WLx2Shd0qJ9xuvqgAyKPLAiqITEtqW0oIUjzo3PePDd6fW9iFz30ef7Ysp/oiWqbhszeGWW2T6Gzw==",
      "dev": true,
      "bin": {
        "mkdirp": "bin/cmd.js"
      },
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/cacheable-lookup": {
      "version": "5.0.4",
      "resolved": "https://registry.npmjs.org/cacheable-lookup/-/cacheable-lookup-5.0.4.tgz",
      "integrity": "sha512-2/kNscPhpcxrOigMZzbiWF7dz8ilhb/nIHU3EyZiXWXpeq/au8qJ8VhdftMkty3n7Gj6HIGalQG8oiBNB3AJgA==",
      "dev": true,
      "engines": {
        "node": ">=10.6.0"
      }
    },
    "node_modules/cacheable-request": {
      "version": "6.1.0",
      "resolved": "https://registry.npmjs.org/cacheable-request/-/cacheable-request-6.1.0.tgz",
      "integrity": "sha512-Oj3cAGPCqOZX7Rz64Uny2GYAZNliQSqfbePrgAQ1wKAihYmCUnraBtJtKcGR4xz7wF+LoJC+ssFZvv5BgF9Igg==",
      "dev": true,
      "dependencies": {
        "clone-response": "^1.0.2",
        "get-stream": "^5.1.0",
        "http-cache-semantics": "^4.0.0",
        "keyv": "^3.0.0",
        "lowercase-keys": "^2.0.0",
        "normalize-url": "^4.1.0",
        "responselike": "^1.0.2"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/cacheable-request/node_modules/get-stream": {
      "version": "5.2.0",
      "resolved": "https://registry.npmjs.org/get-stream/-/get-stream-5.2.0.tgz",
      "integrity": "sha512-nBF+F1rAZVCu/p7rjzgA+Yb4lfYXrpl7a6VmJrU8wF9I1CKvP/QwPNZHnOlwbTkY6dvtFIzFMSyQXbLoTQPRpA==",
      "dev": true,
      "dependencies": {
        "pump": "^3.0.0"
      },
      "engines": {
        "node": ">=8"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/cacheable-request/node_modules/lowercase-keys": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/lowercase-keys/-/lowercase-keys-2.0.0.tgz",
      "integrity": "sha512-tqNXrS78oMOE73NMxK4EMLQsQowWf8jKooH9g7xPavRT706R6bkQJ6DY2Te7QukaZsulxa30wQ7bk0pm4XiHmA==",
      "dev": true,
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/camelcase": {
      "version": "2.1.1",
      "resolved": "https://registry.npmjs.org/camelcase/-/camelcase-2.1.1.tgz",
      "integrity": "sha1-fB0W1nmhu+WcoCys7PsBHiAfWh8=",
      "dev": true,
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/camelcase-keys": {
      "version": "2.1.0",
      "resolved": "https://registry.npmjs.org/camelcase-keys/-/camelcase-keys-2.1.0.tgz",
      "integrity": "sha1-MIvur/3ygRkFHvodkyITyRuPkuc=",
      "dev": true,
      "dependencies": {
        "camelcase": "^2.0.0",
        "map-obj": "^1.0.0"
      },
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/caseless": {
      "version": "0.12.0",
      "resolved": "https://registry.npmjs.org/caseless/-/caseless-0.12.0.tgz",
      "integrity": "sha1-G2gcIf+EAzyCZUMJBolCDRhxUdw=",
      "dev": true
    },
    "node_modules/chalk": {
      "version": "4.1.2",
      "resolved": "https://registry.npmjs.org/chalk/-/chalk-4.1.2.tgz",
      "integrity": "sha512-oKnbhFyRIXpUuez8iBMmyEa4nbj4IOQyuhc/wy9kY7/WVPcwIO9VA668Pu8RkO7+0G76SLROeyw9CpQ061i4mA==",
      "dev": true,
      "dependencies": {
        "ansi-styles": "^4.1.0",
        "supports-color": "^7.1.0"
      },
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/chalk/chalk?sponsor=1"
      }
    },
    "node_modules/chardet": {
      "version": "0.7.0",
      "resolved": "https://registry.npmjs.org/chardet/-/chardet-0.7.0.tgz",
      "integrity": "sha512-mT8iDcrh03qDGRRmoA2hmBJnxpllMR+0/0qlzjqZES6NdiWDcZkCNAk4rPFZ9Q85r27unkiNNg8ZOiwZXBHwcA==",
      "dev": true
    },
    "node_modules/chownr": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/chownr/-/chownr-2.0.0.tgz",
      "integrity": "sha512-bIomtDF5KGpdogkLd9VspvFzk9KfpyyGlS8YFVZl7TGPBHL5snIOnxeshwVgPteQ9b4Eydl+pVbIyE1DcvCWgQ==",
      "dev": true,
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/chromium-pickle-js": {
      "version": "0.2.0",
      "resolved": "https://registry.npmjs.org/chromium-pickle-js/-/chromium-pickle-js-0.2.0.tgz",
      "integrity": "sha1-BKEGZywYsIWrd02YPfo+oTjyIgU=",
      "dev": true
    },
    "node_modules/clean-stack": {
      "version": "2.2.0",
      "resolved": "https://registry.npmjs.org/clean-stack/-/clean-stack-2.2.0.tgz",
      "integrity": "sha512-4diC9HaTE+KRAMWhDhrGOECgWZxoevMc5TlkObMqNSsVU62PYzXZ/SMTjzyGAFF1YusgxGcSWTEXBhp0CPwQ1A==",
      "dev": true,
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/cli-cursor": {
      "version": "3.1.0",
      "resolved": "https://registry.npmjs.org/cli-cursor/-/cli-cursor-3.1.0.tgz",
      "integrity": "sha512-I/zHAwsKf9FqGoXM4WWRACob9+SNukZTd94DWF57E4toouRulbCxcUh6RKUEOQlYTHJnzkPMySvPNaaSLNfLZw==",
      "dev": true,
      "dependencies": {
        "restore-cursor": "^3.1.0"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/cli-spinners": {
      "version": "2.6.1",
      "resolved": "https://registry.npmjs.org/cli-spinners/-/cli-spinners-2.6.1.tgz",
      "integrity": "sha512-x/5fWmGMnbKQAaNwN+UZlV79qBLM9JFnJuJ03gIi5whrob0xV0ofNVHy9DhwGdsMJQc2OKv0oGmLzvaqvAVv+g==",
      "dev": true,
      "engines": {
        "node": ">=6"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/cli-width": {
      "version": "3.0.0",
      "resolved": "https://registry.npmjs.org/cli-width/-/cli-width-3.0.0.tgz",
      "integrity": "sha512-FxqpkPPwu1HjuN93Omfm4h8uIanXofW0RxVEW3k5RKx+mJJYSthzNhp32Kzxxy3YAEZ/Dc/EWN1vZRY0+kOhbw==",
      "dev": true,
      "engines": {
        "node": ">= 10"
      }
    },
    "node_modules/cliui": {
      "version": "7.0.4",
      "resolved": "https://registry.npmjs.org/cliui/-/cliui-7.0.4.tgz",
      "integrity": "sha512-OcRE68cOsVMXp1Yvonl/fzkQOyjLSu/8bhPDfQt0e0/Eb283TKP20Fs2MqoPsr9SwA595rRCA+QMzYc9nBP+JQ==",
      "dev": true,
      "dependencies": {
        "string-width": "^4.2.0",
        "strip-ansi": "^6.0.0",
        "wrap-ansi": "^7.0.0"
      }
    },
    "node_modules/clone": {
      "version": "1.0.4",
      "resolved": "https://registry.npmjs.org/clone/-/clone-1.0.4.tgz",
      "integrity": "sha1-2jCcwmPfFZlMaIypAheco8fNfH4=",
      "dev": true,
      "engines": {
        "node": ">=0.8"
      }
    },
    "node_modules/clone-response": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/clone-response/-/clone-response-1.0.2.tgz",
      "integrity": "sha1-0dyXOSAxTfZ/vrlCI7TuNQI56Ws=",
      "dev": true,
      "dependencies": {
        "mimic-response": "^1.0.0"
      }
    },
    "node_modules/code-point-at": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/code-point-at/-/code-point-at-1.1.0.tgz",
      "integrity": "sha1-DQcLTQQ6W+ozovGkDi7bPZpMz3c=",
      "dev": true,
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/color-convert": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/color-convert/-/color-convert-2.0.1.tgz",
      "integrity": "sha512-RRECPsj7iu/xb5oKYcsFHSppFNnsj/52OVTRKb4zP5onXwVF3zVmmToNcOfGC+CRDpfK/U584fMg38ZHCaElKQ==",
      "dev": true,
      "dependencies": {
        "color-name": "~1.1.4"
      },
      "engines": {
        "node": ">=7.0.0"
      }
    },
    "node_modules/color-name": {
      "version": "1.1.4",
      "resolved": "https://registry.npmjs.org/color-name/-/color-name-1.1.4.tgz",
      "integrity": "sha512-dOy+3AuW3a2wNbZHIuMZpTcgjGuLU/uBL/ubcZF9OXbDo8ff4O8yVp5Bf0efS8uEoYo5q4Fx7dY9OgQGXgAsQA==",
      "dev": true
    },
    "node_modules/color-support": {
      "version": "1.1.3",
      "resolved": "https://registry.npmjs.org/color-support/-/color-support-1.1.3.tgz",
      "integrity": "sha512-qiBjkpbMLO/HL68y+lh4q0/O1MZFj2RX6X/KmMa3+gJD3z+WwI1ZzDHysvqHGS3mP6mznPckpXmw1nI9cJjyRg==",
      "dev": true,
      "bin": {
        "color-support": "bin.js"
      }
    },
    "node_modules/combined-stream": {
      "version": "1.0.8",
      "resolved": "https://registry.npmjs.org/combined-stream/-/combined-stream-1.0.8.tgz",
      "integrity": "sha512-FQN4MRfuJeHf7cBbBMJFXhKSDq+2kAArBlmRBvcvFE5BB1HZKXtSFASDhdlz9zOYwxh8lDdnvmMOe/+5cdoEdg==",
      "dependencies": {
        "delayed-stream": "~1.0.0"
      },
      "engines": {
        "node": ">= 0.8"
      }
    },
    "node_modules/commander": {
      "version": "4.1.1",
      "resolved": "https://registry.npmjs.org/commander/-/commander-4.1.1.tgz",
      "integrity": "sha512-NOKm8xhkzAjzFx8B2v5OAHT+u5pRQc2UCa2Vq9jYL/31o2wi9mxBA7LIFs3sV5VSC49z6pEhfbMULvShKj26WA==",
      "dev": true,
      "engines": {
        "node": ">= 6"
      }
    },
    "node_modules/compare-version": {
      "version": "0.1.2",
      "resolved": "https://registry.npmjs.org/compare-version/-/compare-version-0.1.2.tgz",
      "integrity": "sha1-AWLsLZNR9d3VmpICy6k1NmpyUIA=",
      "dev": true,
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/concat-map": {
      "version": "0.0.1",
      "resolved": "https://registry.npmjs.org/concat-map/-/concat-map-0.0.1.tgz",
      "integrity": "sha1-2Klr13/Wjfd5OnMDajug1UBdR3s="
    },
    "node_modules/concat-stream": {
      "version": "1.6.2",
      "resolved": "https://registry.npmjs.org/concat-stream/-/concat-stream-1.6.2.tgz",
      "integrity": "sha512-27HBghJxjiZtIk3Ycvn/4kbJk/1uZuJFfuPEns6LaEvpvG1f0hTea8lilrouyo9mVc2GWdcEZ8OLoGmSADlrCw==",
      "dev": true,
      "engines": [
        "node >= 0.8"
      ],
      "dependencies": {
        "buffer-from": "^1.0.0",
        "inherits": "^2.0.3",
        "readable-stream": "^2.2.2",
        "typedarray": "^0.0.6"
      }
    },
    "node_modules/config-chain": {
      "version": "1.1.13",
      "resolved": "https://registry.npmjs.org/config-chain/-/config-chain-1.1.13.tgz",
      "integrity": "sha512-qj+f8APARXHrM0hraqXYb2/bOVSV4PvJQlNZ/DVj0QrmNM2q2euizkeuVckQ57J+W0mRH6Hvi+k50M4Jul2VRQ==",
      "dev": true,
      "optional": true,
      "dependencies": {
        "ini": "^1.3.4",
        "proto-list": "~1.2.1"
      }
    },
    "node_modules/console-control-strings": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/console-control-strings/-/console-control-strings-1.1.0.tgz",
      "integrity": "sha1-PXz0Rk22RG6mRL9LOVB/mFEAjo4=",
      "dev": true
    },
    "node_modules/core-util-is": {
      "version": "1.0.3",
      "resolved": "https://registry.npmjs.org/core-util-is/-/core-util-is-1.0.3.tgz",
      "integrity": "sha512-ZQBvi1DcpJ4GDqanjucZ2Hj3wEO5pZDS89BWbkcrvdxksJorwUDDZamX9ldFkp9aw2lmBDLgkObEA4DWNJ9FYQ==",
      "dev": true
    },
    "node_modules/cross-spawn": {
      "version": "7.0.3",
      "resolved": "https://registry.npmjs.org/cross-spawn/-/cross-spawn-7.0.3.tgz",
      "integrity": "sha512-iRDPJKUPVEND7dHPO8rkbOnPpyDygcDFtWjpeWNCgy8WP2rXcxXL8TskReQl6OrB2G7+UJrags1q15Fudc7G6w==",
      "dev": true,
      "dependencies": {
        "path-key": "^3.1.0",
        "shebang-command": "^2.0.0",
        "which": "^2.0.1"
      },
      "engines": {
        "node": ">= 8"
      }
    },
    "node_modules/cross-spawn-windows-exe": {
      "version": "1.2.0",
      "resolved": "https://registry.npmjs.org/cross-spawn-windows-exe/-/cross-spawn-windows-exe-1.2.0.tgz",
      "integrity": "sha512-mkLtJJcYbDCxEG7Js6eUnUNndWjyUZwJ3H7bErmmtOYU/Zb99DyUkpamuIZE0b3bhmJyZ7D90uS6f+CGxRRjOw==",
      "dev": true,
      "funding": [
        {
          "type": "individual",
          "url": "https://github.com/sponsors/malept"
        },
        {
          "type": "tidelift",
          "url": "https://tidelift.com/subscription/pkg/npm-cross-spawn-windows-exe?utm_medium=referral&utm_source=npm_fund"
        }
      ],
      "dependencies": {
        "@malept/cross-spawn-promise": "^1.1.0",
        "is-wsl": "^2.2.0",
        "which": "^2.0.2"
      },
      "engines": {
        "node": ">= 10"
      }
    },
    "node_modules/cross-spawn-windows-exe/node_modules/@malept/cross-spawn-promise": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/@malept/cross-spawn-promise/-/cross-spawn-promise-1.1.1.tgz",
      "integrity": "sha512-RTBGWL5FWQcg9orDOCcp4LvItNzUPcyEU9bwaeJX0rJ1IQxzucC48Y0/sQLp/g6t99IQgAlGIaesJS+gTn7tVQ==",
      "dev": true,
      "funding": [
        {
          "type": "individual",
          "url": "https://github.com/sponsors/malept"
        },
        {
          "type": "tidelift",
          "url": "https://tidelift.com/subscription/pkg/npm-.malept-cross-spawn-promise?utm_medium=referral&utm_source=npm_fund"
        }
      ],
      "dependencies": {
        "cross-spawn": "^7.0.1"
      },
      "engines": {
        "node": ">= 10"
      }
    },
    "node_modules/cross-zip": {
      "version": "4.0.0",
      "resolved": "https://registry.npmjs.org/cross-zip/-/cross-zip-4.0.0.tgz",
      "integrity": "sha512-MEzGfZo0rqE10O/B+AEcCSJLZsrWuRUvmqJTqHNqBtALhaJc3E3ixLGLJNTRzEA2K34wbmOHC4fwYs9sVsdcCA==",
      "dev": true,
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/feross"
        },
        {
          "type": "patreon",
          "url": "https://www.patreon.com/feross"
        },
        {
          "type": "consulting",
          "url": "https://feross.org/support"
        }
      ],
      "engines": {
        "node": ">=12.10"
      }
    },
    "node_modules/cuint": {
      "version": "0.2.2",
      "resolved": "https://registry.npmjs.org/cuint/-/cuint-0.2.2.tgz",
      "integrity": "sha1-QICG1AlVDCYxFVYZ6fp7ytw7mRs=",
      "dev": true,
      "optional": true
    },
    "node_modules/currently-unhandled": {
      "version": "0.4.1",
      "resolved": "https://registry.npmjs.org/currently-unhandled/-/currently-unhandled-0.4.1.tgz",
      "integrity": "sha1-mI3zP+qxke95mmE2nddsF635V+o=",
      "dev": true,
      "dependencies": {
        "array-find-index": "^1.0.1"
      },
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/dashdash": {
      "version": "1.14.1",
      "resolved": "https://registry.npmjs.org/dashdash/-/dashdash-1.14.1.tgz",
      "integrity": "sha1-hTz6D3y+L+1d4gMmuN1YEDX24vA=",
      "dev": true,
      "dependencies": {
        "assert-plus": "^1.0.0"
      },
      "engines": {
        "node": ">=0.10"
      }
    },
    "node_modules/debug": {
      "version": "4.3.3",
      "resolved": "https://registry.npmjs.org/debug/-/debug-4.3.3.tgz",
      "integrity": "sha512-/zxw5+vh1Tfv+4Qn7a5nsbcJKPaSvCDhojn6FEl9vupwK2VCSDtEiEtqr8DFtzYFOdz63LBkxec7DYuc2jon6Q==",
      "dependencies": {
        "ms": "2.1.2"
      },
      "engines": {
        "node": ">=6.0"
      },
      "peerDependenciesMeta": {
        "supports-color": {
          "optional": true
        }
      }
    },
    "node_modules/decamelize": {
      "version": "1.2.0",
      "resolved": "https://registry.npmjs.org/decamelize/-/decamelize-1.2.0.tgz",
      "integrity": "sha1-9lNNFRSCabIDUue+4m9QH5oZEpA=",
      "dev": true,
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/decompress-response": {
      "version": "3.3.0",
      "resolved": "https://registry.npmjs.org/decompress-response/-/decompress-response-3.3.0.tgz",
      "integrity": "sha1-gKTdMjdIOEv6JICDYirt7Jgq3/M=",
      "dev": true,
      "dependencies": {
        "mimic-response": "^1.0.0"
      },
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/defaults": {
      "version": "1.0.3",
      "resolved": "https://registry.npmjs.org/defaults/-/defaults-1.0.3.tgz",
      "integrity": "sha1-xlYFHpgX2f8I7YgUd/P+QBnz730=",
      "dev": true,
      "dependencies": {
        "clone": "^1.0.2"
      }
    },
    "node_modules/defer-to-connect": {
      "version": "1.1.3",
      "resolved": "https://registry.npmjs.org/defer-to-connect/-/defer-to-connect-1.1.3.tgz",
      "integrity": "sha512-0ISdNousHvZT2EiFlZeZAHBUvSxmKswVCEf8hW7KWgG4a8MVEu/3Vb6uWYozkjylyCxe0JBIiRB1jV45S70WVQ==",
      "dev": true
    },
    "node_modules/define-lazy-prop": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/define-lazy-prop/-/define-lazy-prop-2.0.0.tgz",
      "integrity": "sha512-Ds09qNh8yw3khSjiJjiUInaGX9xlqZDY7JVryGxdxV7NPeuqQfplOpQ66yJFZut3jLa5zOwkXw1g9EI2uKh4Og==",
      "dev": true,
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/define-properties": {
      "version": "1.1.3",
      "resolved": "https://registry.npmjs.org/define-properties/-/define-properties-1.1.3.tgz",
      "integrity": "sha512-3MqfYKj2lLzdMSf8ZIZE/V+Zuy+BgD6f164e8K2w7dgnpKArBDerGYpM46IYYcjnkdPNMjPk9A6VFB8+3SKlXQ==",
      "dev": true,
      "optional": true,
      "dependencies": {
        "object-keys": "^1.0.12"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/delayed-stream": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/delayed-stream/-/delayed-stream-1.0.0.tgz",
      "integrity": "sha1-3zrhmayt+31ECqrgsp4icrJOxhk=",
      "engines": {
        "node": ">=0.4.0"
      }
    },
    "node_modules/delegates": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/delegates/-/delegates-1.0.0.tgz",
      "integrity": "sha1-hMbhWbgZBP3KWaDvRM2HDTElD5o=",
      "dev": true
    },
    "node_modules/depd": {
      "version": "1.1.2",
      "resolved": "https://registry.npmjs.org/depd/-/depd-1.1.2.tgz",
      "integrity": "sha1-m81S4UwJd2PnSbJ0xDRu0uVgtak=",
      "dev": true,
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/detect-libc": {
      "version": "1.0.3",
      "resolved": "https://registry.npmjs.org/detect-libc/-/detect-libc-1.0.3.tgz",
      "integrity": "sha1-+hN8S9aY7fVc1c0CrFWfkaTEups=",
      "dev": true,
      "bin": {
        "detect-libc": "bin/detect-libc.js"
      },
      "engines": {
        "node": ">=0.10"
      }
    },
    "node_modules/detect-node": {
      "version": "2.1.0",
      "resolved": "https://registry.npmjs.org/detect-node/-/detect-node-2.1.0.tgz",
      "integrity": "sha512-T0NIuQpnTvFDATNuHN5roPwSBG83rFsuO+MXXH9/3N1eFbn4wcPjttvjMLEPWJ0RGUYgQE7cGgS3tNxbqCGM7g==",
      "dev": true,
      "optional": true
    },
    "node_modules/devtools-protocol": {
      "version": "0.0.948846",
      "resolved": "https://registry.npmjs.org/devtools-protocol/-/devtools-protocol-0.0.948846.tgz",
      "integrity": "sha512-5fGyt9xmMqUl2VI7+rnUkKCiAQIpLns8sfQtTENy5L70ktbNw0Z3TFJ1JoFNYdx/jffz4YXU45VF75wKZD7sZQ=="
    },
    "node_modules/duplexer3": {
      "version": "0.1.4",
      "resolved": "https://registry.npmjs.org/duplexer3/-/duplexer3-0.1.4.tgz",
      "integrity": "sha1-7gHdHKwO08vH/b6jfcCo8c4ALOI=",
      "dev": true
    },
    "node_modules/ecc-jsbn": {
      "version": "0.1.2",
      "resolved": "https://registry.npmjs.org/ecc-jsbn/-/ecc-jsbn-0.1.2.tgz",
      "integrity": "sha1-OoOpBOVDUyh4dMVkt1SThoSamMk=",
      "dev": true,
      "dependencies": {
        "jsbn": "~0.1.0",
        "safer-buffer": "^2.1.0"
      }
    },
    "node_modules/electron": {
      "version": "16.0.7",
      "resolved": "https://registry.npmjs.org/electron/-/electron-16.0.7.tgz",
      "integrity": "sha512-/IMwpBf2svhA1X/7Q58RV+Nn0fvUJsHniG4TizaO7q4iKFYSQ6hBvsLz+cylcZ8hRMKmVy5G1XaMNJID2ah23w==",
      "dev": true,
      "hasInstallScript": true,
      "dependencies": {
        "@electron/get": "^1.13.0",
        "@types/node": "^14.6.2",
        "extract-zip": "^1.0.3"
      },
      "bin": {
        "electron": "cli.js"
      },
      "engines": {
        "node": ">= 8.6"
      }
    },
    "node_modules/electron-installer-common": {
      "version": "0.10.3",
      "resolved": "https://registry.npmjs.org/electron-installer-common/-/electron-installer-common-0.10.3.tgz",
      "integrity": "sha512-mYbP+6i+nHMIm0WZHXgGdmmXMe+KXncl6jZYQNcCF9C1WsNA9C5SZ2VP4TLQMSIoFO+X4ugkMEA5uld1bmyEvA==",
      "dev": true,
      "optional": true,
      "dependencies": {
        "@malept/cross-spawn-promise": "^1.0.0",
        "asar": "^3.0.0",
        "debug": "^4.1.1",
        "fs-extra": "^9.0.0",
        "glob": "^7.1.4",
        "lodash": "^4.17.15",
        "parse-author": "^2.0.0",
        "semver": "^7.1.1",
        "tmp-promise": "^3.0.2"
      },
      "engines": {
        "node": ">= 10.0.0"
      },
      "funding": {
        "url": "https://github.com/electron-userland/electron-installer-common?sponsor=1"
      },
      "optionalDependencies": {
        "@types/fs-extra": "^9.0.1"
      }
    },
    "node_modules/electron-installer-common/node_modules/@malept/cross-spawn-promise": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/@malept/cross-spawn-promise/-/cross-spawn-promise-1.1.1.tgz",
      "integrity": "sha512-RTBGWL5FWQcg9orDOCcp4LvItNzUPcyEU9bwaeJX0rJ1IQxzucC48Y0/sQLp/g6t99IQgAlGIaesJS+gTn7tVQ==",
      "dev": true,
      "funding": [
        {
          "type": "individual",
          "url": "https://github.com/sponsors/malept"
        },
        {
          "type": "tidelift",
          "url": "https://tidelift.com/subscription/pkg/npm-.malept-cross-spawn-promise?utm_medium=referral&utm_source=npm_fund"
        }
      ],
      "optional": true,
      "dependencies": {
        "cross-spawn": "^7.0.1"
      },
      "engines": {
        "node": ">= 10"
      }
    },
    "node_modules/electron-installer-common/node_modules/fs-extra": {
      "version": "9.1.0",
      "resolved": "https://registry.npmjs.org/fs-extra/-/fs-extra-9.1.0.tgz",
      "integrity": "sha512-hcg3ZmepS30/7BSFqRvoo3DOMQu7IjqxO5nCDt+zM9XWjb33Wg7ziNT+Qvqbuc3+gWpzO02JubVyk2G4Zvo1OQ==",
      "dev": true,
      "optional": true,
      "dependencies": {
        "at-least-node": "^1.0.0",
        "graceful-fs": "^4.2.0",
        "jsonfile": "^6.0.1",
        "universalify": "^2.0.0"
      },
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/electron-installer-common/node_modules/jsonfile": {
      "version": "6.1.0",
      "resolved": "https://registry.npmjs.org/jsonfile/-/jsonfile-6.1.0.tgz",
      "integrity": "sha512-5dgndWOriYSm5cnYaJNhalLNDKOqFwyDB/rr1E9ZsGciGvKPs8R2xYGCacuf3z6K1YKDz182fd+fY3cn3pMqXQ==",
      "dev": true,
      "optional": true,
      "dependencies": {
        "universalify": "^2.0.0"
      },
      "optionalDependencies": {
        "graceful-fs": "^4.1.6"
      }
    },
    "node_modules/electron-installer-common/node_modules/semver": {
      "version": "7.3.5",
      "resolved": "https://registry.npmjs.org/semver/-/semver-7.3.5.tgz",
      "integrity": "sha512-PoeGJYh8HK4BTO/a9Tf6ZG3veo/A7ZVsYrSA6J8ny9nb3B1VrpkuN+z9OE5wfE5p6H4LchYZsegiQgbJD94ZFQ==",
      "dev": true,
      "optional": true,
      "dependencies": {
        "lru-cache": "^6.0.0"
      },
      "bin": {
        "semver": "bin/semver.js"
      },
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/electron-installer-common/node_modules/tmp": {
      "version": "0.2.1",
      "resolved": "https://registry.npmjs.org/tmp/-/tmp-0.2.1.tgz",
      "integrity": "sha512-76SUhtfqR2Ijn+xllcI5P1oyannHNHByD80W1q447gU3mp9G9PSpGdWmjUOHRDPiHYacIk66W7ubDTuPF3BEtQ==",
      "dev": true,
      "optional": true,
      "dependencies": {
        "rimraf": "^3.0.0"
      },
      "engines": {
        "node": ">=8.17.0"
      }
    },
    "node_modules/electron-installer-common/node_modules/tmp-promise": {
      "version": "3.0.3",
      "resolved": "https://registry.npmjs.org/tmp-promise/-/tmp-promise-3.0.3.tgz",
      "integrity": "sha512-RwM7MoPojPxsOBYnyd2hy0bxtIlVrihNs9pj5SUvY8Zz1sQcQG2tG1hSr8PDxfgEB8RNKDhqbIlroIarSNDNsQ==",
      "dev": true,
      "optional": true,
      "dependencies": {
        "tmp": "^0.2.0"
      }
    },
    "node_modules/electron-installer-common/node_modules/universalify": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/universalify/-/universalify-2.0.0.tgz",
      "integrity": "sha512-hAZsKq7Yy11Zu1DE0OzWjw7nnLZmJZYTDZZyEFHZdUhV8FkH5MCfoU1XMaxXovpyW5nq5scPqq0ZDP9Zyl04oQ==",
      "dev": true,
      "optional": true,
      "engines": {
        "node": ">= 10.0.0"
      }
    },
    "node_modules/electron-notarize": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/electron-notarize/-/electron-notarize-1.1.1.tgz",
      "integrity": "sha512-kufsnqh86CTX89AYNG3NCPoboqnku/+32RxeJ2+7A4Rbm4bbOx0Nc7XTy3/gAlBfpj9xPAxHfhZLOHgfi6cJVw==",
      "dev": true,
      "dependencies": {
        "debug": "^4.1.1",
        "fs-extra": "^9.0.1"
      },
      "engines": {
        "node": ">= 10.0.0"
      }
    },
    "node_modules/electron-notarize/node_modules/fs-extra": {
      "version": "9.1.0",
      "resolved": "https://registry.npmjs.org/fs-extra/-/fs-extra-9.1.0.tgz",
      "integrity": "sha512-hcg3ZmepS30/7BSFqRvoo3DOMQu7IjqxO5nCDt+zM9XWjb33Wg7ziNT+Qvqbuc3+gWpzO02JubVyk2G4Zvo1OQ==",
      "dev": true,
      "dependencies": {
        "at-least-node": "^1.0.0",
        "graceful-fs": "^4.2.0",
        "jsonfile": "^6.0.1",
        "universalify": "^2.0.0"
      },
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/electron-notarize/node_modules/jsonfile": {
      "version": "6.1.0",
      "resolved": "https://registry.npmjs.org/jsonfile/-/jsonfile-6.1.0.tgz",
      "integrity": "sha512-5dgndWOriYSm5cnYaJNhalLNDKOqFwyDB/rr1E9ZsGciGvKPs8R2xYGCacuf3z6K1YKDz182fd+fY3cn3pMqXQ==",
      "dev": true,
      "dependencies": {
        "universalify": "^2.0.0"
      },
      "optionalDependencies": {
        "graceful-fs": "^4.1.6"
      }
    },
    "node_modules/electron-notarize/node_modules/universalify": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/universalify/-/universalify-2.0.0.tgz",
      "integrity": "sha512-hAZsKq7Yy11Zu1DE0OzWjw7nnLZmJZYTDZZyEFHZdUhV8FkH5MCfoU1XMaxXovpyW5nq5scPqq0ZDP9Zyl04oQ==",
      "dev": true,
      "engines": {
        "node": ">= 10.0.0"
      }
    },
    "node_modules/electron-osx-sign": {
      "version": "0.5.0",
      "resolved": "https://registry.npmjs.org/electron-osx-sign/-/electron-osx-sign-0.5.0.tgz",
      "integrity": "sha512-icoRLHzFz/qxzDh/N4Pi2z4yVHurlsCAYQvsCSG7fCedJ4UJXBS6PoQyGH71IfcqKupcKeK7HX/NkyfG+v6vlQ==",
      "dev": true,
      "dependencies": {
        "bluebird": "^3.5.0",
        "compare-version": "^0.1.2",
        "debug": "^2.6.8",
        "isbinaryfile": "^3.0.2",
        "minimist": "^1.2.0",
        "plist": "^3.0.1"
      },
      "bin": {
        "electron-osx-flat": "bin/electron-osx-flat.js",
        "electron-osx-sign": "bin/electron-osx-sign.js"
      },
      "engines": {
        "node": ">=4.0.0"
      }
    },
    "node_modules/electron-osx-sign/node_modules/debug": {
      "version": "2.6.9",
      "resolved": "https://registry.npmjs.org/debug/-/debug-2.6.9.tgz",
      "integrity": "sha512-bC7ElrdJaJnPbAP+1EotYvqZsb3ecl5wi6Bfi6BJTUcNowp6cvspg0jXznRTKDjm/E7AdgFBVeAPVMNcKGsHMA==",
      "dev": true,
      "dependencies": {
        "ms": "2.0.0"
      }
    },
    "node_modules/electron-osx-sign/node_modules/ms": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/ms/-/ms-2.0.0.tgz",
      "integrity": "sha1-VgiurfwAvmwpAd9fmGF4jeDVl8g=",
      "dev": true
    },
    "node_modules/electron-packager": {
      "version": "15.4.0",
      "resolved": "https://registry.npmjs.org/electron-packager/-/electron-packager-15.4.0.tgz",
      "integrity": "sha512-JrrLcBP15KGrPj0cZ/ALKGmaQ4gJkn3mocf0E3bRKdR3kxKWYcDRpCvdhksYDXw/r3I6tMEcZ7XzyApWFXdVpw==",
      "dev": true,
      "dependencies": {
        "@electron/get": "^1.6.0",
        "asar": "^3.1.0",
        "cross-spawn-windows-exe": "^1.2.0",
        "debug": "^4.0.1",
        "electron-notarize": "^1.1.1",
        "electron-osx-sign": "^0.5.0",
        "extract-zip": "^2.0.0",
        "filenamify": "^4.1.0",
        "fs-extra": "^9.0.0",
        "galactus": "^0.2.1",
        "get-package-info": "^1.0.0",
        "junk": "^3.1.0",
        "parse-author": "^2.0.0",
        "plist": "^3.0.0",
        "rcedit": "^3.0.1",
        "resolve": "^1.1.6",
        "semver": "^7.1.3",
        "yargs-parser": "^20.0.0"
      },
      "bin": {
        "electron-packager": "bin/electron-packager.js"
      },
      "engines": {
        "node": ">= 10.12.0"
      },
      "funding": {
        "url": "https://github.com/electron/electron-packager?sponsor=1"
      }
    },
    "node_modules/electron-packager/node_modules/extract-zip": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/extract-zip/-/extract-zip-2.0.1.tgz",
      "integrity": "sha512-GDhU9ntwuKyGXdZBUgTIe+vXnWj0fppUEtMDL0+idd5Sta8TGpHssn/eusA9mrPr9qNDym6SxAYZjNvCn/9RBg==",
      "dev": true,
      "dependencies": {
        "debug": "^4.1.1",
        "get-stream": "^5.1.0",
        "yauzl": "^2.10.0"
      },
      "bin": {
        "extract-zip": "cli.js"
      },
      "engines": {
        "node": ">= 10.17.0"
      },
      "optionalDependencies": {
        "@types/yauzl": "^2.9.1"
      }
    },
    "node_modules/electron-packager/node_modules/fs-extra": {
      "version": "9.1.0",
      "resolved": "https://registry.npmjs.org/fs-extra/-/fs-extra-9.1.0.tgz",
      "integrity": "sha512-hcg3ZmepS30/7BSFqRvoo3DOMQu7IjqxO5nCDt+zM9XWjb33Wg7ziNT+Qvqbuc3+gWpzO02JubVyk2G4Zvo1OQ==",
      "dev": true,
      "dependencies": {
        "at-least-node": "^1.0.0",
        "graceful-fs": "^4.2.0",
        "jsonfile": "^6.0.1",
        "universalify": "^2.0.0"
      },
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/electron-packager/node_modules/get-stream": {
      "version": "5.2.0",
      "resolved": "https://registry.npmjs.org/get-stream/-/get-stream-5.2.0.tgz",
      "integrity": "sha512-nBF+F1rAZVCu/p7rjzgA+Yb4lfYXrpl7a6VmJrU8wF9I1CKvP/QwPNZHnOlwbTkY6dvtFIzFMSyQXbLoTQPRpA==",
      "dev": true,
      "dependencies": {
        "pump": "^3.0.0"
      },
      "engines": {
        "node": ">=8"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/electron-packager/node_modules/jsonfile": {
      "version": "6.1.0",
      "resolved": "https://registry.npmjs.org/jsonfile/-/jsonfile-6.1.0.tgz",
      "integrity": "sha512-5dgndWOriYSm5cnYaJNhalLNDKOqFwyDB/rr1E9ZsGciGvKPs8R2xYGCacuf3z6K1YKDz182fd+fY3cn3pMqXQ==",
      "dev": true,
      "dependencies": {
        "universalify": "^2.0.0"
      },
      "optionalDependencies": {
        "graceful-fs": "^4.1.6"
      }
    },
    "node_modules/electron-packager/node_modules/semver": {
      "version": "7.3.5",
      "resolved": "https://registry.npmjs.org/semver/-/semver-7.3.5.tgz",
      "integrity": "sha512-PoeGJYh8HK4BTO/a9Tf6ZG3veo/A7ZVsYrSA6J8ny9nb3B1VrpkuN+z9OE5wfE5p6H4LchYZsegiQgbJD94ZFQ==",
      "dev": true,
      "dependencies": {
        "lru-cache": "^6.0.0"
      },
      "bin": {
        "semver": "bin/semver.js"
      },
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/electron-packager/node_modules/universalify": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/universalify/-/universalify-2.0.0.tgz",
      "integrity": "sha512-hAZsKq7Yy11Zu1DE0OzWjw7nnLZmJZYTDZZyEFHZdUhV8FkH5MCfoU1XMaxXovpyW5nq5scPqq0ZDP9Zyl04oQ==",
      "dev": true,
      "engines": {
        "node": ">= 10.0.0"
      }
    },
    "node_modules/electron-rebuild": {
      "version": "3.2.7",
      "resolved": "https://registry.npmjs.org/electron-rebuild/-/electron-rebuild-3.2.7.tgz",
      "integrity": "sha512-WvaW1EgRinDQ61khHFZfx30rkPQG5ItaOT0wrI7iJv9A3SbghriQGfZQfHZs25fWLBe6/vkv05LOqg6aDw6Wzw==",
      "dev": true,
      "dependencies": {
        "@malept/cross-spawn-promise": "^2.0.0",
        "chalk": "^4.0.0",
        "debug": "^4.1.1",
        "detect-libc": "^1.0.3",
        "fs-extra": "^10.0.0",
        "got": "^11.7.0",
        "lzma-native": "^8.0.5",
        "node-abi": "^3.0.0",
        "node-api-version": "^0.1.4",
        "node-gyp": "^8.4.0",
        "ora": "^5.1.0",
        "semver": "^7.3.5",
        "tar": "^6.0.5",
        "yargs": "^17.0.1"
      },
      "bin": {
        "electron-rebuild": "lib/src/cli.js"
      },
      "engines": {
        "node": ">=12.13.0"
      }
    },
    "node_modules/electron-rebuild/node_modules/@sindresorhus/is": {
      "version": "4.3.0",
      "resolved": "https://registry.npmjs.org/@sindresorhus/is/-/is-4.3.0.tgz",
      "integrity": "sha512-wwOvh0eO3PiTEivGJWiZ+b946SlMSb4pe+y+Ur/4S87cwo09pYi+FWHHnbrM3W9W7cBYKDqQXcrFYjYUCOJUEQ==",
      "dev": true,
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sindresorhus/is?sponsor=1"
      }
    },
    "node_modules/electron-rebuild/node_modules/@szmarczak/http-timer": {
      "version": "4.0.6",
      "resolved": "https://registry.npmjs.org/@szmarczak/http-timer/-/http-timer-4.0.6.tgz",
      "integrity": "sha512-4BAffykYOgO+5nzBWYwE3W90sBgLJoUPRWWcL8wlyiM8IB8ipJz3UMJ9KXQd1RKQXpKp8Tutn80HZtWsu2u76w==",
      "dev": true,
      "dependencies": {
        "defer-to-connect": "^2.0.0"
      },
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/electron-rebuild/node_modules/cacheable-request": {
      "version": "7.0.2",
      "resolved": "https://registry.npmjs.org/cacheable-request/-/cacheable-request-7.0.2.tgz",
      "integrity": "sha512-pouW8/FmiPQbuGpkXQ9BAPv/Mo5xDGANgSNXzTzJ8DrKGuXOssM4wIQRjfanNRh3Yu5cfYPvcorqbhg2KIJtew==",
      "dev": true,
      "dependencies": {
        "clone-response": "^1.0.2",
        "get-stream": "^5.1.0",
        "http-cache-semantics": "^4.0.0",
        "keyv": "^4.0.0",
        "lowercase-keys": "^2.0.0",
        "normalize-url": "^6.0.1",
        "responselike": "^2.0.0"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/electron-rebuild/node_modules/decompress-response": {
      "version": "6.0.0",
      "resolved": "https://registry.npmjs.org/decompress-response/-/decompress-response-6.0.0.tgz",
      "integrity": "sha512-aW35yZM6Bb/4oJlZncMH2LCoZtJXTRxES17vE3hoRiowU2kWHaJKFkSBDnDR+cm9J+9QhXmREyIfv0pji9ejCQ==",
      "dev": true,
      "dependencies": {
        "mimic-response": "^3.1.0"
      },
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/electron-rebuild/node_modules/defer-to-connect": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/defer-to-connect/-/defer-to-connect-2.0.1.tgz",
      "integrity": "sha512-4tvttepXG1VaYGrRibk5EwJd1t4udunSOVMdLSAL6mId1ix438oPwPZMALY41FCijukO1L0twNcGsdzS7dHgDg==",
      "dev": true,
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/electron-rebuild/node_modules/fs-extra": {
      "version": "10.0.0",
      "resolved": "https://registry.npmjs.org/fs-extra/-/fs-extra-10.0.0.tgz",
      "integrity": "sha512-C5owb14u9eJwizKGdchcDUQeFtlSHHthBk8pbX9Vc1PFZrLombudjDnNns88aYslCyF6IY5SUw3Roz6xShcEIQ==",
      "dev": true,
      "dependencies": {
        "graceful-fs": "^4.2.0",
        "jsonfile": "^6.0.1",
        "universalify": "^2.0.0"
      },
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/electron-rebuild/node_modules/get-stream": {
      "version": "5.2.0",
      "resolved": "https://registry.npmjs.org/get-stream/-/get-stream-5.2.0.tgz",
      "integrity": "sha512-nBF+F1rAZVCu/p7rjzgA+Yb4lfYXrpl7a6VmJrU8wF9I1CKvP/QwPNZHnOlwbTkY6dvtFIzFMSyQXbLoTQPRpA==",
      "dev": true,
      "dependencies": {
        "pump": "^3.0.0"
      },
      "engines": {
        "node": ">=8"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/electron-rebuild/node_modules/got": {
      "version": "11.8.3",
      "resolved": "https://registry.npmjs.org/got/-/got-11.8.3.tgz",
      "integrity": "sha512-7gtQ5KiPh1RtGS9/Jbv1ofDpBFuq42gyfEib+ejaRBJuj/3tQFeR5+gw57e4ipaU8c/rCjvX6fkQz2lyDlGAOg==",
      "dev": true,
      "dependencies": {
        "@sindresorhus/is": "^4.0.0",
        "@szmarczak/http-timer": "^4.0.5",
        "@types/cacheable-request": "^6.0.1",
        "@types/responselike": "^1.0.0",
        "cacheable-lookup": "^5.0.3",
        "cacheable-request": "^7.0.2",
        "decompress-response": "^6.0.0",
        "http2-wrapper": "^1.0.0-beta.5.2",
        "lowercase-keys": "^2.0.0",
        "p-cancelable": "^2.0.0",
        "responselike": "^2.0.0"
      },
      "engines": {
        "node": ">=10.19.0"
      },
      "funding": {
        "url": "https://github.com/sindresorhus/got?sponsor=1"
      }
    },
    "node_modules/electron-rebuild/node_modules/json-buffer": {
      "version": "3.0.1",
      "resolved": "https://registry.npmjs.org/json-buffer/-/json-buffer-3.0.1.tgz",
      "integrity": "sha512-4bV5BfR2mqfQTJm+V5tPPdf+ZpuhiIvTuAB5g8kcrXOZpTT/QwwVRWBywX1ozr6lEuPdbHxwaJlm9G6mI2sfSQ==",
      "dev": true
    },
    "node_modules/electron-rebuild/node_modules/jsonfile": {
      "version": "6.1.0",
      "resolved": "https://registry.npmjs.org/jsonfile/-/jsonfile-6.1.0.tgz",
      "integrity": "sha512-5dgndWOriYSm5cnYaJNhalLNDKOqFwyDB/rr1E9ZsGciGvKPs8R2xYGCacuf3z6K1YKDz182fd+fY3cn3pMqXQ==",
      "dev": true,
      "dependencies": {
        "universalify": "^2.0.0"
      },
      "optionalDependencies": {
        "graceful-fs": "^4.1.6"
      }
    },
    "node_modules/electron-rebuild/node_modules/keyv": {
      "version": "4.0.5",
      "resolved": "https://registry.npmjs.org/keyv/-/keyv-4.0.5.tgz",
      "integrity": "sha512-531pkGLqV3BMg0eDqqJFI0R1mkK1Nm5xIP2mM6keP5P8WfFtCkg2IOwplTUmlGoTgIg9yQYZ/kdihhz89XH3vA==",
      "dev": true,
      "dependencies": {
        "json-buffer": "3.0.1"
      }
    },
    "node_modules/electron-rebuild/node_modules/lowercase-keys": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/lowercase-keys/-/lowercase-keys-2.0.0.tgz",
      "integrity": "sha512-tqNXrS78oMOE73NMxK4EMLQsQowWf8jKooH9g7xPavRT706R6bkQJ6DY2Te7QukaZsulxa30wQ7bk0pm4XiHmA==",
      "dev": true,
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/electron-rebuild/node_modules/mimic-response": {
      "version": "3.1.0",
      "resolved": "https://registry.npmjs.org/mimic-response/-/mimic-response-3.1.0.tgz",
      "integrity": "sha512-z0yWI+4FDrrweS8Zmt4Ej5HdJmky15+L2e6Wgn3+iK5fWzb6T3fhNFq2+MeTRb064c6Wr4N/wv0DzQTjNzHNGQ==",
      "dev": true,
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/electron-rebuild/node_modules/normalize-url": {
      "version": "6.1.0",
      "resolved": "https://registry.npmjs.org/normalize-url/-/normalize-url-6.1.0.tgz",
      "integrity": "sha512-DlL+XwOy3NxAQ8xuC0okPgK46iuVNAK01YN7RueYBqqFeGsBjV9XmCAzAdgt+667bCl5kPh9EqKKDwnaPG1I7A==",
      "dev": true,
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/electron-rebuild/node_modules/p-cancelable": {
      "version": "2.1.1",
      "resolved": "https://registry.npmjs.org/p-cancelable/-/p-cancelable-2.1.1.tgz",
      "integrity": "sha512-BZOr3nRQHOntUjTrH8+Lh54smKHoHyur8We1V8DSMVrl5A2malOOwuJRnKRDjSnkoeBh4at6BwEnb5I7Jl31wg==",
      "dev": true,
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/electron-rebuild/node_modules/responselike": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/responselike/-/responselike-2.0.0.tgz",
      "integrity": "sha512-xH48u3FTB9VsZw7R+vvgaKeLKzT6jOogbQhEe/jewwnZgzPcnyWui2Av6JpoYZF/91uueC+lqhWqeURw5/qhCw==",
      "dev": true,
      "dependencies": {
        "lowercase-keys": "^2.0.0"
      }
    },
    "node_modules/electron-rebuild/node_modules/semver": {
      "version": "7.3.5",
      "resolved": "https://registry.npmjs.org/semver/-/semver-7.3.5.tgz",
      "integrity": "sha512-PoeGJYh8HK4BTO/a9Tf6ZG3veo/A7ZVsYrSA6J8ny9nb3B1VrpkuN+z9OE5wfE5p6H4LchYZsegiQgbJD94ZFQ==",
      "dev": true,
      "dependencies": {
        "lru-cache": "^6.0.0"
      },
      "bin": {
        "semver": "bin/semver.js"
      },
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/electron-rebuild/node_modules/universalify": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/universalify/-/universalify-2.0.0.tgz",
      "integrity": "sha512-hAZsKq7Yy11Zu1DE0OzWjw7nnLZmJZYTDZZyEFHZdUhV8FkH5MCfoU1XMaxXovpyW5nq5scPqq0ZDP9Zyl04oQ==",
      "dev": true,
      "engines": {
        "node": ">= 10.0.0"
      }
    },
    "node_modules/electron-squirrel-startup": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/electron-squirrel-startup/-/electron-squirrel-startup-1.0.0.tgz",
      "integrity": "sha1-GbTlWTP6Dvj1VnhLnGYPdyVGoLg=",
      "dependencies": {
        "debug": "^2.2.0"
      }
    },
    "node_modules/electron-squirrel-startup/node_modules/debug": {
      "version": "2.6.9",
      "resolved": "https://registry.npmjs.org/debug/-/debug-2.6.9.tgz",
      "integrity": "sha512-bC7ElrdJaJnPbAP+1EotYvqZsb3ecl5wi6Bfi6BJTUcNowp6cvspg0jXznRTKDjm/E7AdgFBVeAPVMNcKGsHMA==",
      "dependencies": {
        "ms": "2.0.0"
      }
    },
    "node_modules/electron-squirrel-startup/node_modules/ms": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/ms/-/ms-2.0.0.tgz",
      "integrity": "sha1-VgiurfwAvmwpAd9fmGF4jeDVl8g="
    },
    "node_modules/electron-winstaller": {
      "version": "5.0.0",
      "resolved": "https://registry.npmjs.org/electron-winstaller/-/electron-winstaller-5.0.0.tgz",
      "integrity": "sha512-V+jFda7aVAm0htCG8Q95buPUpmXZW9ujh1HdhSlWY6y4QnJnw4TfrmxTlQWV4p2ioF/71JMI/1YF+/qbSICogA==",
      "dev": true,
      "hasInstallScript": true,
      "optional": true,
      "dependencies": {
        "asar": "^2.0.1",
        "debug": "^4.1.1",
        "fs-extra": "^7.0.1",
        "lodash.template": "^4.2.2",
        "temp": "^0.9.0"
      },
      "engines": {
        "node": ">=8.0.0"
      }
    },
    "node_modules/electron-winstaller/node_modules/asar": {
      "version": "2.1.0",
      "resolved": "https://registry.npmjs.org/asar/-/asar-2.1.0.tgz",
      "integrity": "sha512-d2Ovma+bfqNpvBzY/KU8oPY67ZworixTpkjSx0PCXnQi67c2cXmssaTxpFDUM0ttopXoGx/KRxNg/GDThYbXQA==",
      "dev": true,
      "optional": true,
      "dependencies": {
        "chromium-pickle-js": "^0.2.0",
        "commander": "^2.20.0",
        "cuint": "^0.2.2",
        "glob": "^7.1.3",
        "minimatch": "^3.0.4",
        "mkdirp": "^0.5.1",
        "tmp-promise": "^1.0.5"
      },
      "bin": {
        "asar": "bin/asar.js"
      },
      "engines": {
        "node": ">=8.0"
      },
      "optionalDependencies": {
        "@types/glob": "^7.1.1"
      }
    },
    "node_modules/electron-winstaller/node_modules/commander": {
      "version": "2.20.3",
      "resolved": "https://registry.npmjs.org/commander/-/commander-2.20.3.tgz",
      "integrity": "sha512-GpVkmM8vF2vQUkj2LvZmD35JxeJOLCwJ9cUkugyk2nuhbv3+mJvpLYYt+0+USMxE+oj+ey/lJEnhZw75x/OMcQ==",
      "dev": true,
      "optional": true
    },
    "node_modules/electron-winstaller/node_modules/fs-extra": {
      "version": "7.0.1",
      "resolved": "https://registry.npmjs.org/fs-extra/-/fs-extra-7.0.1.tgz",
      "integrity": "sha512-YJDaCJZEnBmcbw13fvdAM9AwNOJwOzrE4pqMqBq5nFiEqXUqHwlK4B+3pUw6JNvfSPtX05xFHtYy/1ni01eGCw==",
      "dev": true,
      "optional": true,
      "dependencies": {
        "graceful-fs": "^4.1.2",
        "jsonfile": "^4.0.0",
        "universalify": "^0.1.0"
      },
      "engines": {
        "node": ">=6 <7 || >=8"
      }
    },
    "node_modules/emoji-regex": {
      "version": "8.0.0",
      "resolved": "https://registry.npmjs.org/emoji-regex/-/emoji-regex-8.0.0.tgz",
      "integrity": "sha512-MSjYzcWNOA0ewAHpz0MxpYFvwg6yjy1NG3xteoqz644VCo/RPgnr1/GGt+ic3iJTzQ8Eu3TdM14SawnVUmGE6A==",
      "dev": true
    },
    "node_modules/encodeurl": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/encodeurl/-/encodeurl-1.0.2.tgz",
      "integrity": "sha1-rT/0yG7C0CkyL1oCw6mmBslbP1k=",
      "dev": true,
      "optional": true,
      "engines": {
        "node": ">= 0.8"
      }
    },
    "node_modules/encoding": {
      "version": "0.1.13",
      "resolved": "https://registry.npmjs.org/encoding/-/encoding-0.1.13.tgz",
      "integrity": "sha512-ETBauow1T35Y/WZMkio9jiM0Z5xjHHmJ4XmjZOq1l/dXz3lr2sRn87nJy20RupqSh1F2m3HHPSp8ShIPQJrJ3A==",
      "optional": true,
      "dependencies": {
        "iconv-lite": "^0.6.2"
      }
    },
    "node_modules/end-of-stream": {
      "version": "1.4.4",
      "resolved": "https://registry.npmjs.org/end-of-stream/-/end-of-stream-1.4.4.tgz",
      "integrity": "sha512-+uw1inIHVPQoaVuHzRyXd21icM+cnt4CzD5rW+NC1wjOUSTOs+Te7FOv7AhN7vS9x/oIyhLP5PR1H+phQAHu5Q==",
      "dependencies": {
        "once": "^1.4.0"
      }
    },
    "node_modules/env-paths": {
      "version": "2.2.1",
      "resolved": "https://registry.npmjs.org/env-paths/-/env-paths-2.2.1.tgz",
      "integrity": "sha512-+h1lkLKhZMTYjog1VEpJNG7NZJWcuc2DDk/qsqSTRRCOXiLjeQ1d1/udrUGhqMxUgAlwKNZ0cf2uqan5GLuS2A==",
      "dev": true,
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/err-code": {
      "version": "2.0.3",
      "resolved": "https://registry.npmjs.org/err-code/-/err-code-2.0.3.tgz",
      "integrity": "sha512-2bmlRpNKBxT/CRmPOlyISQpNj+qSeYvcym/uT0Jx2bMOlKLtSy1ZmLuVxSEKKyor/N5yhvp/ZiG1oE3DEYMSFA==",
      "dev": true
    },
    "node_modules/error-ex": {
      "version": "1.3.2",
      "resolved": "https://registry.npmjs.org/error-ex/-/error-ex-1.3.2.tgz",
      "integrity": "sha512-7dFHNmqeFSEt2ZBsCriorKnn3Z2pj+fd9kmI6QoWw4//DL+icEBfc0U7qJCisqrTsKTjw4fNFy2pW9OqStD84g==",
      "dev": true,
      "dependencies": {
        "is-arrayish": "^0.2.1"
      }
    },
    "node_modules/es6-error": {
      "version": "4.1.1",
      "resolved": "https://registry.npmjs.org/es6-error/-/es6-error-4.1.1.tgz",
      "integrity": "sha512-Um/+FxMr9CISWh0bi5Zv0iOD+4cFh5qLeks1qhAopKVAJw3drgKbKySikp7wGhDL0HPeaja0P5ULZrxLkniUVg==",
      "dev": true,
      "optional": true
    },
    "node_modules/escalade": {
      "version": "3.1.1",
      "resolved": "https://registry.npmjs.org/escalade/-/escalade-3.1.1.tgz",
      "integrity": "sha512-k0er2gUkLf8O0zKJiAhmkTnJlTvINGv7ygDNPbeIsX/TJjGJZHuh9B2UxbsaEkmlEo9MfhrSzmhIlhRlI2GXnw==",
      "dev": true,
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/escape-string-regexp": {
      "version": "4.0.0",
      "resolved": "https://registry.npmjs.org/escape-string-regexp/-/escape-string-regexp-4.0.0.tgz",
      "integrity": "sha512-TtpcNJ3XAzx3Gq8sWRzJaVajRs0uVxA2YAkdb1jm2YkPz4G6egUFAyA3n5vtEIZefPk5Wa4UXbKuS5fKkJWdgA==",
      "dev": true,
      "optional": true,
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/execa": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/execa/-/execa-1.0.0.tgz",
      "integrity": "sha512-adbxcyWV46qiHyvSp50TKt05tB4tK3HcmF7/nxfAdhnox83seTDbwnaqKO4sXRy7roHAIFqJP/Rw/AuEbX61LA==",
      "dev": true,
      "dependencies": {
        "cross-spawn": "^6.0.0",
        "get-stream": "^4.0.0",
        "is-stream": "^1.1.0",
        "npm-run-path": "^2.0.0",
        "p-finally": "^1.0.0",
        "signal-exit": "^3.0.0",
        "strip-eof": "^1.0.0"
      },
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/execa/node_modules/cross-spawn": {
      "version": "6.0.5",
      "resolved": "https://registry.npmjs.org/cross-spawn/-/cross-spawn-6.0.5.tgz",
      "integrity": "sha512-eTVLrBSt7fjbDygz805pMnstIs2VTBNkRm0qxZd+M7A5XDdxVRWO5MxGBXZhjY4cqLYLdtrGqRf8mBPmzwSpWQ==",
      "dev": true,
      "dependencies": {
        "nice-try": "^1.0.4",
        "path-key": "^2.0.1",
        "semver": "^5.5.0",
        "shebang-command": "^1.2.0",
        "which": "^1.2.9"
      },
      "engines": {
        "node": ">=4.8"
      }
    },
    "node_modules/execa/node_modules/path-key": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/path-key/-/path-key-2.0.1.tgz",
      "integrity": "sha1-QRyttXTFoUDTpLGRDUDYDMn0C0A=",
      "dev": true,
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/execa/node_modules/semver": {
      "version": "5.7.1",
      "resolved": "https://registry.npmjs.org/semver/-/semver-5.7.1.tgz",
      "integrity": "sha512-sauaDf/PZdVgrLTNYHRtpXa1iRiKcaebiKQ1BJdpQlWH2lCvexQdX55snPFyK7QzpudqbCI0qXFfOasHdyNDGQ==",
      "dev": true,
      "bin": {
        "semver": "bin/semver"
      }
    },
    "node_modules/execa/node_modules/shebang-command": {
      "version": "1.2.0",
      "resolved": "https://registry.npmjs.org/shebang-command/-/shebang-command-1.2.0.tgz",
      "integrity": "sha1-RKrGW2lbAzmJaMOfNj/uXer98eo=",
      "dev": true,
      "dependencies": {
        "shebang-regex": "^1.0.0"
      },
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/execa/node_modules/shebang-regex": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/shebang-regex/-/shebang-regex-1.0.0.tgz",
      "integrity": "sha1-2kL0l0DAtC2yypcoVxyxkMmO/qM=",
      "dev": true,
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/execa/node_modules/which": {
      "version": "1.3.1",
      "resolved": "https://registry.npmjs.org/which/-/which-1.3.1.tgz",
      "integrity": "sha512-HxJdYWq1MTIQbJ3nw0cqssHoTNU267KlrDuGZ1WYlxDStUtKUhOaJmh112/TZmHxxUfuJqPXSOm7tDyas0OSIQ==",
      "dev": true,
      "dependencies": {
        "isexe": "^2.0.0"
      },
      "bin": {
        "which": "bin/which"
      }
    },
    "node_modules/expand-tilde": {
      "version": "2.0.2",
      "resolved": "https://registry.npmjs.org/expand-tilde/-/expand-tilde-2.0.2.tgz",
      "integrity": "sha1-l+gBqgUt8CRU3kawK/YhZCzchQI=",
      "dev": true,
      "dependencies": {
        "homedir-polyfill": "^1.0.1"
      },
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/extend": {
      "version": "3.0.2",
      "resolved": "https://registry.npmjs.org/extend/-/extend-3.0.2.tgz",
      "integrity": "sha512-fjquC59cD7CyW6urNXK0FBufkZcoiGG80wTuPujX590cB5Ttln20E2UB4S/WARVqhXffZl2LNgS+gQdPIIim/g==",
      "dev": true
    },
    "node_modules/external-editor": {
      "version": "3.1.0",
      "resolved": "https://registry.npmjs.org/external-editor/-/external-editor-3.1.0.tgz",
      "integrity": "sha512-hMQ4CX1p1izmuLYyZqLMO/qGNw10wSv9QDCPfzXfyFrOaCSSoRfqE1Kf1s5an66J5JZC62NewG+mK49jOCtQew==",
      "dev": true,
      "dependencies": {
        "chardet": "^0.7.0",
        "iconv-lite": "^0.4.24",
        "tmp": "^0.0.33"
      },
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/external-editor/node_modules/iconv-lite": {
      "version": "0.4.24",
      "resolved": "https://registry.npmjs.org/iconv-lite/-/iconv-lite-0.4.24.tgz",
      "integrity": "sha512-v3MXnZAcvnywkTUEZomIActle7RXXeedOR31wwl7VlyoXO4Qi9arvSenNQWne1TcRwhCL1HwLI21bEqdpj8/rA==",
      "dev": true,
      "dependencies": {
        "safer-buffer": ">= 2.1.2 < 3"
      },
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/extract-zip": {
      "version": "1.7.0",
      "resolved": "https://registry.npmjs.org/extract-zip/-/extract-zip-1.7.0.tgz",
      "integrity": "sha512-xoh5G1W/PB0/27lXgMQyIhP5DSY/LhoCsOyZgb+6iMmRtCwVBo55uKaMoEYrDCKQhWvqEip5ZPKAc6eFNyf/MA==",
      "dev": true,
      "dependencies": {
        "concat-stream": "^1.6.2",
        "debug": "^2.6.9",
        "mkdirp": "^0.5.4",
        "yauzl": "^2.10.0"
      },
      "bin": {
        "extract-zip": "cli.js"
      }
    },
    "node_modules/extract-zip/node_modules/debug": {
      "version": "2.6.9",
      "resolved": "https://registry.npmjs.org/debug/-/debug-2.6.9.tgz",
      "integrity": "sha512-bC7ElrdJaJnPbAP+1EotYvqZsb3ecl5wi6Bfi6BJTUcNowp6cvspg0jXznRTKDjm/E7AdgFBVeAPVMNcKGsHMA==",
      "dev": true,
      "dependencies": {
        "ms": "2.0.0"
      }
    },
    "node_modules/extract-zip/node_modules/ms": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/ms/-/ms-2.0.0.tgz",
      "integrity": "sha1-VgiurfwAvmwpAd9fmGF4jeDVl8g=",
      "dev": true
    },
    "node_modules/extsprintf": {
      "version": "1.3.0",
      "resolved": "https://registry.npmjs.org/extsprintf/-/extsprintf-1.3.0.tgz",
      "integrity": "sha1-lpGEQOMEGnpBT4xS48V06zw+HgU=",
      "dev": true,
      "engines": [
        "node >=0.6.0"
      ]
    },
    "node_modules/fast-deep-equal": {
      "version": "3.1.3",
      "resolved": "https://registry.npmjs.org/fast-deep-equal/-/fast-deep-equal-3.1.3.tgz",
      "integrity": "sha512-f3qQ9oQy9j2AhBe/H9VC91wLmKBCCU/gDOnKNAYG5hswO7BLKj09Hc5HYNz9cGI++xlpDCIgDaitVs03ATR84Q==",
      "dev": true
    },
    "node_modules/fast-glob": {
      "version": "3.2.11",
      "resolved": "https://registry.npmjs.org/fast-glob/-/fast-glob-3.2.11.tgz",
      "integrity": "sha512-xrO3+1bxSo3ZVHAnqzyuewYT6aMFHRAd4Kcs92MAonjwQZLsK9d0SF1IyQ3k5PoirxTW0Oe/RqFgMQ6TcNE5Ew==",
      "dev": true,
      "dependencies": {
        "@nodelib/fs.stat": "^2.0.2",
        "@nodelib/fs.walk": "^1.2.3",
        "glob-parent": "^5.1.2",
        "merge2": "^1.3.0",
        "micromatch": "^4.0.4"
      },
      "engines": {
        "node": ">=8.6.0"
      }
    },
    "node_modules/fast-json-stable-stringify": {
      "version": "2.1.0",
      "resolved": "https://registry.npmjs.org/fast-json-stable-stringify/-/fast-json-stable-stringify-2.1.0.tgz",
      "integrity": "sha512-lhd/wF+Lk98HZoTCtlVraHtfh5XYijIjalXck7saUtuanSDyLMxnHhSXEDJqHxD7msR8D0uCmqlkwjCV8xvwHw==",
      "dev": true
    },
    "node_modules/fastq": {
      "version": "1.13.0",
      "resolved": "https://registry.npmjs.org/fastq/-/fastq-1.13.0.tgz",
      "integrity": "sha512-YpkpUnK8od0o1hmeSc7UUs/eB/vIPWJYjKck2QKIzAf71Vm1AAQ3EbuZB3g2JIy+pg+ERD0vqI79KyZiB2e2Nw==",
      "dev": true,
      "dependencies": {
        "reusify": "^1.0.4"
      }
    },
    "node_modules/fd-slicer": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/fd-slicer/-/fd-slicer-1.1.0.tgz",
      "integrity": "sha1-JcfInLH5B3+IkbvmHY85Dq4lbx4=",
      "dependencies": {
        "pend": "~1.2.0"
      }
    },
    "node_modules/figures": {
      "version": "3.2.0",
      "resolved": "https://registry.npmjs.org/figures/-/figures-3.2.0.tgz",
      "integrity": "sha512-yaduQFRKLXYOGgEn6AZau90j3ggSOyiqXU0F9JZfeXYhNa+Jk4X+s45A2zg5jns87GAFa34BBm2kXw4XpNcbdg==",
      "dev": true,
      "dependencies": {
        "escape-string-regexp": "^1.0.5"
      },
      "engines": {
        "node": ">=8"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/figures/node_modules/escape-string-regexp": {
      "version": "1.0.5",
      "resolved": "https://registry.npmjs.org/escape-string-regexp/-/escape-string-regexp-1.0.5.tgz",
      "integrity": "sha1-G2HAViGQqN/2rjuyzwIAyhMLhtQ=",
      "dev": true,
      "engines": {
        "node": ">=0.8.0"
      }
    },
    "node_modules/filename-reserved-regex": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/filename-reserved-regex/-/filename-reserved-regex-2.0.0.tgz",
      "integrity": "sha1-q/c9+rc10EVECr/qLZHzieu/oik=",
      "dev": true,
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/filenamify": {
      "version": "4.3.0",
      "resolved": "https://registry.npmjs.org/filenamify/-/filenamify-4.3.0.tgz",
      "integrity": "sha512-hcFKyUG57yWGAzu1CMt/dPzYZuv+jAJUT85bL8mrXvNe6hWj6yEHEc4EdcgiA6Z3oi1/9wXJdZPXF2dZNgwgOg==",
      "dev": true,
      "dependencies": {
        "filename-reserved-regex": "^2.0.0",
        "strip-outer": "^1.0.1",
        "trim-repeated": "^1.0.0"
      },
      "engines": {
        "node": ">=8"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/fill-range": {
      "version": "7.0.1",
      "resolved": "https://registry.npmjs.org/fill-range/-/fill-range-7.0.1.tgz",
      "integrity": "sha512-qOo9F+dMUmC2Lcb4BbVvnKJxTPjCm+RRpe4gDuGrzkL7mEVl/djYSu2OdQ2Pa302N4oqkSg9ir6jaLWJ2USVpQ==",
      "dev": true,
      "dependencies": {
        "to-regex-range": "^5.0.1"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/find-up": {
      "version": "5.0.0",
      "resolved": "https://registry.npmjs.org/find-up/-/find-up-5.0.0.tgz",
      "integrity": "sha512-78/PXT1wlLLDgTzDs7sjq9hzz0vXD+zn+7wypEe4fXQxCmdmqfGsEPQxmiCSQI3ajFV91bVSsvNtrJRiW6nGng==",
      "dev": true,
      "dependencies": {
        "locate-path": "^6.0.0",
        "path-exists": "^4.0.0"
      },
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/find-up/node_modules/locate-path": {
      "version": "6.0.0",
      "resolved": "https://registry.npmjs.org/locate-path/-/locate-path-6.0.0.tgz",
      "integrity": "sha512-iPZK6eYjbxRu3uB4/WZ3EsEIMJFMqAoopl3R+zuq0UjcAm/MO6KCweDgPfP3elTztoKP3KtnVHxTn2NHBSDVUw==",
      "dev": true,
      "dependencies": {
        "p-locate": "^5.0.0"
      },
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/find-up/node_modules/p-limit": {
      "version": "3.1.0",
      "resolved": "https://registry.npmjs.org/p-limit/-/p-limit-3.1.0.tgz",
      "integrity": "sha512-TYOanM3wGwNGsZN2cVTYPArw454xnXj5qmWF1bEoAc4+cU/ol7GVh7odevjp1FNHduHc3KZMcFduxU5Xc6uJRQ==",
      "dev": true,
      "dependencies": {
        "yocto-queue": "^0.1.0"
      },
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/find-up/node_modules/p-locate": {
      "version": "5.0.0",
      "resolved": "https://registry.npmjs.org/p-locate/-/p-locate-5.0.0.tgz",
      "integrity": "sha512-LaNjtRWUBY++zB5nE/NwcaoMylSPk+S+ZHNB1TzdbMJMny6dynpAGt7X/tl/QYq3TIeE6nxHppbo2LGymrG5Pw==",
      "dev": true,
      "dependencies": {
        "p-limit": "^3.0.2"
      },
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/find-up/node_modules/path-exists": {
      "version": "4.0.0",
      "resolved": "https://registry.npmjs.org/path-exists/-/path-exists-4.0.0.tgz",
      "integrity": "sha512-ak9Qy5Q7jYb2Wwcey5Fpvg2KoAc/ZIhLSLOSBmRmygPsGwkVVt0fZa0qrtMz+m6tJTAHfZQ8FnmB4MG4LWy7/w==",
      "dev": true,
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/flora-colossus": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/flora-colossus/-/flora-colossus-1.0.1.tgz",
      "integrity": "sha512-d+9na7t9FyH8gBJoNDSi28mE4NgQVGGvxQ4aHtFRetjyh5SXjuus+V5EZaxFmFdXVemSOrx0lsgEl/ZMjnOWJA==",
      "dev": true,
      "dependencies": {
        "debug": "^4.1.1",
        "fs-extra": "^7.0.0"
      },
      "engines": {
        "node": ">= 6.0.0"
      }
    },
    "node_modules/flora-colossus/node_modules/fs-extra": {
      "version": "7.0.1",
      "resolved": "https://registry.npmjs.org/fs-extra/-/fs-extra-7.0.1.tgz",
      "integrity": "sha512-YJDaCJZEnBmcbw13fvdAM9AwNOJwOzrE4pqMqBq5nFiEqXUqHwlK4B+3pUw6JNvfSPtX05xFHtYy/1ni01eGCw==",
      "dev": true,
      "dependencies": {
        "graceful-fs": "^4.1.2",
        "jsonfile": "^4.0.0",
        "universalify": "^0.1.0"
      },
      "engines": {
        "node": ">=6 <7 || >=8"
      }
    },
    "node_modules/forever-agent": {
      "version": "0.6.1",
      "resolved": "https://registry.npmjs.org/forever-agent/-/forever-agent-0.6.1.tgz",
      "integrity": "sha1-+8cfDEGt6zf5bFd60e1C2P2sypE=",
      "dev": true,
      "engines": {
        "node": "*"
      }
    },
    "node_modules/form-data": {
      "version": "2.3.3",
      "resolved": "https://registry.npmjs.org/form-data/-/form-data-2.3.3.tgz",
      "integrity": "sha512-1lLKB2Mu3aGP1Q/2eCOx0fNbRMe7XdwktwOruhfqqd0rIJWwN4Dh+E3hrPSlDCXnSR7UtZ1N38rVXm+6+MEhJQ==",
      "dev": true,
      "dependencies": {
        "asynckit": "^0.4.0",
        "combined-stream": "^1.0.6",
        "mime-types": "^2.1.12"
      },
      "engines": {
        "node": ">= 0.12"
      }
    },
    "node_modules/fs-constants": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/fs-constants/-/fs-constants-1.0.0.tgz",
      "integrity": "sha512-y6OAwoSIf7FyjMIv94u+b5rdheZEjzR63GTyZJm5qh4Bi+2YgwLCcI/fPFZkL5PSixOt6ZNKm+w+Hfp/Bciwow=="
    },
    "node_modules/fs-extra": {
      "version": "8.1.0",
      "resolved": "https://registry.npmjs.org/fs-extra/-/fs-extra-8.1.0.tgz",
      "integrity": "sha512-yhlQgA6mnOJUKOsRUFsgJdQCvkKhcz8tlZG5HBQfReYZy46OwLcY+Zia0mtdHsOo9y/hP+CxMN0TU9QxoOtG4g==",
      "dev": true,
      "dependencies": {
        "graceful-fs": "^4.2.0",
        "jsonfile": "^4.0.0",
        "universalify": "^0.1.0"
      },
      "engines": {
        "node": ">=6 <7 || >=8"
      }
    },
    "node_modules/fs-minipass": {
      "version": "2.1.0",
      "resolved": "https://registry.npmjs.org/fs-minipass/-/fs-minipass-2.1.0.tgz",
      "integrity": "sha512-V/JgOLFCS+R6Vcq0slCuaeWEdNC3ouDlJMNIsacH2VtALiu9mV4LPrHc5cDl8k5aw6J8jwgWWpiTo5RYhmIzvg==",
      "dev": true,
      "dependencies": {
        "minipass": "^3.0.0"
      },
      "engines": {
        "node": ">= 8"
      }
    },
    "node_modules/fs.realpath": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/fs.realpath/-/fs.realpath-1.0.0.tgz",
      "integrity": "sha1-FQStJSMVjKpA20onh8sBQRmU6k8="
    },
    "node_modules/function-bind": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/function-bind/-/function-bind-1.1.1.tgz",
      "integrity": "sha512-yIovAzMX49sF8Yl58fSCWJ5svSLuaibPxXQJFLmBObTuCr0Mf1KiPopGM9NiFjiYBCbfaa2Fh6breQ6ANVTI0A==",
      "dev": true
    },
    "node_modules/galactus": {
      "version": "0.2.1",
      "resolved": "https://registry.npmjs.org/galactus/-/galactus-0.2.1.tgz",
      "integrity": "sha1-y+0tIKQMH1Z5o1kI4rlBVzPnjbk=",
      "dev": true,
      "dependencies": {
        "debug": "^3.1.0",
        "flora-colossus": "^1.0.0",
        "fs-extra": "^4.0.0"
      }
    },
    "node_modules/galactus/node_modules/debug": {
      "version": "3.2.7",
      "resolved": "https://registry.npmjs.org/debug/-/debug-3.2.7.tgz",
      "integrity": "sha512-CFjzYYAi4ThfiQvizrFQevTTXHtnCqWfe7x1AhgEscTz6ZbLbfoLRLPugTQyBth6f8ZERVUSyWHFD/7Wu4t1XQ==",
      "dev": true,
      "dependencies": {
        "ms": "^2.1.1"
      }
    },
    "node_modules/galactus/node_modules/fs-extra": {
      "version": "4.0.3",
      "resolved": "https://registry.npmjs.org/fs-extra/-/fs-extra-4.0.3.tgz",
      "integrity": "sha512-q6rbdDd1o2mAnQreO7YADIxf/Whx4AHBiRf6d+/cVT8h44ss+lHgxf1FemcqDnQt9X3ct4McHr+JMGlYSsK7Cg==",
      "dev": true,
      "dependencies": {
        "graceful-fs": "^4.1.2",
        "jsonfile": "^4.0.0",
        "universalify": "^0.1.0"
      }
    },
    "node_modules/gauge": {
      "version": "4.0.0",
      "resolved": "https://registry.npmjs.org/gauge/-/gauge-4.0.0.tgz",
      "integrity": "sha512-F8sU45yQpjQjxKkm1UOAhf0U/O0aFt//Fl7hsrNVto+patMHjs7dPI9mFOGUKbhrgKm0S3EjW3scMFuQmWSROw==",
      "dev": true,
      "dependencies": {
        "ansi-regex": "^5.0.1",
        "aproba": "^1.0.3 || ^2.0.0",
        "color-support": "^1.1.2",
        "console-control-strings": "^1.0.0",
        "has-unicode": "^2.0.1",
        "signal-exit": "^3.0.0",
        "string-width": "^4.2.3",
        "strip-ansi": "^6.0.1",
        "wide-align": "^1.1.2"
      },
      "engines": {
        "node": "^12.13.0 || ^14.15.0 || >=16"
      }
    },
    "node_modules/get-caller-file": {
      "version": "2.0.5",
      "resolved": "https://registry.npmjs.org/get-caller-file/-/get-caller-file-2.0.5.tgz",
      "integrity": "sha512-DyFP3BM/3YHTQOCUL/w0OZHR0lpKeGrxotcHWcqNEdnltqFwXVfhEBQ94eIo34AfQpo0rGki4cyIiftY06h2Fg==",
      "dev": true,
      "engines": {
        "node": "6.* || 8.* || >= 10.*"
      }
    },
    "node_modules/get-installed-path": {
      "version": "2.1.1",
      "resolved": "https://registry.npmjs.org/get-installed-path/-/get-installed-path-2.1.1.tgz",
      "integrity": "sha512-Qkn9eq6tW5/q9BDVdMpB8tOHljX9OSP0jRC5TRNVA4qRc839t4g8KQaR8t0Uv0EFVL0MlyG7m/ofjEgAROtYsA==",
      "dev": true,
      "dependencies": {
        "global-modules": "1.0.0"
      }
    },
    "node_modules/get-package-info": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/get-package-info/-/get-package-info-1.0.0.tgz",
      "integrity": "sha1-ZDJ5ZWPigRPNlHTbvQAFKYWkmZw=",
      "dev": true,
      "dependencies": {
        "bluebird": "^3.1.1",
        "debug": "^2.2.0",
        "lodash.get": "^4.0.0",
        "read-pkg-up": "^2.0.0"
      },
      "engines": {
        "node": ">= 4.0"
      }
    },
    "node_modules/get-package-info/node_modules/debug": {
      "version": "2.6.9",
      "resolved": "https://registry.npmjs.org/debug/-/debug-2.6.9.tgz",
      "integrity": "sha512-bC7ElrdJaJnPbAP+1EotYvqZsb3ecl5wi6Bfi6BJTUcNowp6cvspg0jXznRTKDjm/E7AdgFBVeAPVMNcKGsHMA==",
      "dev": true,
      "dependencies": {
        "ms": "2.0.0"
      }
    },
    "node_modules/get-package-info/node_modules/ms": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/ms/-/ms-2.0.0.tgz",
      "integrity": "sha1-VgiurfwAvmwpAd9fmGF4jeDVl8g=",
      "dev": true
    },
    "node_modules/get-port": {
      "version": "5.1.1",
      "resolved": "https://registry.npmjs.org/get-port/-/get-port-5.1.1.tgz",
      "integrity": "sha512-g/Q1aTSDOxFpchXC4i8ZWvxA1lnPqx/JHqcpIw0/LX9T8x/GBbi6YnlN5nhaKIFkT8oFsscUKgDJYxfwfS6QsQ==",
      "engines": {
        "node": ">=8"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/get-stdin": {
      "version": "4.0.1",
      "resolved": "https://registry.npmjs.org/get-stdin/-/get-stdin-4.0.1.tgz",
      "integrity": "sha1-uWjGsKBDhDJJAui/Gl3zJXmkUP4=",
      "dev": true,
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/get-stream": {
      "version": "4.1.0",
      "resolved": "https://registry.npmjs.org/get-stream/-/get-stream-4.1.0.tgz",
      "integrity": "sha512-GMat4EJ5161kIy2HevLlr4luNjBgvmj413KaQA7jt4V8B4RDsfpHk7WQ9GVqfYyyx8OS/L66Kox+rJRNklLK7w==",
      "dev": true,
      "dependencies": {
        "pump": "^3.0.0"
      },
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/getpass": {
      "version": "0.1.7",
      "resolved": "https://registry.npmjs.org/getpass/-/getpass-0.1.7.tgz",
      "integrity": "sha1-Xv+OPmhNVprkyysSgmBOi6YhSfo=",
      "dev": true,
      "dependencies": {
        "assert-plus": "^1.0.0"
      }
    },
    "node_modules/glob": {
      "version": "7.2.0",
      "resolved": "https://registry.npmjs.org/glob/-/glob-7.2.0.tgz",
      "integrity": "sha512-lmLf6gtyrPq8tTjSmrO94wBeQbFR3HbLHbuyD69wuyQkImp2hWqMGB47OX65FBkPffO641IP9jWa1z4ivqG26Q==",
      "dependencies": {
        "fs.realpath": "^1.0.0",
        "inflight": "^1.0.4",
        "inherits": "2",
        "minimatch": "^3.0.4",
        "once": "^1.3.0",
        "path-is-absolute": "^1.0.0"
      },
      "engines": {
        "node": "*"
      },
      "funding": {
        "url": "https://github.com/sponsors/isaacs"
      }
    },
    "node_modules/glob-parent": {
      "version": "5.1.2",
      "resolved": "https://registry.npmjs.org/glob-parent/-/glob-parent-5.1.2.tgz",
      "integrity": "sha512-AOIgSQCepiJYwP3ARnGx+5VnTu2HBYdzbGP45eLw1vr3zB3vZLeyed1sC9hnbcOc9/SrMyM5RPQrkGz4aS9Zow==",
      "dev": true,
      "dependencies": {
        "is-glob": "^4.0.1"
      },
      "engines": {
        "node": ">= 6"
      }
    },
    "node_modules/global-agent": {
      "version": "3.0.0",
      "resolved": "https://registry.npmjs.org/global-agent/-/global-agent-3.0.0.tgz",
      "integrity": "sha512-PT6XReJ+D07JvGoxQMkT6qji/jVNfX/h364XHZOWeRzy64sSFr+xJ5OX7LI3b4MPQzdL4H8Y8M0xzPpsVMwA8Q==",
      "dev": true,
      "optional": true,
      "dependencies": {
        "boolean": "^3.0.1",
        "es6-error": "^4.1.1",
        "matcher": "^3.0.0",
        "roarr": "^2.15.3",
        "semver": "^7.3.2",
        "serialize-error": "^7.0.1"
      },
      "engines": {
        "node": ">=10.0"
      }
    },
    "node_modules/global-agent/node_modules/semver": {
      "version": "7.3.5",
      "resolved": "https://registry.npmjs.org/semver/-/semver-7.3.5.tgz",
      "integrity": "sha512-PoeGJYh8HK4BTO/a9Tf6ZG3veo/A7ZVsYrSA6J8ny9nb3B1VrpkuN+z9OE5wfE5p6H4LchYZsegiQgbJD94ZFQ==",
      "dev": true,
      "optional": true,
      "dependencies": {
        "lru-cache": "^6.0.0"
      },
      "bin": {
        "semver": "bin/semver.js"
      },
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/global-modules": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/global-modules/-/global-modules-1.0.0.tgz",
      "integrity": "sha512-sKzpEkf11GpOFuw0Zzjzmt4B4UZwjOcG757PPvrfhxcLFbq0wpsgpOqxpxtxFiCG4DtG93M6XRVbF2oGdev7bg==",
      "dev": true,
      "dependencies": {
        "global-prefix": "^1.0.1",
        "is-windows": "^1.0.1",
        "resolve-dir": "^1.0.0"
      },
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/global-prefix": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/global-prefix/-/global-prefix-1.0.2.tgz",
      "integrity": "sha1-2/dDxsFJklk8ZVVoy2btMsASLr4=",
      "dev": true,
      "dependencies": {
        "expand-tilde": "^2.0.2",
        "homedir-polyfill": "^1.0.1",
        "ini": "^1.3.4",
        "is-windows": "^1.0.1",
        "which": "^1.2.14"
      },
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/global-prefix/node_modules/which": {
      "version": "1.3.1",
      "resolved": "https://registry.npmjs.org/which/-/which-1.3.1.tgz",
      "integrity": "sha512-HxJdYWq1MTIQbJ3nw0cqssHoTNU267KlrDuGZ1WYlxDStUtKUhOaJmh112/TZmHxxUfuJqPXSOm7tDyas0OSIQ==",
      "dev": true,
      "dependencies": {
        "isexe": "^2.0.0"
      },
      "bin": {
        "which": "bin/which"
      }
    },
    "node_modules/global-tunnel-ng": {
      "version": "2.7.1",
      "resolved": "https://registry.npmjs.org/global-tunnel-ng/-/global-tunnel-ng-2.7.1.tgz",
      "integrity": "sha512-4s+DyciWBV0eK148wqXxcmVAbFVPqtc3sEtUE/GTQfuU80rySLcMhUmHKSHI7/LDj8q0gDYI1lIhRRB7ieRAqg==",
      "dev": true,
      "optional": true,
      "dependencies": {
        "encodeurl": "^1.0.2",
        "lodash": "^4.17.10",
        "npm-conf": "^1.1.3",
        "tunnel": "^0.0.6"
      },
      "engines": {
        "node": ">=0.10"
      }
    },
    "node_modules/globalthis": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/globalthis/-/globalthis-1.0.2.tgz",
      "integrity": "sha512-ZQnSFO1la8P7auIOQECnm0sSuoMeaSq0EEdXMBFF2QJO4uNcwbyhSgG3MruWNbFTqCLmxVwGOl7LZ9kASvHdeQ==",
      "dev": true,
      "optional": true,
      "dependencies": {
        "define-properties": "^1.1.3"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/got": {
      "version": "9.6.0",
      "resolved": "https://registry.npmjs.org/got/-/got-9.6.0.tgz",
      "integrity": "sha512-R7eWptXuGYxwijs0eV+v3o6+XH1IqVK8dJOEecQfTmkncw9AV4dcw/Dhxi8MdlqPthxxpZyizMzyg8RTmEsG+Q==",
      "dev": true,
      "dependencies": {
        "@sindresorhus/is": "^0.14.0",
        "@szmarczak/http-timer": "^1.1.2",
        "cacheable-request": "^6.0.0",
        "decompress-response": "^3.3.0",
        "duplexer3": "^0.1.4",
        "get-stream": "^4.1.0",
        "lowercase-keys": "^1.0.1",
        "mimic-response": "^1.0.1",
        "p-cancelable": "^1.0.0",
        "to-readable-stream": "^1.0.0",
        "url-parse-lax": "^3.0.0"
      },
      "engines": {
        "node": ">=8.6"
      }
    },
    "node_modules/graceful-fs": {
      "version": "4.2.9",
      "resolved": "https://registry.npmjs.org/graceful-fs/-/graceful-fs-4.2.9.tgz",
      "integrity": "sha512-NtNxqUcXgpW2iMrfqSfR73Glt39K+BLwWsPs94yR63v45T0Wbej7eRmL5cWfwEgqXnmjQp3zaJTshdRW/qC2ZQ==",
      "dev": true
    },
    "node_modules/har-schema": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/har-schema/-/har-schema-2.0.0.tgz",
      "integrity": "sha1-qUwiJOvKwEeCoNkDVSHyRzW37JI=",
      "dev": true,
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/har-validator": {
      "version": "5.1.5",
      "resolved": "https://registry.npmjs.org/har-validator/-/har-validator-5.1.5.tgz",
      "integrity": "sha512-nmT2T0lljbxdQZfspsno9hgrG3Uir6Ks5afism62poxqBM6sDnMEuPmzTq8XN0OEwqKLLdh1jQI3qyE66Nzb3w==",
      "deprecated": "this library is no longer supported",
      "dev": true,
      "dependencies": {
        "ajv": "^6.12.3",
        "har-schema": "^2.0.0"
      },
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/has": {
      "version": "1.0.3",
      "resolved": "https://registry.npmjs.org/has/-/has-1.0.3.tgz",
      "integrity": "sha512-f2dvO0VU6Oej7RkWJGrehjbzMAjFp5/VKPp5tTpWIV4JHHZK1/BxbFRtf/siA2SWTe09caDmVtYYzWEIbBS4zw==",
      "dev": true,
      "dependencies": {
        "function-bind": "^1.1.1"
      },
      "engines": {
        "node": ">= 0.4.0"
      }
    },
    "node_modules/has-flag": {
      "version": "4.0.0",
      "resolved": "https://registry.npmjs.org/has-flag/-/has-flag-4.0.0.tgz",
      "integrity": "sha512-EykJT/Q1KjTWctppgIAgfSO0tKVuZUjhgMr17kqTumMl6Afv3EISleU7qZUzoXDFTAHTDC4NOoG/ZxU3EvlMPQ==",
      "dev": true,
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/has-unicode": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/has-unicode/-/has-unicode-2.0.1.tgz",
      "integrity": "sha1-4Ob+aijPUROIVeCG0Wkedx3iqLk=",
      "dev": true
    },
    "node_modules/homedir-polyfill": {
      "version": "1.0.3",
      "resolved": "https://registry.npmjs.org/homedir-polyfill/-/homedir-polyfill-1.0.3.tgz",
      "integrity": "sha512-eSmmWE5bZTK2Nou4g0AI3zZ9rswp7GRKoKXS1BLUkvPviOqs4YTN1djQIqrXy9k5gEtdLPy86JjRwsNM9tnDcA==",
      "dev": true,
      "dependencies": {
        "parse-passwd": "^1.0.0"
      },
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/hosted-git-info": {
      "version": "2.8.9",
      "resolved": "https://registry.npmjs.org/hosted-git-info/-/hosted-git-info-2.8.9.tgz",
      "integrity": "sha512-mxIDAb9Lsm6DoOJ7xH+5+X4y1LU/4Hi50L9C5sIswK3JzULS4bwk1FvjdBgvYR4bzT4tuUQiC15FE2f5HbLvYw==",
      "dev": true
    },
    "node_modules/http-cache-semantics": {
      "version": "4.1.0",
      "resolved": "https://registry.npmjs.org/http-cache-semantics/-/http-cache-semantics-4.1.0.tgz",
      "integrity": "sha512-carPklcUh7ROWRK7Cv27RPtdhYhUsela/ue5/jKzjegVvXDqM2ILE9Q2BGn9JZJh1g87cp56su/FgQSzcWS8cQ==",
      "dev": true
    },
    "node_modules/http-proxy-agent": {
      "version": "4.0.1",
      "resolved": "https://registry.npmjs.org/http-proxy-agent/-/http-proxy-agent-4.0.1.tgz",
      "integrity": "sha512-k0zdNgqWTGA6aeIRVpvfVob4fL52dTfaehylg0Y4UvSySvOq/Y+BOyPrgpUrA7HylqvU8vIZGsRuXmspskV0Tg==",
      "dev": true,
      "dependencies": {
        "@tootallnate/once": "1",
        "agent-base": "6",
        "debug": "4"
      },
      "engines": {
        "node": ">= 6"
      }
    },
    "node_modules/http-signature": {
      "version": "1.2.0",
      "resolved": "https://registry.npmjs.org/http-signature/-/http-signature-1.2.0.tgz",
      "integrity": "sha1-muzZJRFHcvPZW2WmCruPfBj7rOE=",
      "dev": true,
      "dependencies": {
        "assert-plus": "^1.0.0",
        "jsprim": "^1.2.2",
        "sshpk": "^1.7.0"
      },
      "engines": {
        "node": ">=0.8",
        "npm": ">=1.3.7"
      }
    },
    "node_modules/http2-wrapper": {
      "version": "1.0.3",
      "resolved": "https://registry.npmjs.org/http2-wrapper/-/http2-wrapper-1.0.3.tgz",
      "integrity": "sha512-V+23sDMr12Wnz7iTcDeJr3O6AIxlnvT/bmaAAAP/Xda35C90p9599p0F1eHR/N1KILWSoWVAiOMFjBBXaXSMxg==",
      "dev": true,
      "dependencies": {
        "quick-lru": "^5.1.1",
        "resolve-alpn": "^1.0.0"
      },
      "engines": {
        "node": ">=10.19.0"
      }
    },
    "node_modules/https-proxy-agent": {
      "version": "5.0.0",
      "resolved": "https://registry.npmjs.org/https-proxy-agent/-/https-proxy-agent-5.0.0.tgz",
      "integrity": "sha512-EkYm5BcKUGiduxzSt3Eppko+PiNWNEpa4ySk9vTC6wDsQJW9rHSa+UhGNJoRYp7bz6Ht1eaRIa6QaJqO5rCFbA==",
      "dependencies": {
        "agent-base": "6",
        "debug": "4"
      },
      "engines": {
        "node": ">= 6"
      }
    },
    "node_modules/humanize-ms": {
      "version": "1.2.1",
      "resolved": "https://registry.npmjs.org/humanize-ms/-/humanize-ms-1.2.1.tgz",
      "integrity": "sha1-xG4xWaKT9riW2ikxbYtv6Lt5u+0=",
      "dev": true,
      "dependencies": {
        "ms": "^2.0.0"
      }
    },
    "node_modules/iconv-lite": {
      "version": "0.6.3",
      "resolved": "https://registry.npmjs.org/iconv-lite/-/iconv-lite-0.6.3.tgz",
      "integrity": "sha512-4fCk79wshMdzMp2rH06qWrJE4iolqLhCUH+OiuIgU++RB0+94NlDL81atO7GX55uUKueo0txHNtvEyI6D7WdMw==",
      "optional": true,
      "dependencies": {
        "safer-buffer": ">= 2.1.2 < 3.0.0"
      },
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/ieee754": {
      "version": "1.2.1",
      "resolved": "https://registry.npmjs.org/ieee754/-/ieee754-1.2.1.tgz",
      "integrity": "sha512-dcyqhDvX1C46lXZcVqCpK+FtMRQVdIMN6/Df5js2zouUsqG7I6sFxitIC+7KYK29KdXOLHdu9zL4sFnoVQnqaA==",
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/feross"
        },
        {
          "type": "patreon",
          "url": "https://www.patreon.com/feross"
        },
        {
          "type": "consulting",
          "url": "https://feross.org/support"
        }
      ]
    },
    "node_modules/imurmurhash": {
      "version": "0.1.4",
      "resolved": "https://registry.npmjs.org/imurmurhash/-/imurmurhash-0.1.4.tgz",
      "integrity": "sha1-khi5srkoojixPcT7a21XbyMUU+o=",
      "dev": true,
      "engines": {
        "node": ">=0.8.19"
      }
    },
    "node_modules/indent-string": {
      "version": "4.0.0",
      "resolved": "https://registry.npmjs.org/indent-string/-/indent-string-4.0.0.tgz",
      "integrity": "sha512-EdDDZu4A2OyIK7Lr/2zG+w5jmbuk1DVBnEwREQvBzspBJkCEbRa8GxU1lghYcaGJCnRWibjDXlq779X1/y5xwg==",
      "dev": true,
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/infer-owner": {
      "version": "1.0.4",
      "resolved": "https://registry.npmjs.org/infer-owner/-/infer-owner-1.0.4.tgz",
      "integrity": "sha512-IClj+Xz94+d7irH5qRyfJonOdfTzuDaifE6ZPWfx0N0+/ATZCbuTPq2prFl526urkQd90WyUKIh1DfBQ2hMz9A==",
      "dev": true
    },
    "node_modules/inflight": {
      "version": "1.0.6",
      "resolved": "https://registry.npmjs.org/inflight/-/inflight-1.0.6.tgz",
      "integrity": "sha1-Sb1jMdfQLQwJvJEKEHW6gWW1bfk=",
      "dependencies": {
        "once": "^1.3.0",
        "wrappy": "1"
      }
    },
    "node_modules/inherits": {
      "version": "2.0.4",
      "resolved": "https://registry.npmjs.org/inherits/-/inherits-2.0.4.tgz",
      "integrity": "sha512-k/vGaX4/Yla3WzyMCvTQOXYeIHvqOKtnqBduzTHpzpQZzAskKMhZ2K+EnBiSM9zGSoIFeMpXKxa4dYeZIQqewQ=="
    },
    "node_modules/ini": {
      "version": "1.3.8",
      "resolved": "https://registry.npmjs.org/ini/-/ini-1.3.8.tgz",
      "integrity": "sha512-JV/yugV2uzW5iMRSiZAyDtQd+nxtUnjeLt0acNdw98kKLrvuRVyB80tsREOE7yvGVgalhZ6RNXCmEHkUKBKxew==",
      "dev": true
    },
    "node_modules/inquirer": {
      "version": "8.2.0",
      "resolved": "https://registry.npmjs.org/inquirer/-/inquirer-8.2.0.tgz",
      "integrity": "sha512-0crLweprevJ02tTuA6ThpoAERAGyVILC4sS74uib58Xf/zSr1/ZWtmm7D5CI+bSQEaA04f0K7idaHpQbSWgiVQ==",
      "dev": true,
      "dependencies": {
        "ansi-escapes": "^4.2.1",
        "chalk": "^4.1.1",
        "cli-cursor": "^3.1.0",
        "cli-width": "^3.0.0",
        "external-editor": "^3.0.3",
        "figures": "^3.0.0",
        "lodash": "^4.17.21",
        "mute-stream": "0.0.8",
        "ora": "^5.4.1",
        "run-async": "^2.4.0",
        "rxjs": "^7.2.0",
        "string-width": "^4.1.0",
        "strip-ansi": "^6.0.0",
        "through": "^2.3.6"
      },
      "engines": {
        "node": ">=8.0.0"
      }
    },
    "node_modules/ip": {
      "version": "1.1.5",
      "resolved": "https://registry.npmjs.org/ip/-/ip-1.1.5.tgz",
      "integrity": "sha1-vd7XARQpCCjAoDnnLvJfWq7ENUo=",
      "dev": true
    },
    "node_modules/is-arrayish": {
      "version": "0.2.1",
      "resolved": "https://registry.npmjs.org/is-arrayish/-/is-arrayish-0.2.1.tgz",
      "integrity": "sha1-d8mYQFJ6qOyxqLppe4BkWnqSap0=",
      "dev": true
    },
    "node_modules/is-core-module": {
      "version": "2.8.1",
      "resolved": "https://registry.npmjs.org/is-core-module/-/is-core-module-2.8.1.tgz",
      "integrity": "sha512-SdNCUs284hr40hFTFP6l0IfZ/RSrMXF3qgoRHd3/79unUTvrFO/JoXwkGm+5J/Oe3E/b5GsnG330uUNgRpu1PA==",
      "dev": true,
      "dependencies": {
        "has": "^1.0.3"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-docker": {
      "version": "2.2.1",
      "resolved": "https://registry.npmjs.org/is-docker/-/is-docker-2.2.1.tgz",
      "integrity": "sha512-F+i2BKsFrH66iaUFc0woD8sLy8getkwTwtOBjvs56Cx4CgJDeKQeqfz8wAYiSb8JOprWhHH5p77PbmYCvvUuXQ==",
      "dev": true,
      "bin": {
        "is-docker": "cli.js"
      },
      "engines": {
        "node": ">=8"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/is-extglob": {
      "version": "2.1.1",
      "resolved": "https://registry.npmjs.org/is-extglob/-/is-extglob-2.1.1.tgz",
      "integrity": "sha1-qIwCU1eR8C7TfHahueqXc8gz+MI=",
      "dev": true,
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/is-finite": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/is-finite/-/is-finite-1.1.0.tgz",
      "integrity": "sha512-cdyMtqX/BOqqNBBiKlIVkytNHm49MtMlYyn1zxzvJKWmFMlGzm+ry5BBfYyeY9YmNKbRSo/o7OX9w9ale0wg3w==",
      "dev": true,
      "engines": {
        "node": ">=0.10.0"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/is-fullwidth-code-point": {
      "version": "3.0.0",
      "resolved": "https://registry.npmjs.org/is-fullwidth-code-point/-/is-fullwidth-code-point-3.0.0.tgz",
      "integrity": "sha512-zymm5+u+sCsSWyD9qNaejV3DFvhCKclKdizYaJUuHA83RLjb7nSuGnddCHGv0hk+KY7BMAlsWeK4Ueg6EV6XQg==",
      "dev": true,
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/is-glob": {
      "version": "4.0.3",
      "resolved": "https://registry.npmjs.org/is-glob/-/is-glob-4.0.3.tgz",
      "integrity": "sha512-xelSayHH36ZgE7ZWhli7pW34hNbNl8Ojv5KVmkJD4hBdD3th8Tfk9vYasLM+mXWOZhFkgZfxhLSnrwRr4elSSg==",
      "dev": true,
      "dependencies": {
        "is-extglob": "^2.1.1"
      },
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/is-interactive": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/is-interactive/-/is-interactive-1.0.0.tgz",
      "integrity": "sha512-2HvIEKRoqS62guEC+qBjpvRubdX910WCMuJTZ+I9yvqKU2/12eSL549HMwtabb4oupdj2sMP50k+XJfB/8JE6w==",
      "dev": true,
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/is-lambda": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/is-lambda/-/is-lambda-1.0.1.tgz",
      "integrity": "sha1-PZh3iZ5qU+/AFgUEzeFfgubwYdU=",
      "dev": true
    },
    "node_modules/is-number": {
      "version": "7.0.0",
      "resolved": "https://registry.npmjs.org/is-number/-/is-number-7.0.0.tgz",
      "integrity": "sha512-41Cifkg6e8TylSpdtTpeLVMqvSBEVzTttHvERD741+pnZ8ANv0004MRL43QKPDlK9cGvNp6NZWZUBlbGXYxxng==",
      "dev": true,
      "engines": {
        "node": ">=0.12.0"
      }
    },
    "node_modules/is-stream": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/is-stream/-/is-stream-1.1.0.tgz",
      "integrity": "sha1-EtSj3U5o4Lec6428hBc66A2RykQ=",
      "dev": true,
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/is-typedarray": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/is-typedarray/-/is-typedarray-1.0.0.tgz",
      "integrity": "sha1-5HnICFjfDBsR3dppQPlgEfzaSpo=",
      "dev": true
    },
    "node_modules/is-unicode-supported": {
      "version": "0.1.0",
      "resolved": "https://registry.npmjs.org/is-unicode-supported/-/is-unicode-supported-0.1.0.tgz",
      "integrity": "sha512-knxG2q4UC3u8stRGyAVJCOdxFmv5DZiRcdlIaAQXAbSfJya+OhopNotLQrstBhququ4ZpuKbDc/8S6mgXgPFPw==",
      "dev": true,
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/is-utf8": {
      "version": "0.2.1",
      "resolved": "https://registry.npmjs.org/is-utf8/-/is-utf8-0.2.1.tgz",
      "integrity": "sha1-Sw2hRCEE0bM2NA6AeX6GXPOffXI=",
      "dev": true
    },
    "node_modules/is-windows": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/is-windows/-/is-windows-1.0.2.tgz",
      "integrity": "sha512-eXK1UInq2bPmjyX6e3VHIzMLobc4J94i4AWn+Hpq3OU5KkrRC96OAcR3PRJ/pGu6m8TRnBHP9dkXQVsT/COVIA==",
      "dev": true,
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/is-wsl": {
      "version": "2.2.0",
      "resolved": "https://registry.npmjs.org/is-wsl/-/is-wsl-2.2.0.tgz",
      "integrity": "sha512-fKzAra0rGJUUBwGBgNkHZuToZcn+TtXHpeCgmkMJMMYx1sQDYaCSyjJBSCa2nH1DGm7s3n1oBnohoVTBaN7Lww==",
      "dev": true,
      "dependencies": {
        "is-docker": "^2.0.0"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/isarray": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/isarray/-/isarray-1.0.0.tgz",
      "integrity": "sha1-u5NdSFgsuhaMBoNJV6VKPgcSTxE=",
      "dev": true
    },
    "node_modules/isbinaryfile": {
      "version": "3.0.3",
      "resolved": "https://registry.npmjs.org/isbinaryfile/-/isbinaryfile-3.0.3.tgz",
      "integrity": "sha512-8cJBL5tTd2OS0dM4jz07wQd5g0dCCqIhUxPIGtZfa5L6hWlvV5MHTITy/DBAsF+Oe2LS1X3krBUhNwaGUWpWxw==",
      "dev": true,
      "dependencies": {
        "buffer-alloc": "^1.2.0"
      },
      "engines": {
        "node": ">=0.6.0"
      }
    },
    "node_modules/isexe": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/isexe/-/isexe-2.0.0.tgz",
      "integrity": "sha1-6PvzdNxVb/iUehDcsFctYz8s+hA=",
      "dev": true
    },
    "node_modules/isstream": {
      "version": "0.1.2",
      "resolved": "https://registry.npmjs.org/isstream/-/isstream-0.1.2.tgz",
      "integrity": "sha1-R+Y/evVa+m+S4VAOaQ64uFKcCZo=",
      "dev": true
    },
    "node_modules/jsbn": {
      "version": "0.1.1",
      "resolved": "https://registry.npmjs.org/jsbn/-/jsbn-0.1.1.tgz",
      "integrity": "sha1-peZUwuWi3rXyAdls77yoDA7y9RM=",
      "dev": true
    },
    "node_modules/json-buffer": {
      "version": "3.0.0",
      "resolved": "https://registry.npmjs.org/json-buffer/-/json-buffer-3.0.0.tgz",
      "integrity": "sha1-Wx85evx11ne96Lz8Dkfh+aPZqJg=",
      "dev": true
    },
    "node_modules/json-schema": {
      "version": "0.4.0",
      "resolved": "https://registry.npmjs.org/json-schema/-/json-schema-0.4.0.tgz",
      "integrity": "sha512-es94M3nTIfsEPisRafak+HDLfHXnKBhV3vU5eqPcS3flIWqcxJWgXHXiey3YrpaNsanY5ei1VoYEbOzijuq9BA==",
      "dev": true
    },
    "node_modules/json-schema-traverse": {
      "version": "0.4.1",
      "resolved": "https://registry.npmjs.org/json-schema-traverse/-/json-schema-traverse-0.4.1.tgz",
      "integrity": "sha512-xbbCH5dCYU5T8LcEhhuh7HJ88HXuW3qsI3Y0zOZFKfZEHcpWiHU/Jxzk629Brsab/mMiHQti9wMP+845RPe3Vg==",
      "dev": true
    },
    "node_modules/json-stringify-safe": {
      "version": "5.0.1",
      "resolved": "https://registry.npmjs.org/json-stringify-safe/-/json-stringify-safe-5.0.1.tgz",
      "integrity": "sha1-Epai1Y/UXxmg9s4B1lcB4sc1tus=",
      "dev": true
    },
    "node_modules/jsonfile": {
      "version": "4.0.0",
      "resolved": "https://registry.npmjs.org/jsonfile/-/jsonfile-4.0.0.tgz",
      "integrity": "sha1-h3Gq4HmbZAdrdmQPygWPnBDjPss=",
      "dev": true,
      "optionalDependencies": {
        "graceful-fs": "^4.1.6"
      }
    },
    "node_modules/jsprim": {
      "version": "1.4.2",
      "resolved": "https://registry.npmjs.org/jsprim/-/jsprim-1.4.2.tgz",
      "integrity": "sha512-P2bSOMAc/ciLz6DzgjVlGJP9+BrJWu5UDGK70C2iweC5QBIeFf0ZXRvGjEj2uYgrY2MkAAhsSWHDWlFtEroZWw==",
      "dev": true,
      "dependencies": {
        "assert-plus": "1.0.0",
        "extsprintf": "1.3.0",
        "json-schema": "0.4.0",
        "verror": "1.10.0"
      },
      "engines": {
        "node": ">=0.6.0"
      }
    },
    "node_modules/junk": {
      "version": "3.1.0",
      "resolved": "https://registry.npmjs.org/junk/-/junk-3.1.0.tgz",
      "integrity": "sha512-pBxcB3LFc8QVgdggvZWyeys+hnrNWg4OcZIU/1X59k5jQdLBlCsYGRQaz234SqoRLTCgMH00fY0xRJH+F9METQ==",
      "dev": true,
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/keyv": {
      "version": "3.1.0",
      "resolved": "https://registry.npmjs.org/keyv/-/keyv-3.1.0.tgz",
      "integrity": "sha512-9ykJ/46SN/9KPM/sichzQ7OvXyGDYKGTaDlKMGCAlg2UK8KRy4jb0d8sFc+0Tt0YYnThq8X2RZgCg74RPxgcVA==",
      "dev": true,
      "dependencies": {
        "json-buffer": "3.0.0"
      }
    },
    "node_modules/load-json-file": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/load-json-file/-/load-json-file-2.0.0.tgz",
      "integrity": "sha1-eUfkIUmvgNaWy/eXvKq8/h/inKg=",
      "dev": true,
      "dependencies": {
        "graceful-fs": "^4.1.2",
        "parse-json": "^2.2.0",
        "pify": "^2.0.0",
        "strip-bom": "^3.0.0"
      },
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/load-json-file/node_modules/pify": {
      "version": "2.3.0",
      "resolved": "https://registry.npmjs.org/pify/-/pify-2.3.0.tgz",
      "integrity": "sha1-7RQaasBDqEnqWISY59yosVMw6Qw=",
      "dev": true,
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/locate-path": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/locate-path/-/locate-path-2.0.0.tgz",
      "integrity": "sha1-K1aLJl7slExtnA3pw9u7ygNUzY4=",
      "dev": true,
      "dependencies": {
        "p-locate": "^2.0.0",
        "path-exists": "^3.0.0"
      },
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/lodash": {
      "version": "4.17.21",
      "resolved": "https://registry.npmjs.org/lodash/-/lodash-4.17.21.tgz",
      "integrity": "sha512-v2kDEe57lecTulaDIuNTPy3Ry4gLGJ6Z1O3vE1krgXZNrsQ+LFTGHVxVjcXPs17LhbZVGedAJv8XZ1tvj5FvSg==",
      "dev": true
    },
    "node_modules/lodash._reinterpolate": {
      "version": "3.0.0",
      "resolved": "https://registry.npmjs.org/lodash._reinterpolate/-/lodash._reinterpolate-3.0.0.tgz",
      "integrity": "sha1-DM8tiRZq8Ds2Y8eWU4t1rG4RTZ0=",
      "dev": true,
      "optional": true
    },
    "node_modules/lodash.get": {
      "version": "4.4.2",
      "resolved": "https://registry.npmjs.org/lodash.get/-/lodash.get-4.4.2.tgz",
      "integrity": "sha1-LRd/ZS+jHpObRDjVNBSZ36OCXpk=",
      "dev": true
    },
    "node_modules/lodash.template": {
      "version": "4.5.0",
      "resolved": "https://registry.npmjs.org/lodash.template/-/lodash.template-4.5.0.tgz",
      "integrity": "sha512-84vYFxIkmidUiFxidA/KjjH9pAycqW+h980j7Fuz5qxRtO9pgB7MDFTdys1N7A5mcucRiDyEq4fusljItR1T/A==",
      "dev": true,
      "optional": true,
      "dependencies": {
        "lodash._reinterpolate": "^3.0.0",
        "lodash.templatesettings": "^4.0.0"
      }
    },
    "node_modules/lodash.templatesettings": {
      "version": "4.2.0",
      "resolved": "https://registry.npmjs.org/lodash.templatesettings/-/lodash.templatesettings-4.2.0.tgz",
      "integrity": "sha512-stgLz+i3Aa9mZgnjr/O+v9ruKZsPsndy7qPZOchbqk2cnTU1ZaldKK+v7m54WoKIyxiuMZTKT2H81F8BeAc3ZQ==",
      "dev": true,
      "optional": true,
      "dependencies": {
        "lodash._reinterpolate": "^3.0.0"
      }
    },
    "node_modules/log-symbols": {
      "version": "4.1.0",
      "resolved": "https://registry.npmjs.org/log-symbols/-/log-symbols-4.1.0.tgz",
      "integrity": "sha512-8XPvpAA8uyhfteu8pIvQxpJZ7SYYdpUivZpGy6sFsBuKRY/7rQGavedeB8aK+Zkyq6upMFVL/9AW6vOYzfRyLg==",
      "dev": true,
      "dependencies": {
        "chalk": "^4.1.0",
        "is-unicode-supported": "^0.1.0"
      },
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/loud-rejection": {
      "version": "1.6.0",
      "resolved": "https://registry.npmjs.org/loud-rejection/-/loud-rejection-1.6.0.tgz",
      "integrity": "sha1-W0b4AUft7leIcPCG0Eghz5mOVR8=",
      "dev": true,
      "dependencies": {
        "currently-unhandled": "^0.4.1",
        "signal-exit": "^3.0.0"
      },
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/lowercase-keys": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/lowercase-keys/-/lowercase-keys-1.0.1.tgz",
      "integrity": "sha512-G2Lj61tXDnVFFOi8VZds+SoQjtQC3dgokKdDG2mTm1tx4m50NUHBOZSBwQQHyy0V12A0JTG4icfZQH+xPyh8VA==",
      "dev": true,
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/lru-cache": {
      "version": "6.0.0",
      "resolved": "https://registry.npmjs.org/lru-cache/-/lru-cache-6.0.0.tgz",
      "integrity": "sha512-Jo6dJ04CmSjuznwJSS3pUeWmd/H0ffTlkXXgwZi+eq1UCmqQwCh+eLsYOYCwY991i2Fah4h1BEMCx4qThGbsiA==",
      "dev": true,
      "dependencies": {
        "yallist": "^4.0.0"
      },
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/lzma-native": {
      "version": "8.0.6",
      "resolved": "https://registry.npmjs.org/lzma-native/-/lzma-native-8.0.6.tgz",
      "integrity": "sha512-09xfg67mkL2Lz20PrrDeNYZxzeW7ADtpYFbwSQh9U8+76RIzx5QsJBMy8qikv3hbUPfpy6hqwxt6FcGK81g9AA==",
      "dev": true,
      "hasInstallScript": true,
      "dependencies": {
        "node-addon-api": "^3.1.0",
        "node-gyp-build": "^4.2.1",
        "readable-stream": "^3.6.0"
      },
      "bin": {
        "lzmajs": "bin/lzmajs"
      },
      "engines": {
        "node": ">=10.0.0"
      }
    },
    "node_modules/lzma-native/node_modules/readable-stream": {
      "version": "3.6.0",
      "resolved": "https://registry.npmjs.org/readable-stream/-/readable-stream-3.6.0.tgz",
      "integrity": "sha512-BViHy7LKeTz4oNnkcLJ+lVSL6vpiFeX6/d3oSH8zCW7UxP2onchk+vTGB143xuFjHS3deTgkKoXXymXqymiIdA==",
      "dev": true,
      "dependencies": {
        "inherits": "^2.0.3",
        "string_decoder": "^1.1.1",
        "util-deprecate": "^1.0.1"
      },
      "engines": {
        "node": ">= 6"
      }
    },
    "node_modules/make-fetch-happen": {
      "version": "9.1.0",
      "resolved": "https://registry.npmjs.org/make-fetch-happen/-/make-fetch-happen-9.1.0.tgz",
      "integrity": "sha512-+zopwDy7DNknmwPQplem5lAZX/eCOzSvSNNcSKm5eVwTkOBzoktEfXsa9L23J/GIRhxRsaxzkPEhrJEpE2F4Gg==",
      "dev": true,
      "dependencies": {
        "agentkeepalive": "^4.1.3",
        "cacache": "^15.2.0",
        "http-cache-semantics": "^4.1.0",
        "http-proxy-agent": "^4.0.1",
        "https-proxy-agent": "^5.0.0",
        "is-lambda": "^1.0.1",
        "lru-cache": "^6.0.0",
        "minipass": "^3.1.3",
        "minipass-collect": "^1.0.2",
        "minipass-fetch": "^1.3.2",
        "minipass-flush": "^1.0.5",
        "minipass-pipeline": "^1.2.4",
        "negotiator": "^0.6.2",
        "promise-retry": "^2.0.1",
        "socks-proxy-agent": "^6.0.0",
        "ssri": "^8.0.0"
      },
      "engines": {
        "node": ">= 10"
      }
    },
    "node_modules/map-age-cleaner": {
      "version": "0.1.3",
      "resolved": "https://registry.npmjs.org/map-age-cleaner/-/map-age-cleaner-0.1.3.tgz",
      "integrity": "sha512-bJzx6nMoP6PDLPBFmg7+xRKeFZvFboMrGlxmNj9ClvX53KrmvM5bXFXEWjbz4cz1AFn+jWJ9z/DJSz7hrs0w3w==",
      "dev": true,
      "dependencies": {
        "p-defer": "^1.0.0"
      },
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/map-obj": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/map-obj/-/map-obj-1.0.1.tgz",
      "integrity": "sha1-2TPOuSBdgr3PSIb2dCvcK03qFG0=",
      "dev": true,
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/matcher": {
      "version": "3.0.0",
      "resolved": "https://registry.npmjs.org/matcher/-/matcher-3.0.0.tgz",
      "integrity": "sha512-OkeDaAZ/bQCxeFAozM55PKcKU0yJMPGifLwV4Qgjitu+5MoAfSQN4lsLJeXZ1b8w0x+/Emda6MZgXS1jvsapng==",
      "dev": true,
      "optional": true,
      "dependencies": {
        "escape-string-regexp": "^4.0.0"
      },
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/mem": {
      "version": "4.3.0",
      "resolved": "https://registry.npmjs.org/mem/-/mem-4.3.0.tgz",
      "integrity": "sha512-qX2bG48pTqYRVmDB37rn/6PT7LcR8T7oAX3bf99u1Tt1nzxYfxkgqDwUwolPlXweM0XzBOBFzSx4kfp7KP1s/w==",
      "dev": true,
      "dependencies": {
        "map-age-cleaner": "^0.1.1",
        "mimic-fn": "^2.0.0",
        "p-is-promise": "^2.0.0"
      },
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/meow": {
      "version": "3.7.0",
      "resolved": "https://registry.npmjs.org/meow/-/meow-3.7.0.tgz",
      "integrity": "sha1-cstmi0JSKCkKu/qFaJJYcwioAfs=",
      "dev": true,
      "dependencies": {
        "camelcase-keys": "^2.0.0",
        "decamelize": "^1.1.2",
        "loud-rejection": "^1.0.0",
        "map-obj": "^1.0.1",
        "minimist": "^1.1.3",
        "normalize-package-data": "^2.3.4",
        "object-assign": "^4.0.1",
        "read-pkg-up": "^1.0.1",
        "redent": "^1.0.0",
        "trim-newlines": "^1.0.0"
      },
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/meow/node_modules/find-up": {
      "version": "1.1.2",
      "resolved": "https://registry.npmjs.org/find-up/-/find-up-1.1.2.tgz",
      "integrity": "sha1-ay6YIrGizgpgq2TWEOzK1TyyTQ8=",
      "dev": true,
      "dependencies": {
        "path-exists": "^2.0.0",
        "pinkie-promise": "^2.0.0"
      },
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/meow/node_modules/load-json-file": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/load-json-file/-/load-json-file-1.1.0.tgz",
      "integrity": "sha1-lWkFcI1YtLq0wiYbBPWfMcmTdMA=",
      "dev": true,
      "dependencies": {
        "graceful-fs": "^4.1.2",
        "parse-json": "^2.2.0",
        "pify": "^2.0.0",
        "pinkie-promise": "^2.0.0",
        "strip-bom": "^2.0.0"
      },
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/meow/node_modules/path-exists": {
      "version": "2.1.0",
      "resolved": "https://registry.npmjs.org/path-exists/-/path-exists-2.1.0.tgz",
      "integrity": "sha1-D+tsZPD8UY2adU3V77YscCJ2H0s=",
      "dev": true,
      "dependencies": {
        "pinkie-promise": "^2.0.0"
      },
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/meow/node_modules/path-type": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/path-type/-/path-type-1.1.0.tgz",
      "integrity": "sha1-WcRPfuSR2nBNpBXaWkBwuk+P5EE=",
      "dev": true,
      "dependencies": {
        "graceful-fs": "^4.1.2",
        "pify": "^2.0.0",
        "pinkie-promise": "^2.0.0"
      },
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/meow/node_modules/pify": {
      "version": "2.3.0",
      "resolved": "https://registry.npmjs.org/pify/-/pify-2.3.0.tgz",
      "integrity": "sha1-7RQaasBDqEnqWISY59yosVMw6Qw=",
      "dev": true,
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/meow/node_modules/read-pkg": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/read-pkg/-/read-pkg-1.1.0.tgz",
      "integrity": "sha1-9f+qXs0pyzHAR0vKfXVra7KePyg=",
      "dev": true,
      "dependencies": {
        "load-json-file": "^1.0.0",
        "normalize-package-data": "^2.3.2",
        "path-type": "^1.0.0"
      },
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/meow/node_modules/read-pkg-up": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/read-pkg-up/-/read-pkg-up-1.0.1.tgz",
      "integrity": "sha1-nWPBMnbAZZGNV/ACpX9AobZD+wI=",
      "dev": true,
      "dependencies": {
        "find-up": "^1.0.0",
        "read-pkg": "^1.0.0"
      },
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/meow/node_modules/strip-bom": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/strip-bom/-/strip-bom-2.0.0.tgz",
      "integrity": "sha1-YhmoVhZSBJHzV4i9vxRHqZx+aw4=",
      "dev": true,
      "dependencies": {
        "is-utf8": "^0.2.0"
      },
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/merge2": {
      "version": "1.4.1",
      "resolved": "https://registry.npmjs.org/merge2/-/merge2-1.4.1.tgz",
      "integrity": "sha512-8q7VEgMJW4J8tcfVPy8g09NcQwZdbwFEqhe/WZkoIzjn/3TGDwtOCYtXGxA3O8tPzpczCCDgv+P2P5y00ZJOOg==",
      "dev": true,
      "engines": {
        "node": ">= 8"
      }
    },
    "node_modules/micromatch": {
      "version": "4.0.4",
      "resolved": "https://registry.npmjs.org/micromatch/-/micromatch-4.0.4.tgz",
      "integrity": "sha512-pRmzw/XUcwXGpD9aI9q/0XOwLNygjETJ8y0ao0wdqprrzDa4YnxLcz7fQRZr8voh8V10kGhABbNcHVk5wHgWwg==",
      "dev": true,
      "dependencies": {
        "braces": "^3.0.1",
        "picomatch": "^2.2.3"
      },
      "engines": {
        "node": ">=8.6"
      }
    },
    "node_modules/mime-db": {
      "version": "1.51.0",
      "resolved": "https://registry.npmjs.org/mime-db/-/mime-db-1.51.0.tgz",
      "integrity": "sha512-5y8A56jg7XVQx2mbv1lu49NR4dokRnhZYTtL+KGfaa27uq4pSTXkwQkFJl4pkRMyNFz/EtYDSkiiEHx3F7UN6g==",
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/mime-types": {
      "version": "2.1.34",
      "resolved": "https://registry.npmjs.org/mime-types/-/mime-types-2.1.34.tgz",
      "integrity": "sha512-6cP692WwGIs9XXdOO4++N+7qjqv0rqxxVvJ3VHPh/Sc9mVZcQP+ZGhkKiTvWMQRr2tbHkJP/Yn7Y0npb3ZBs4A==",
      "dependencies": {
        "mime-db": "1.51.0"
      },
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/mimic-fn": {
      "version": "2.1.0",
      "resolved": "https://registry.npmjs.org/mimic-fn/-/mimic-fn-2.1.0.tgz",
      "integrity": "sha512-OqbOk5oEQeAZ8WXWydlu9HJjz9WVdEIvamMCcXmuqUYjTknH/sqsWvhQ3vgwKFRR1HpjvNBKQ37nbJgYzGqGcg==",
      "dev": true,
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/mimic-response": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/mimic-response/-/mimic-response-1.0.1.tgz",
      "integrity": "sha512-j5EctnkH7amfV/q5Hgmoal1g2QHFJRraOtmx0JpIqkxhBhI/lJSl1nMpQ45hVarwNETOoWEimndZ4QK0RHxuxQ==",
      "dev": true,
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/minimatch": {
      "version": "3.0.4",
      "resolved": "https://registry.npmjs.org/minimatch/-/minimatch-3.0.4.tgz",
      "integrity": "sha512-yJHVQEhyqPLUTgt9B83PXu6W3rx4MvvHvSUvToogpwoGDOUQ+yDrR0HRot+yOCdCO7u4hX3pWft6kWBBcqh0UA==",
      "dependencies": {
        "brace-expansion": "^1.1.7"
      },
      "engines": {
        "node": "*"
      }
    },
    "node_modules/minimist": {
      "version": "1.2.5",
      "resolved": "https://registry.npmjs.org/minimist/-/minimist-1.2.5.tgz",
      "integrity": "sha512-FM9nNUYrRBAELZQT3xeZQ7fmMOBg6nWNmJKTcgsJeaLstP/UODVpGsr5OhXhhXg6f+qtJ8uiZ+PUxkDWcgIXLw==",
      "dev": true
    },
    "node_modules/minipass": {
      "version": "3.1.6",
      "resolved": "https://registry.npmjs.org/minipass/-/minipass-3.1.6.tgz",
      "integrity": "sha512-rty5kpw9/z8SX9dmxblFA6edItUmwJgMeYDZRrwlIVN27i8gysGbznJwUggw2V/FVqFSDdWy040ZPS811DYAqQ==",
      "dev": true,
      "dependencies": {
        "yallist": "^4.0.0"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/minipass-collect": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/minipass-collect/-/minipass-collect-1.0.2.tgz",
      "integrity": "sha512-6T6lH0H8OG9kITm/Jm6tdooIbogG9e0tLgpY6mphXSm/A9u8Nq1ryBG+Qspiub9LjWlBPsPS3tWQ/Botq4FdxA==",
      "dev": true,
      "dependencies": {
        "minipass": "^3.0.0"
      },
      "engines": {
        "node": ">= 8"
      }
    },
    "node_modules/minipass-fetch": {
      "version": "1.4.1",
      "resolved": "https://registry.npmjs.org/minipass-fetch/-/minipass-fetch-1.4.1.tgz",
      "integrity": "sha512-CGH1eblLq26Y15+Azk7ey4xh0J/XfJfrCox5LDJiKqI2Q2iwOLOKrlmIaODiSQS8d18jalF6y2K2ePUm0CmShw==",
      "dev": true,
      "dependencies": {
        "minipass": "^3.1.0",
        "minipass-sized": "^1.0.3",
        "minizlib": "^2.0.0"
      },
      "engines": {
        "node": ">=8"
      },
      "optionalDependencies": {
        "encoding": "^0.1.12"
      }
    },
    "node_modules/minipass-flush": {
      "version": "1.0.5",
      "resolved": "https://registry.npmjs.org/minipass-flush/-/minipass-flush-1.0.5.tgz",
      "integrity": "sha512-JmQSYYpPUqX5Jyn1mXaRwOda1uQ8HP5KAT/oDSLCzt1BYRhQU0/hDtsB1ufZfEEzMZ9aAVmsBw8+FWsIXlClWw==",
      "dev": true,
      "dependencies": {
        "minipass": "^3.0.0"
      },
      "engines": {
        "node": ">= 8"
      }
    },
    "node_modules/minipass-pipeline": {
      "version": "1.2.4",
      "resolved": "https://registry.npmjs.org/minipass-pipeline/-/minipass-pipeline-1.2.4.tgz",
      "integrity": "sha512-xuIq7cIOt09RPRJ19gdi4b+RiNvDFYe5JH+ggNvBqGqpQXcru3PcRmOZuHBKWK1Txf9+cQ+HMVN4d6z46LZP7A==",
      "dev": true,
      "dependencies": {
        "minipass": "^3.0.0"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/minipass-sized": {
      "version": "1.0.3",
      "resolved": "https://registry.npmjs.org/minipass-sized/-/minipass-sized-1.0.3.tgz",
      "integrity": "sha512-MbkQQ2CTiBMlA2Dm/5cY+9SWFEN8pzzOXi6rlM5Xxq0Yqbda5ZQy9sU75a673FE9ZK0Zsbr6Y5iP6u9nktfg2g==",
      "dev": true,
      "dependencies": {
        "minipass": "^3.0.0"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/minizlib": {
      "version": "2.1.2",
      "resolved": "https://registry.npmjs.org/minizlib/-/minizlib-2.1.2.tgz",
      "integrity": "sha512-bAxsR8BVfj60DWXHE3u30oHzfl4G7khkSuPW+qvpd7jFRHm7dLxOjUk1EHACJ/hxLY8phGJ0YhYHZo7jil7Qdg==",
      "dev": true,
      "dependencies": {
        "minipass": "^3.0.0",
        "yallist": "^4.0.0"
      },
      "engines": {
        "node": ">= 8"
      }
    },
    "node_modules/mkdirp": {
      "version": "0.5.5",
      "resolved": "https://registry.npmjs.org/mkdirp/-/mkdirp-0.5.5.tgz",
      "integrity": "sha512-NKmAlESf6jMGym1++R0Ra7wvhV+wFW63FaSOFPwRahvea0gMUcGUhVeAg/0BC0wiv9ih5NYPB1Wn1UEI1/L+xQ==",
      "dev": true,
      "dependencies": {
        "minimist": "^1.2.5"
      },
      "bin": {
        "mkdirp": "bin/cmd.js"
      }
    },
    "node_modules/mkdirp-classic": {
      "version": "0.5.3",
      "resolved": "https://registry.npmjs.org/mkdirp-classic/-/mkdirp-classic-0.5.3.tgz",
      "integrity": "sha512-gKLcREMhtuZRwRAfqP3RFW+TK4JqApVBtOIftVgjuABpAtpxhPGaDcfvbhNvD0B8iD1oUr/txX35NjcaY6Ns/A=="
    },
    "node_modules/ms": {
      "version": "2.1.2",
      "resolved": "https://registry.npmjs.org/ms/-/ms-2.1.2.tgz",
      "integrity": "sha512-sGkPx+VjMtmA6MX27oA4FBFELFCZZ4S4XqeGOXCv68tT+jb3vk/RyaKWP0PTKyWtmLSM0b+adUTEvbs1PEaH2w=="
    },
    "node_modules/mute-stream": {
      "version": "0.0.8",
      "resolved": "https://registry.npmjs.org/mute-stream/-/mute-stream-0.0.8.tgz",
      "integrity": "sha512-nnbWWOkoWyUsTjKrhgD0dcz22mdkSnpYqbEjIm2nhwhuxlSkpywJmBo8h0ZqJdkp73mb90SssHkN4rsRaBAfAA==",
      "dev": true
    },
    "node_modules/negotiator": {
      "version": "0.6.3",
      "resolved": "https://registry.npmjs.org/negotiator/-/negotiator-0.6.3.tgz",
      "integrity": "sha512-+EUsqGPLsM+j/zdChZjsnX51g4XrHFOIXwfnCVPGlQk/k5giakcKsuxCObBRu6DSm9opw/O6slWbJdghQM4bBg==",
      "dev": true,
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/nice-try": {
      "version": "1.0.5",
      "resolved": "https://registry.npmjs.org/nice-try/-/nice-try-1.0.5.tgz",
      "integrity": "sha512-1nh45deeb5olNY7eX82BkPO7SSxR5SSYJiPTrTdFUVYwAl8CKMA5N9PjTYkHiRjisVcxcQ1HXdLhx2qxxJzLNQ==",
      "dev": true
    },
    "node_modules/node-abi": {
      "version": "3.5.0",
      "resolved": "https://registry.npmjs.org/node-abi/-/node-abi-3.5.0.tgz",
      "integrity": "sha512-LtHvNIBgOy5mO8mPEUtkCW/YCRWYEKshIvqhe1GHHyXEHEB5mgICyYnAcl4qan3uFeRROErKGzatFHPf6kDxWw==",
      "dev": true,
      "dependencies": {
        "semver": "^7.3.5"
      },
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/node-abi/node_modules/semver": {
      "version": "7.3.5",
      "resolved": "https://registry.npmjs.org/semver/-/semver-7.3.5.tgz",
      "integrity": "sha512-PoeGJYh8HK4BTO/a9Tf6ZG3veo/A7ZVsYrSA6J8ny9nb3B1VrpkuN+z9OE5wfE5p6H4LchYZsegiQgbJD94ZFQ==",
      "dev": true,
      "dependencies": {
        "lru-cache": "^6.0.0"
      },
      "bin": {
        "semver": "bin/semver.js"
      },
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/node-addon-api": {
      "version": "3.2.1",
      "resolved": "https://registry.npmjs.org/node-addon-api/-/node-addon-api-3.2.1.tgz",
      "integrity": "sha512-mmcei9JghVNDYydghQmeDX8KoAm0FAiYyIcUt/N4nhyAipB17pllZQDOJD2fotxABnt4Mdz+dKTO7eftLg4d0A==",
      "dev": true
    },
    "node_modules/node-api-version": {
      "version": "0.1.4",
      "resolved": "https://registry.npmjs.org/node-api-version/-/node-api-version-0.1.4.tgz",
      "integrity": "sha512-KGXihXdUChwJAOHO53bv9/vXcLmdUsZ6jIptbvYvkpKfth+r7jw44JkVxQFA3kX5nQjzjmGu1uAu/xNNLNlI5g==",
      "dev": true,
      "dependencies": {
        "semver": "^7.3.5"
      }
    },
    "node_modules/node-api-version/node_modules/semver": {
      "version": "7.3.5",
      "resolved": "https://registry.npmjs.org/semver/-/semver-7.3.5.tgz",
      "integrity": "sha512-PoeGJYh8HK4BTO/a9Tf6ZG3veo/A7ZVsYrSA6J8ny9nb3B1VrpkuN+z9OE5wfE5p6H4LchYZsegiQgbJD94ZFQ==",
      "dev": true,
      "dependencies": {
        "lru-cache": "^6.0.0"
      },
      "bin": {
        "semver": "bin/semver.js"
      },
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/node-fetch": {
      "version": "2.6.7",
      "resolved": "https://registry.npmjs.org/node-fetch/-/node-fetch-2.6.7.tgz",
      "integrity": "sha512-ZjMPFEfVx5j+y2yF35Kzx5sF7kDzxuDj6ziH4FFbOp87zKDZNx8yExJIb05OGF4Nlt9IHFIMBkRl41VdvcNdbQ==",
      "dependencies": {
        "whatwg-url": "^5.0.0"
      },
      "engines": {
        "node": "4.x || >=6.0.0"
      },
      "peerDependencies": {
        "encoding": "^0.1.0"
      },
      "peerDependenciesMeta": {
        "encoding": {
          "optional": true
        }
      }
    },
    "node_modules/node-gyp": {
      "version": "8.4.1",
      "resolved": "https://registry.npmjs.org/node-gyp/-/node-gyp-8.4.1.tgz",
      "integrity": "sha512-olTJRgUtAb/hOXG0E93wZDs5YiJlgbXxTwQAFHyNlRsXQnYzUaF2aGgujZbw+hR8aF4ZG/rST57bWMWD16jr9w==",
      "dev": true,
      "dependencies": {
        "env-paths": "^2.2.0",
        "glob": "^7.1.4",
        "graceful-fs": "^4.2.6",
        "make-fetch-happen": "^9.1.0",
        "nopt": "^5.0.0",
        "npmlog": "^6.0.0",
        "rimraf": "^3.0.2",
        "semver": "^7.3.5",
        "tar": "^6.1.2",
        "which": "^2.0.2"
      },
      "bin": {
        "node-gyp": "bin/node-gyp.js"
      },
      "engines": {
        "node": ">= 10.12.0"
      }
    },
    "node_modules/node-gyp-build": {
      "version": "4.3.0",
      "resolved": "https://registry.npmjs.org/node-gyp-build/-/node-gyp-build-4.3.0.tgz",
      "integrity": "sha512-iWjXZvmboq0ja1pUGULQBexmxq8CV4xBhX7VDOTbL7ZR4FOowwY/VOtRxBN/yKxmdGoIp4j5ysNT4u3S2pDQ3Q==",
      "dev": true,
      "bin": {
        "node-gyp-build": "bin.js",
        "node-gyp-build-optional": "optional.js",
        "node-gyp-build-test": "build-test.js"
      }
    },
    "node_modules/node-gyp/node_modules/semver": {
      "version": "7.3.5",
      "resolved": "https://registry.npmjs.org/semver/-/semver-7.3.5.tgz",
      "integrity": "sha512-PoeGJYh8HK4BTO/a9Tf6ZG3veo/A7ZVsYrSA6J8ny9nb3B1VrpkuN+z9OE5wfE5p6H4LchYZsegiQgbJD94ZFQ==",
      "dev": true,
      "dependencies": {
        "lru-cache": "^6.0.0"
      },
      "bin": {
        "semver": "bin/semver.js"
      },
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/nopt": {
      "version": "5.0.0",
      "resolved": "https://registry.npmjs.org/nopt/-/nopt-5.0.0.tgz",
      "integrity": "sha512-Tbj67rffqceeLpcRXrT7vKAN8CwfPeIBgM7E6iBkmKLV7bEMwpGgYLGv0jACUsECaa/vuxP0IjEont6umdMgtQ==",
      "dev": true,
      "dependencies": {
        "abbrev": "1"
      },
      "bin": {
        "nopt": "bin/nopt.js"
      },
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/normalize-package-data": {
      "version": "2.5.0",
      "resolved": "https://registry.npmjs.org/normalize-package-data/-/normalize-package-data-2.5.0.tgz",
      "integrity": "sha512-/5CMN3T0R4XTj4DcGaexo+roZSdSFW/0AOOTROrjxzCG1wrWXEsGbRKevjlIL+ZDE4sZlJr5ED4YW0yqmkK+eA==",
      "dev": true,
      "dependencies": {
        "hosted-git-info": "^2.1.4",
        "resolve": "^1.10.0",
        "semver": "2 || 3 || 4 || 5",
        "validate-npm-package-license": "^3.0.1"
      }
    },
    "node_modules/normalize-package-data/node_modules/semver": {
      "version": "5.7.1",
      "resolved": "https://registry.npmjs.org/semver/-/semver-5.7.1.tgz",
      "integrity": "sha512-sauaDf/PZdVgrLTNYHRtpXa1iRiKcaebiKQ1BJdpQlWH2lCvexQdX55snPFyK7QzpudqbCI0qXFfOasHdyNDGQ==",
      "dev": true,
      "bin": {
        "semver": "bin/semver"
      }
    },
    "node_modules/normalize-url": {
      "version": "4.5.1",
      "resolved": "https://registry.npmjs.org/normalize-url/-/normalize-url-4.5.1.tgz",
      "integrity": "sha512-9UZCFRHQdNrfTpGg8+1INIg93B6zE0aXMVFkw1WFwvO4SlZywU6aLg5Of0Ap/PgcbSw4LNxvMWXMeugwMCX0AA==",
      "dev": true,
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/npm-conf": {
      "version": "1.1.3",
      "resolved": "https://registry.npmjs.org/npm-conf/-/npm-conf-1.1.3.tgz",
      "integrity": "sha512-Yic4bZHJOt9RCFbRP3GgpqhScOY4HH3V2P8yBj6CeYq118Qr+BLXqT2JvpJ00mryLESpgOxf5XlFv4ZjXxLScw==",
      "dev": true,
      "optional": true,
      "dependencies": {
        "config-chain": "^1.1.11",
        "pify": "^3.0.0"
      },
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/npm-run-path": {
      "version": "2.0.2",
      "resolved": "https://registry.npmjs.org/npm-run-path/-/npm-run-path-2.0.2.tgz",
      "integrity": "sha1-NakjLfo11wZ7TLLd8jV7GHFTbF8=",
      "dev": true,
      "dependencies": {
        "path-key": "^2.0.0"
      },
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/npm-run-path/node_modules/path-key": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/path-key/-/path-key-2.0.1.tgz",
      "integrity": "sha1-QRyttXTFoUDTpLGRDUDYDMn0C0A=",
      "dev": true,
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/npmlog": {
      "version": "6.0.0",
      "resolved": "https://registry.npmjs.org/npmlog/-/npmlog-6.0.0.tgz",
      "integrity": "sha512-03ppFRGlsyUaQFbGC2C8QWJN/C/K7PsfyD9aQdhVKAQIH4sQBc8WASqFBP7O+Ut4d2oo5LoeoboB3cGdBZSp6Q==",
      "dev": true,
      "dependencies": {
        "are-we-there-yet": "^2.0.0",
        "console-control-strings": "^1.1.0",
        "gauge": "^4.0.0",
        "set-blocking": "^2.0.0"
      },
      "engines": {
        "node": "^12.13.0 || ^14.15.0 || >=16"
      }
    },
    "node_modules/nugget": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/nugget/-/nugget-2.0.1.tgz",
      "integrity": "sha1-IBCVpIfhrTYIGzQy+jytpPjQcbA=",
      "dev": true,
      "dependencies": {
        "debug": "^2.1.3",
        "minimist": "^1.1.0",
        "pretty-bytes": "^1.0.2",
        "progress-stream": "^1.1.0",
        "request": "^2.45.0",
        "single-line-log": "^1.1.2",
        "throttleit": "0.0.2"
      },
      "bin": {
        "nugget": "bin.js"
      }
    },
    "node_modules/nugget/node_modules/debug": {
      "version": "2.6.9",
      "resolved": "https://registry.npmjs.org/debug/-/debug-2.6.9.tgz",
      "integrity": "sha512-bC7ElrdJaJnPbAP+1EotYvqZsb3ecl5wi6Bfi6BJTUcNowp6cvspg0jXznRTKDjm/E7AdgFBVeAPVMNcKGsHMA==",
      "dev": true,
      "dependencies": {
        "ms": "2.0.0"
      }
    },
    "node_modules/nugget/node_modules/ms": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/ms/-/ms-2.0.0.tgz",
      "integrity": "sha1-VgiurfwAvmwpAd9fmGF4jeDVl8g=",
      "dev": true
    },
    "node_modules/number-is-nan": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/number-is-nan/-/number-is-nan-1.0.1.tgz",
      "integrity": "sha1-CXtgK1NCKlIsGvuHkDGDNpQaAR0=",
      "dev": true,
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/oauth-sign": {
      "version": "0.9.0",
      "resolved": "https://registry.npmjs.org/oauth-sign/-/oauth-sign-0.9.0.tgz",
      "integrity": "sha512-fexhUFFPTGV8ybAtSIGbV6gOkSv8UtRbDBnAyLQw4QPKkgNlsH2ByPGtMUqdWkos6YCRmAqViwgZrJc/mRDzZQ==",
      "dev": true,
      "engines": {
        "node": "*"
      }
    },
    "node_modules/object-assign": {
      "version": "4.1.1",
      "resolved": "https://registry.npmjs.org/object-assign/-/object-assign-4.1.1.tgz",
      "integrity": "sha1-IQmtx5ZYh8/AXLvUQsrIv7s2CGM=",
      "dev": true,
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/object-keys": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/object-keys/-/object-keys-1.1.1.tgz",
      "integrity": "sha512-NuAESUOUMrlIXOfHKzD6bpPu3tYt3xvjNdRIQ+FeT0lNb4K8WR70CaDxhuNguS2XG+GjkyMwOzsN5ZktImfhLA==",
      "dev": true,
      "optional": true,
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/once": {
      "version": "1.4.0",
      "resolved": "https://registry.npmjs.org/once/-/once-1.4.0.tgz",
      "integrity": "sha1-WDsap3WWHUsROsF9nFC6753Xa9E=",
      "dependencies": {
        "wrappy": "1"
      }
    },
    "node_modules/onetime": {
      "version": "5.1.2",
      "resolved": "https://registry.npmjs.org/onetime/-/onetime-5.1.2.tgz",
      "integrity": "sha512-kbpaSSGJTWdAY5KPVeMOKXSrPtr8C8C7wodJbcsd51jRnmD+GZu8Y0VoU6Dm5Z4vWr0Ig/1NKuWRKf7j5aaYSg==",
      "dev": true,
      "dependencies": {
        "mimic-fn": "^2.1.0"
      },
      "engines": {
        "node": ">=6"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/open": {
      "version": "8.4.0",
      "resolved": "https://registry.npmjs.org/open/-/open-8.4.0.tgz",
      "integrity": "sha512-XgFPPM+B28FtCCgSb9I+s9szOC1vZRSwgWsRUA5ylIxRTgKozqjOCrVOqGsYABPYK5qnfqClxZTFBa8PKt2v6Q==",
      "dev": true,
      "dependencies": {
        "define-lazy-prop": "^2.0.0",
        "is-docker": "^2.1.1",
        "is-wsl": "^2.2.0"
      },
      "engines": {
        "node": ">=12"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/ora": {
      "version": "5.4.1",
      "resolved": "https://registry.npmjs.org/ora/-/ora-5.4.1.tgz",
      "integrity": "sha512-5b6Y85tPxZZ7QytO+BQzysW31HJku27cRIlkbAXaNx+BdcVi+LlRFmVXzeF6a7JCwJpyw5c4b+YSVImQIrBpuQ==",
      "dev": true,
      "dependencies": {
        "bl": "^4.1.0",
        "chalk": "^4.1.0",
        "cli-cursor": "^3.1.0",
        "cli-spinners": "^2.5.0",
        "is-interactive": "^1.0.0",
        "is-unicode-supported": "^0.1.0",
        "log-symbols": "^4.1.0",
        "strip-ansi": "^6.0.0",
        "wcwidth": "^1.0.1"
      },
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/os-tmpdir": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/os-tmpdir/-/os-tmpdir-1.0.2.tgz",
      "integrity": "sha1-u+Z0BseaqFxc/sdm/lc0VV36EnQ=",
      "dev": true,
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/p-cancelable": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/p-cancelable/-/p-cancelable-1.1.0.tgz",
      "integrity": "sha512-s73XxOZ4zpt1edZYZzvhqFa6uvQc1vwUa0K0BdtIZgQMAJj9IbebH+JkgKZc9h+B05PKHLOTl4ajG1BmNrVZlw==",
      "dev": true,
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/p-defer": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/p-defer/-/p-defer-1.0.0.tgz",
      "integrity": "sha1-n26xgvbJqozXQwBKfU+WsZaw+ww=",
      "dev": true,
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/p-finally": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/p-finally/-/p-finally-1.0.0.tgz",
      "integrity": "sha1-P7z7FbiZpEEjs0ttzBi3JDNqLK4=",
      "dev": true,
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/p-is-promise": {
      "version": "2.1.0",
      "resolved": "https://registry.npmjs.org/p-is-promise/-/p-is-promise-2.1.0.tgz",
      "integrity": "sha512-Y3W0wlRPK8ZMRbNq97l4M5otioeA5lm1z7bkNkxCka8HSPjR0xRWmpCmc9utiaLP9Jb1eD8BgeIxTW4AIF45Pg==",
      "dev": true,
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/p-limit": {
      "version": "1.3.0",
      "resolved": "https://registry.npmjs.org/p-limit/-/p-limit-1.3.0.tgz",
      "integrity": "sha512-vvcXsLAJ9Dr5rQOPk7toZQZJApBl2K4J6dANSsEuh6QI41JYcsS/qhTGa9ErIUUgK3WNQoJYvylxvjqmiqEA9Q==",
      "dev": true,
      "dependencies": {
        "p-try": "^1.0.0"
      },
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/p-locate": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/p-locate/-/p-locate-2.0.0.tgz",
      "integrity": "sha1-IKAQOyIqcMj9OcwuWAaA893l7EM=",
      "dev": true,
      "dependencies": {
        "p-limit": "^1.1.0"
      },
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/p-map": {
      "version": "4.0.0",
      "resolved": "https://registry.npmjs.org/p-map/-/p-map-4.0.0.tgz",
      "integrity": "sha512-/bjOqmgETBYB5BoEeGVea8dmvHb2m9GLy1E9W43yeyfP6QQCZGFNa+XRceJEuDB6zqr+gKpIAmlLebMpykw/MQ==",
      "dev": true,
      "dependencies": {
        "aggregate-error": "^3.0.0"
      },
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/p-try": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/p-try/-/p-try-1.0.0.tgz",
      "integrity": "sha1-y8ec26+P1CKOE/Yh8rGiN8GyB7M=",
      "dev": true,
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/parse-author": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/parse-author/-/parse-author-2.0.0.tgz",
      "integrity": "sha1-00YL8d3Q367tQtp1QkLmX7aEqB8=",
      "dev": true,
      "dependencies": {
        "author-regex": "^1.0.0"
      },
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/parse-json": {
      "version": "2.2.0",
      "resolved": "https://registry.npmjs.org/parse-json/-/parse-json-2.2.0.tgz",
      "integrity": "sha1-9ID0BDTvgHQfhGkJn43qGPVaTck=",
      "dev": true,
      "dependencies": {
        "error-ex": "^1.2.0"
      },
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/parse-ms": {
      "version": "2.1.0",
      "resolved": "https://registry.npmjs.org/parse-ms/-/parse-ms-2.1.0.tgz",
      "integrity": "sha512-kHt7kzLoS9VBZfUsiKjv43mr91ea+U05EyKkEtqp7vNbHxmaVuEqN7XxeEVnGrMtYOAxGrDElSi96K7EgO1zCA==",
      "dev": true,
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/parse-passwd": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/parse-passwd/-/parse-passwd-1.0.0.tgz",
      "integrity": "sha1-bVuTSkVpk7I9N/QKOC1vFmao5cY=",
      "dev": true,
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/path-exists": {
      "version": "3.0.0",
      "resolved": "https://registry.npmjs.org/path-exists/-/path-exists-3.0.0.tgz",
      "integrity": "sha1-zg6+ql94yxiSXqfYENe1mwEP1RU=",
      "dev": true,
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/path-is-absolute": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/path-is-absolute/-/path-is-absolute-1.0.1.tgz",
      "integrity": "sha1-F0uSaHNVNP+8es5r9TpanhtcX18=",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/path-key": {
      "version": "3.1.1",
      "resolved": "https://registry.npmjs.org/path-key/-/path-key-3.1.1.tgz",
      "integrity": "sha512-ojmeN0qd+y0jszEtoY48r0Peq5dwMEkIlCOu6Q5f41lfkswXuKtYrhgoTpLnyIcHm24Uhqx+5Tqm2InSwLhE6Q==",
      "dev": true,
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/path-parse": {
      "version": "1.0.7",
      "resolved": "https://registry.npmjs.org/path-parse/-/path-parse-1.0.7.tgz",
      "integrity": "sha512-LDJzPVEEEPR+y48z93A0Ed0yXb8pAByGWo/k5YYdYgpY2/2EsOsksJrq7lOHxryrVOn1ejG6oAp8ahvOIQD8sw==",
      "dev": true
    },
    "node_modules/path-type": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/path-type/-/path-type-2.0.0.tgz",
      "integrity": "sha1-8BLMuEFbcJb8LaoQVMPXI4lZTHM=",
      "dev": true,
      "dependencies": {
        "pify": "^2.0.0"
      },
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/path-type/node_modules/pify": {
      "version": "2.3.0",
      "resolved": "https://registry.npmjs.org/pify/-/pify-2.3.0.tgz",
      "integrity": "sha1-7RQaasBDqEnqWISY59yosVMw6Qw=",
      "dev": true,
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/pend": {
      "version": "1.2.0",
      "resolved": "https://registry.npmjs.org/pend/-/pend-1.2.0.tgz",
      "integrity": "sha1-elfrVQpng/kRUzH89GY9XI4AelA="
    },
    "node_modules/performance-now": {
      "version": "2.1.0",
      "resolved": "https://registry.npmjs.org/performance-now/-/performance-now-2.1.0.tgz",
      "integrity": "sha1-Ywn04OX6kT7BxpMHrjZLSzd8nns=",
      "dev": true
    },
    "node_modules/picomatch": {
      "version": "2.3.1",
      "resolved": "https://registry.npmjs.org/picomatch/-/picomatch-2.3.1.tgz",
      "integrity": "sha512-JU3teHTNjmE2VCGFzuY8EXzCDVwEqB2a8fsIvwaStHhAWJEeVd1o1QD80CU6+ZdEXXSLbSsuLwJjkCBWqRQUVA==",
      "dev": true,
      "engines": {
        "node": ">=8.6"
      },
      "funding": {
        "url": "https://github.com/sponsors/jonschlinkert"
      }
    },
    "node_modules/pify": {
      "version": "3.0.0",
      "resolved": "https://registry.npmjs.org/pify/-/pify-3.0.0.tgz",
      "integrity": "sha1-5aSs0sEB/fPZpNB/DbxNtJ3SgXY=",
      "dev": true,
      "optional": true,
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/pinkie": {
      "version": "2.0.4",
      "resolved": "https://registry.npmjs.org/pinkie/-/pinkie-2.0.4.tgz",
      "integrity": "sha1-clVrgM+g1IqXToDnckjoDtT3+HA=",
      "dev": true,
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/pinkie-promise": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/pinkie-promise/-/pinkie-promise-2.0.1.tgz",
      "integrity": "sha1-ITXW36ejWMBprJsXh3YogihFD/o=",
      "dev": true,
      "dependencies": {
        "pinkie": "^2.0.0"
      },
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/pkg-dir": {
      "version": "4.2.0",
      "resolved": "https://registry.npmjs.org/pkg-dir/-/pkg-dir-4.2.0.tgz",
      "integrity": "sha512-HRDzbaKjC+AOWVXxAU/x54COGeIv9eb+6CkDSQoNTt4XyWoIJvuPsXizxu/Fr23EiekbtZwmh1IcIG/l/a10GQ==",
      "dependencies": {
        "find-up": "^4.0.0"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/pkg-dir/node_modules/find-up": {
      "version": "4.1.0",
      "resolved": "https://registry.npmjs.org/find-up/-/find-up-4.1.0.tgz",
      "integrity": "sha512-PpOwAdQ/YlXQ2vj8a3h8IipDuYRi3wceVQQGYWxNINccq40Anw7BlsEXCMbt1Zt+OLA6Fq9suIpIWD0OsnISlw==",
      "dependencies": {
        "locate-path": "^5.0.0",
        "path-exists": "^4.0.0"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/pkg-dir/node_modules/locate-path": {
      "version": "5.0.0",
      "resolved": "https://registry.npmjs.org/locate-path/-/locate-path-5.0.0.tgz",
      "integrity": "sha512-t7hw9pI+WvuwNJXwk5zVHpyhIqzg2qTlklJOf0mVxGSbe3Fp2VieZcduNYjaLDoy6p9uGpQEGWG87WpMKlNq8g==",
      "dependencies": {
        "p-locate": "^4.1.0"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/pkg-dir/node_modules/p-limit": {
      "version": "2.3.0",
      "resolved": "https://registry.npmjs.org/p-limit/-/p-limit-2.3.0.tgz",
      "integrity": "sha512-//88mFWSJx8lxCzwdAABTJL2MyWB12+eIY7MDL2SqLmAkeKU9qxRvWuSyTjm3FUmpBEMuFfckAIqEaVGUDxb6w==",
      "dependencies": {
        "p-try": "^2.0.0"
      },
      "engines": {
        "node": ">=6"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/pkg-dir/node_modules/p-locate": {
      "version": "4.1.0",
      "resolved": "https://registry.npmjs.org/p-locate/-/p-locate-4.1.0.tgz",
      "integrity": "sha512-R79ZZ/0wAxKGu3oYMlz8jy/kbhsNrS7SKZ7PxEHBgJ5+F2mtFW2fK2cOtBh1cHYkQsbzFV7I+EoRKe6Yt0oK7A==",
      "dependencies": {
        "p-limit": "^2.2.0"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/pkg-dir/node_modules/p-try": {
      "version": "2.2.0",
      "resolved": "https://registry.npmjs.org/p-try/-/p-try-2.2.0.tgz",
      "integrity": "sha512-R4nPAVTAU0B9D35/Gk3uJf/7XYbQcyohSKdvAxIRSNghFl4e71hVoGnBNQz9cWaXxO2I10KTC+3jMdvvoKw6dQ==",
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/pkg-dir/node_modules/path-exists": {
      "version": "4.0.0",
      "resolved": "https://registry.npmjs.org/path-exists/-/path-exists-4.0.0.tgz",
      "integrity": "sha512-ak9Qy5Q7jYb2Wwcey5Fpvg2KoAc/ZIhLSLOSBmRmygPsGwkVVt0fZa0qrtMz+m6tJTAHfZQ8FnmB4MG4LWy7/w==",
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/plist": {
      "version": "3.0.4",
      "resolved": "https://registry.npmjs.org/plist/-/plist-3.0.4.tgz",
      "integrity": "sha512-ksrr8y9+nXOxQB2osVNqrgvX/XQPOXaU4BQMKjYq8PvaY1U18mo+fKgBSwzK+luSyinOuPae956lSVcBwxlAMg==",
      "dev": true,
      "dependencies": {
        "base64-js": "^1.5.1",
        "xmlbuilder": "^9.0.7"
      },
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/prepend-http": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/prepend-http/-/prepend-http-2.0.0.tgz",
      "integrity": "sha1-6SQ0v6XqjBn0HN/UAddBo8gZ2Jc=",
      "dev": true,
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/pretty-bytes": {
      "version": "1.0.4",
      "resolved": "https://registry.npmjs.org/pretty-bytes/-/pretty-bytes-1.0.4.tgz",
      "integrity": "sha1-CiLoIQYJrTVUL4yNXSFZr/B1HIQ=",
      "dev": true,
      "dependencies": {
        "get-stdin": "^4.0.1",
        "meow": "^3.1.0"
      },
      "bin": {
        "pretty-bytes": "cli.js"
      },
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/pretty-ms": {
      "version": "7.0.1",
      "resolved": "https://registry.npmjs.org/pretty-ms/-/pretty-ms-7.0.1.tgz",
      "integrity": "sha512-973driJZvxiGOQ5ONsFhOF/DtzPMOMtgC11kCpUrPGMTgqp2q/1gwzCquocrN33is0VZ5GFHXZYMM9l6h67v2Q==",
      "dev": true,
      "dependencies": {
        "parse-ms": "^2.1.0"
      },
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/process-nextick-args": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/process-nextick-args/-/process-nextick-args-2.0.1.tgz",
      "integrity": "sha512-3ouUOpQhtgrbOa17J7+uxOTpITYWaGP7/AhoR3+A+/1e9skrzelGi/dXzEYyvbxubEF6Wn2ypscTKiKJFFn1ag==",
      "dev": true
    },
    "node_modules/progress": {
      "version": "2.0.3",
      "resolved": "https://registry.npmjs.org/progress/-/progress-2.0.3.tgz",
      "integrity": "sha512-7PiHtLll5LdnKIMw100I+8xJXR5gW2QwWYkT6iJva0bXitZKa/XMrSbdmg3r2Xnaidz9Qumd0VPaMrZlF9V9sA==",
      "engines": {
        "node": ">=0.4.0"
      }
    },
    "node_modules/progress-stream": {
      "version": "1.2.0",
      "resolved": "https://registry.npmjs.org/progress-stream/-/progress-stream-1.2.0.tgz",
      "integrity": "sha1-LNPP6jO6OonJwSHsM0er6asSX3c=",
      "dev": true,
      "dependencies": {
        "speedometer": "~0.1.2",
        "through2": "~0.2.3"
      }
    },
    "node_modules/promise-inflight": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/promise-inflight/-/promise-inflight-1.0.1.tgz",
      "integrity": "sha1-mEcocL8igTL8vdhoEputEsPAKeM=",
      "dev": true
    },
    "node_modules/promise-retry": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/promise-retry/-/promise-retry-2.0.1.tgz",
      "integrity": "sha512-y+WKFlBR8BGXnsNlIHFGPZmyDf3DFMoLhaflAnyZgV6rG6xu+JwesTo2Q9R6XwYmtmwAFCkAk3e35jEdoeh/3g==",
      "dev": true,
      "dependencies": {
        "err-code": "^2.0.2",
        "retry": "^0.12.0"
      },
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/proto-list": {
      "version": "1.2.4",
      "resolved": "https://registry.npmjs.org/proto-list/-/proto-list-1.2.4.tgz",
      "integrity": "sha1-IS1b/hMYMGpCD2QCuOJv85ZHqEk=",
      "dev": true,
      "optional": true
    },
    "node_modules/proxy-from-env": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/proxy-from-env/-/proxy-from-env-1.1.0.tgz",
      "integrity": "sha512-D+zkORCbA9f1tdWRK0RaCR3GPv50cMxcrz4X8k5LTSUD1Dkw47mKJEZQNunItRTkWwgtaUSo1RVFRIG9ZXiFYg=="
    },
    "node_modules/psl": {
      "version": "1.8.0",
      "resolved": "https://registry.npmjs.org/psl/-/psl-1.8.0.tgz",
      "integrity": "sha512-RIdOzyoavK+hA18OGGWDqUTsCLhtA7IcZ/6NCs4fFJaHBDab+pDDmDIByWFRQJq2Cd7r1OoQxBGKOaztq+hjIQ==",
      "dev": true
    },
    "node_modules/pump": {
      "version": "3.0.0",
      "resolved": "https://registry.npmjs.org/pump/-/pump-3.0.0.tgz",
      "integrity": "sha512-LwZy+p3SFs1Pytd/jYct4wpv49HiYCqd9Rlc5ZVdk0V+8Yzv6jR5Blk3TRmPL1ft69TxP0IMZGJ+WPFU2BFhww==",
      "dependencies": {
        "end-of-stream": "^1.1.0",
        "once": "^1.3.1"
      }
    },
    "node_modules/punycode": {
      "version": "2.1.1",
      "resolved": "https://registry.npmjs.org/punycode/-/punycode-2.1.1.tgz",
      "integrity": "sha512-XRsRjdf+j5ml+y/6GKHPZbrF/8p2Yga0JPtdqTIY2Xe5ohJPD9saDJJLPvp9+NSBprVvevdXZybnj2cv8OEd0A==",
      "dev": true,
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/puppeteer": {
      "version": "13.1.2",
      "resolved": "https://registry.npmjs.org/puppeteer/-/puppeteer-13.1.2.tgz",
      "integrity": "sha512-ozVM8Tdg0patMtm/xAr3Uh7rQ28vBpbTHLP+ECmoAxG/s4PKrVLN764H/poLux7Ln77jHThOd8OBJj5mTuA6Iw==",
      "hasInstallScript": true,
      "dependencies": {
        "debug": "4.3.2",
        "devtools-protocol": "0.0.948846",
        "extract-zip": "2.0.1",
        "https-proxy-agent": "5.0.0",
        "node-fetch": "2.6.7",
        "pkg-dir": "4.2.0",
        "progress": "2.0.3",
        "proxy-from-env": "1.1.0",
        "rimraf": "3.0.2",
        "tar-fs": "2.1.1",
        "unbzip2-stream": "1.4.3",
        "ws": "8.2.3"
      },
      "engines": {
        "node": ">=10.18.1"
      }
    },
    "node_modules/puppeteer-core": {
      "version": "13.1.2",
      "resolved": "https://registry.npmjs.org/puppeteer-core/-/puppeteer-core-13.1.2.tgz",
      "integrity": "sha512-A60/BJkYKpvoWPN0sq0WbOUYey6Wqpn1vlWCt8Ov7PxGIjyuGX2Wb39LObGjOxh4UN+YxCVE+oYQlkIFSmHJtg==",
      "dependencies": {
        "debug": "4.3.2",
        "devtools-protocol": "0.0.948846",
        "extract-zip": "2.0.1",
        "https-proxy-agent": "5.0.0",
        "node-fetch": "2.6.7",
        "pkg-dir": "4.2.0",
        "progress": "2.0.3",
        "proxy-from-env": "1.1.0",
        "rimraf": "3.0.2",
        "tar-fs": "2.1.1",
        "unbzip2-stream": "1.4.3",
        "ws": "8.2.3"
      },
      "engines": {
        "node": ">=10.18.1"
      }
    },
    "node_modules/puppeteer-core/node_modules/debug": {
      "version": "4.3.2",
      "resolved": "https://registry.npmjs.org/debug/-/debug-4.3.2.tgz",
      "integrity": "sha512-mOp8wKcvj7XxC78zLgw/ZA+6TSgkoE2C/ienthhRD298T7UNwAg9diBpLRxC0mOezLl4B0xV7M0cCO6P/O0Xhw==",
      "dependencies": {
        "ms": "2.1.2"
      },
      "engines": {
        "node": ">=6.0"
      },
      "peerDependenciesMeta": {
        "supports-color": {
          "optional": true
        }
      }
    },
    "node_modules/puppeteer-core/node_modules/extract-zip": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/extract-zip/-/extract-zip-2.0.1.tgz",
      "integrity": "sha512-GDhU9ntwuKyGXdZBUgTIe+vXnWj0fppUEtMDL0+idd5Sta8TGpHssn/eusA9mrPr9qNDym6SxAYZjNvCn/9RBg==",
      "dependencies": {
        "debug": "^4.1.1",
        "get-stream": "^5.1.0",
        "yauzl": "^2.10.0"
      },
      "bin": {
        "extract-zip": "cli.js"
      },
      "engines": {
        "node": ">= 10.17.0"
      },
      "optionalDependencies": {
        "@types/yauzl": "^2.9.1"
      }
    },
    "node_modules/puppeteer-core/node_modules/get-stream": {
      "version": "5.2.0",
      "resolved": "https://registry.npmjs.org/get-stream/-/get-stream-5.2.0.tgz",
      "integrity": "sha512-nBF+F1rAZVCu/p7rjzgA+Yb4lfYXrpl7a6VmJrU8wF9I1CKvP/QwPNZHnOlwbTkY6dvtFIzFMSyQXbLoTQPRpA==",
      "dependencies": {
        "pump": "^3.0.0"
      },
      "engines": {
        "node": ">=8"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/puppeteer-in-electron": {
      "version": "3.0.5",
      "resolved": "https://registry.npmjs.org/puppeteer-in-electron/-/puppeteer-in-electron-3.0.5.tgz",
      "integrity": "sha512-GjuPRMweteeBST9aXcFagAEiaIeQYKZaWX/4QBnMqRBQ4bEXPJkFd5p8oc6ovPbe1eriVHef2D2gr/Gv+3HTpQ==",
      "dependencies": {
        "@types/async-retry": "^1.4.1",
        "@types/node-fetch": "^2.5.4",
        "@types/puppeteer-core": "^1.9.0",
        "@types/uuid": "^3.4.6",
        "async-retry": "^1.3.1",
        "get-port": "^5.1.1",
        "uuid": "^8.3.2"
      }
    },
    "node_modules/puppeteer-in-electron/node_modules/uuid": {
      "version": "8.3.2",
      "resolved": "https://registry.npmjs.org/uuid/-/uuid-8.3.2.tgz",
      "integrity": "sha512-+NYs2QeMWy+GWFOEm9xnn6HCDp0l7QBD7ml8zLUmJ+93Q5NF0NocErnwkTkXVFNiX3/fpC6afS8Dhb/gz7R7eg==",
      "bin": {
        "uuid": "dist/bin/uuid"
      }
    },
    "node_modules/puppeteer/node_modules/debug": {
      "version": "4.3.2",
      "resolved": "https://registry.npmjs.org/debug/-/debug-4.3.2.tgz",
      "integrity": "sha512-mOp8wKcvj7XxC78zLgw/ZA+6TSgkoE2C/ienthhRD298T7UNwAg9diBpLRxC0mOezLl4B0xV7M0cCO6P/O0Xhw==",
      "dependencies": {
        "ms": "2.1.2"
      },
      "engines": {
        "node": ">=6.0"
      },
      "peerDependenciesMeta": {
        "supports-color": {
          "optional": true
        }
      }
    },
    "node_modules/puppeteer/node_modules/extract-zip": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/extract-zip/-/extract-zip-2.0.1.tgz",
      "integrity": "sha512-GDhU9ntwuKyGXdZBUgTIe+vXnWj0fppUEtMDL0+idd5Sta8TGpHssn/eusA9mrPr9qNDym6SxAYZjNvCn/9RBg==",
      "dependencies": {
        "debug": "^4.1.1",
        "get-stream": "^5.1.0",
        "yauzl": "^2.10.0"
      },
      "bin": {
        "extract-zip": "cli.js"
      },
      "engines": {
        "node": ">= 10.17.0"
      },
      "optionalDependencies": {
        "@types/yauzl": "^2.9.1"
      }
    },
    "node_modules/puppeteer/node_modules/get-stream": {
      "version": "5.2.0",
      "resolved": "https://registry.npmjs.org/get-stream/-/get-stream-5.2.0.tgz",
      "integrity": "sha512-nBF+F1rAZVCu/p7rjzgA+Yb4lfYXrpl7a6VmJrU8wF9I1CKvP/QwPNZHnOlwbTkY6dvtFIzFMSyQXbLoTQPRpA==",
      "dependencies": {
        "pump": "^3.0.0"
      },
      "engines": {
        "node": ">=8"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/qs": {
      "version": "6.5.3",
      "resolved": "https://registry.npmjs.org/qs/-/qs-6.5.3.tgz",
      "integrity": "sha512-qxXIEh4pCGfHICj1mAJQ2/2XVZkjCDTcEgfoSQxc/fYivUZxTkk7L3bDBJSoNrEzXI17oUO5Dp07ktqE5KzczA==",
      "dev": true,
      "engines": {
        "node": ">=0.6"
      }
    },
    "node_modules/queue-microtask": {
      "version": "1.2.3",
      "resolved": "https://registry.npmjs.org/queue-microtask/-/queue-microtask-1.2.3.tgz",
      "integrity": "sha512-NuaNSa6flKT5JaSYQzJok04JzTL1CA6aGhv5rfLW3PgqA+M2ChpZQnAC8h8i4ZFkBS8X5RqkDBHA7r4hej3K9A==",
      "dev": true,
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/feross"
        },
        {
          "type": "patreon",
          "url": "https://www.patreon.com/feross"
        },
        {
          "type": "consulting",
          "url": "https://feross.org/support"
        }
      ]
    },
    "node_modules/quick-lru": {
      "version": "5.1.1",
      "resolved": "https://registry.npmjs.org/quick-lru/-/quick-lru-5.1.1.tgz",
      "integrity": "sha512-WuyALRjWPDGtt/wzJiadO5AXY+8hZ80hVpe6MyivgraREW751X3SbhRvG3eLKOYN+8VEvqLcf3wdnt44Z4S4SA==",
      "dev": true,
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/rcedit": {
      "version": "3.0.1",
      "resolved": "https://registry.npmjs.org/rcedit/-/rcedit-3.0.1.tgz",
      "integrity": "sha512-XM0Jv40/y4hVAqj/MO70o/IWs4uOsaSoo2mLyk3klFDW+SStLnCtzuQu+1OBTIMGlM8CvaK9ftlYCp6DJ+cMsw==",
      "dev": true,
      "dependencies": {
        "cross-spawn-windows-exe": "^1.1.0"
      },
      "engines": {
        "node": ">= 10.0.0"
      }
    },
    "node_modules/read-pkg": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/read-pkg/-/read-pkg-2.0.0.tgz",
      "integrity": "sha1-jvHAYjxqbbDcZxPEv6xGMysjaPg=",
      "dev": true,
      "dependencies": {
        "load-json-file": "^2.0.0",
        "normalize-package-data": "^2.3.2",
        "path-type": "^2.0.0"
      },
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/read-pkg-up": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/read-pkg-up/-/read-pkg-up-2.0.0.tgz",
      "integrity": "sha1-a3KoBImE4MQeeVEP1en6mbO1Sb4=",
      "dev": true,
      "dependencies": {
        "find-up": "^2.0.0",
        "read-pkg": "^2.0.0"
      },
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/read-pkg-up/node_modules/find-up": {
      "version": "2.1.0",
      "resolved": "https://registry.npmjs.org/find-up/-/find-up-2.1.0.tgz",
      "integrity": "sha1-RdG35QbHF93UgndaK3eSCjwMV6c=",
      "dev": true,
      "dependencies": {
        "locate-path": "^2.0.0"
      },
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/readable-stream": {
      "version": "2.3.7",
      "resolved": "https://registry.npmjs.org/readable-stream/-/readable-stream-2.3.7.tgz",
      "integrity": "sha512-Ebho8K4jIbHAxnuxi7o42OrZgF/ZTNcsZj6nRKyUmkhLFq8CHItp/fy6hQZuZmP/n3yZ9VBUbp4zz/mX8hmYPw==",
      "dev": true,
      "dependencies": {
        "core-util-is": "~1.0.0",
        "inherits": "~2.0.3",
        "isarray": "~1.0.0",
        "process-nextick-args": "~2.0.0",
        "safe-buffer": "~5.1.1",
        "string_decoder": "~1.1.1",
        "util-deprecate": "~1.0.1"
      }
    },
    "node_modules/redent": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/redent/-/redent-1.0.0.tgz",
      "integrity": "sha1-z5Fqsf1fHxbfsggi3W7H9zDCr94=",
      "dev": true,
      "dependencies": {
        "indent-string": "^2.1.0",
        "strip-indent": "^1.0.1"
      },
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/redent/node_modules/indent-string": {
      "version": "2.1.0",
      "resolved": "https://registry.npmjs.org/indent-string/-/indent-string-2.1.0.tgz",
      "integrity": "sha1-ji1INIdCEhtKghi3oTfppSBJ3IA=",
      "dev": true,
      "dependencies": {
        "repeating": "^2.0.0"
      },
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/repeating": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/repeating/-/repeating-2.0.1.tgz",
      "integrity": "sha1-UhTFOpJtNVJwdSf7q0FdvAjQbdo=",
      "dev": true,
      "dependencies": {
        "is-finite": "^1.0.0"
      },
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/request": {
      "version": "2.88.2",
      "resolved": "https://registry.npmjs.org/request/-/request-2.88.2.tgz",
      "integrity": "sha512-MsvtOrfG9ZcrOwAW+Qi+F6HbD0CWXEh9ou77uOb7FM2WPhwT7smM833PzanhJLsgXjN89Ir6V2PczXNnMpwKhw==",
      "deprecated": "request has been deprecated, see https://github.com/request/request/issues/3142",
      "dev": true,
      "dependencies": {
        "aws-sign2": "~0.7.0",
        "aws4": "^1.8.0",
        "caseless": "~0.12.0",
        "combined-stream": "~1.0.6",
        "extend": "~3.0.2",
        "forever-agent": "~0.6.1",
        "form-data": "~2.3.2",
        "har-validator": "~5.1.3",
        "http-signature": "~1.2.0",
        "is-typedarray": "~1.0.0",
        "isstream": "~0.1.2",
        "json-stringify-safe": "~5.0.1",
        "mime-types": "~2.1.19",
        "oauth-sign": "~0.9.0",
        "performance-now": "^2.1.0",
        "qs": "~6.5.2",
        "safe-buffer": "^5.1.2",
        "tough-cookie": "~2.5.0",
        "tunnel-agent": "^0.6.0",
        "uuid": "^3.3.2"
      },
      "engines": {
        "node": ">= 6"
      }
    },
    "node_modules/require-directory": {
      "version": "2.1.1",
      "resolved": "https://registry.npmjs.org/require-directory/-/require-directory-2.1.1.tgz",
      "integrity": "sha1-jGStX9MNqxyXbiNE/+f3kqam30I=",
      "dev": true,
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/resolve": {
      "version": "1.22.0",
      "resolved": "https://registry.npmjs.org/resolve/-/resolve-1.22.0.tgz",
      "integrity": "sha512-Hhtrw0nLeSrFQ7phPp4OOcVjLPIeMnRlr5mcnVuMe7M/7eBn98A3hmFRLoFo3DLZkivSYwhRUJTyPyWAk56WLw==",
      "dev": true,
      "dependencies": {
        "is-core-module": "^2.8.1",
        "path-parse": "^1.0.7",
        "supports-preserve-symlinks-flag": "^1.0.0"
      },
      "bin": {
        "resolve": "bin/resolve"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/resolve-alpn": {
      "version": "1.2.1",
      "resolved": "https://registry.npmjs.org/resolve-alpn/-/resolve-alpn-1.2.1.tgz",
      "integrity": "sha512-0a1F4l73/ZFZOakJnQ3FvkJ2+gSTQWz/r2KE5OdDY0TxPm5h4GkqkWWfM47T7HsbnOtcJVEF4epCVy6u7Q3K+g==",
      "dev": true
    },
    "node_modules/resolve-dir": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/resolve-dir/-/resolve-dir-1.0.1.tgz",
      "integrity": "sha1-eaQGRMNivoLybv/nOcm7U4IEb0M=",
      "dev": true,
      "dependencies": {
        "expand-tilde": "^2.0.0",
        "global-modules": "^1.0.0"
      },
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/resolve-package": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/resolve-package/-/resolve-package-1.0.1.tgz",
      "integrity": "sha1-aG9wsYi9fWdfW7xCgszaBgq7nSc=",
      "dev": true,
      "dependencies": {
        "get-installed-path": "^2.0.3"
      },
      "engines": {
        "node": ">=4",
        "npm": ">=2"
      }
    },
    "node_modules/responselike": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/responselike/-/responselike-1.0.2.tgz",
      "integrity": "sha1-kYcg7ztjHFZCvgaPFa3lpG9Loec=",
      "dev": true,
      "dependencies": {
        "lowercase-keys": "^1.0.0"
      }
    },
    "node_modules/restore-cursor": {
      "version": "3.1.0",
      "resolved": "https://registry.npmjs.org/restore-cursor/-/restore-cursor-3.1.0.tgz",
      "integrity": "sha512-l+sSefzHpj5qimhFSE5a8nufZYAM3sBSVMAPtYkmC+4EH2anSGaEMXSD0izRQbu9nfyQ9y5JrVmp7E8oZrUjvA==",
      "dev": true,
      "dependencies": {
        "onetime": "^5.1.0",
        "signal-exit": "^3.0.2"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/retry": {
      "version": "0.12.0",
      "resolved": "https://registry.npmjs.org/retry/-/retry-0.12.0.tgz",
      "integrity": "sha1-G0KmJmoh8HQh0bC1S33BZ7AcATs=",
      "dev": true,
      "engines": {
        "node": ">= 4"
      }
    },
    "node_modules/reusify": {
      "version": "1.0.4",
      "resolved": "https://registry.npmjs.org/reusify/-/reusify-1.0.4.tgz",
      "integrity": "sha512-U9nH88a3fc/ekCF1l0/UP1IosiuIjyTh7hBvXVMHYgVcfGvt897Xguj2UOLDeI5BG2m7/uwyaLVT6fbtCwTyzw==",
      "dev": true,
      "engines": {
        "iojs": ">=1.0.0",
        "node": ">=0.10.0"
      }
    },
    "node_modules/rimraf": {
      "version": "3.0.2",
      "resolved": "https://registry.npmjs.org/rimraf/-/rimraf-3.0.2.tgz",
      "integrity": "sha512-JZkJMZkAGFFPP2YqXZXPbMlMBgsxzE8ILs4lMIX/2o0L9UBw9O/Y3o6wFw/i9YLapcUJWwqbi3kdxIPdC62TIA==",
      "dependencies": {
        "glob": "^7.1.3"
      },
      "bin": {
        "rimraf": "bin.js"
      },
      "funding": {
        "url": "https://github.com/sponsors/isaacs"
      }
    },
    "node_modules/roarr": {
      "version": "2.15.4",
      "resolved": "https://registry.npmjs.org/roarr/-/roarr-2.15.4.tgz",
      "integrity": "sha512-CHhPh+UNHD2GTXNYhPWLnU8ONHdI+5DI+4EYIAOaiD63rHeYlZvyh8P+in5999TTSFgUYuKUAjzRI4mdh/p+2A==",
      "dev": true,
      "optional": true,
      "dependencies": {
        "boolean": "^3.0.1",
        "detect-node": "^2.0.4",
        "globalthis": "^1.0.1",
        "json-stringify-safe": "^5.0.1",
        "semver-compare": "^1.0.0",
        "sprintf-js": "^1.1.2"
      },
      "engines": {
        "node": ">=8.0"
      }
    },
    "node_modules/run-async": {
      "version": "2.4.1",
      "resolved": "https://registry.npmjs.org/run-async/-/run-async-2.4.1.tgz",
      "integrity": "sha512-tvVnVv01b8c1RrA6Ep7JkStj85Guv/YrMcwqYQnwjsAS2cTmmPGBBjAjpCW7RrSodNSoE2/qg9O4bceNvUuDgQ==",
      "dev": true,
      "engines": {
        "node": ">=0.12.0"
      }
    },
    "node_modules/run-parallel": {
      "version": "1.2.0",
      "resolved": "https://registry.npmjs.org/run-parallel/-/run-parallel-1.2.0.tgz",
      "integrity": "sha512-5l4VyZR86LZ/lDxZTR6jqL8AFE2S0IFLMP26AbjsLVADxHdhB/c0GUsH+y39UfCi3dzz8OlQuPmnaJOMoDHQBA==",
      "dev": true,
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/feross"
        },
        {
          "type": "patreon",
          "url": "https://www.patreon.com/feross"
        },
        {
          "type": "consulting",
          "url": "https://feross.org/support"
        }
      ],
      "dependencies": {
        "queue-microtask": "^1.2.2"
      }
    },
    "node_modules/rxjs": {
      "version": "7.5.2",
      "resolved": "https://registry.npmjs.org/rxjs/-/rxjs-7.5.2.tgz",
      "integrity": "sha512-PwDt186XaL3QN5qXj/H9DGyHhP3/RYYgZZwqBv9Tv8rsAaiwFH1IsJJlcgD37J7UW5a6O67qX0KWKS3/pu0m4w==",
      "dev": true,
      "dependencies": {
        "tslib": "^2.1.0"
      }
    },
    "node_modules/safe-buffer": {
      "version": "5.1.2",
      "resolved": "https://registry.npmjs.org/safe-buffer/-/safe-buffer-5.1.2.tgz",
      "integrity": "sha512-Gd2UZBJDkXlY7GbJxfsE8/nvKkUEU1G38c1siN6QP6a9PT9MmHB8GnpscSmMJSoF8LOIrt8ud/wPtojys4G6+g=="
    },
    "node_modules/safer-buffer": {
      "version": "2.1.2",
      "resolved": "https://registry.npmjs.org/safer-buffer/-/safer-buffer-2.1.2.tgz",
      "integrity": "sha512-YZo3K82SD7Riyi0E1EQPojLz7kpepnSQI9IyPbHHg1XXXevb5dJI7tpyN2ADxGcQbHG7vcyRHk0cbwqcQriUtg==",
      "devOptional": true
    },
    "node_modules/semver": {
      "version": "6.3.0",
      "resolved": "https://registry.npmjs.org/semver/-/semver-6.3.0.tgz",
      "integrity": "sha512-b39TBaTSfV6yBrapU89p5fKekE2m/NwnDocOVruQFS1/veMgdzuPcnOM34M6CwxW8jH/lxEa5rBoDeUwu5HHTw==",
      "dev": true,
      "bin": {
        "semver": "bin/semver.js"
      }
    },
    "node_modules/semver-compare": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/semver-compare/-/semver-compare-1.0.0.tgz",
      "integrity": "sha1-De4hahyUGrN+nvsXiPavxf9VN/w=",
      "dev": true,
      "optional": true
    },
    "node_modules/serialize-error": {
      "version": "7.0.1",
      "resolved": "https://registry.npmjs.org/serialize-error/-/serialize-error-7.0.1.tgz",
      "integrity": "sha512-8I8TjW5KMOKsZQTvoxjuSIa7foAwPWGOts+6o7sgjz41/qMD9VQHEDxi6PBvK2l0MXUmqZyNpUK+T2tQaaElvw==",
      "dev": true,
      "optional": true,
      "dependencies": {
        "type-fest": "^0.13.1"
      },
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/set-blocking": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/set-blocking/-/set-blocking-2.0.0.tgz",
      "integrity": "sha1-BF+XgtARrppoA93TgrJDkrPYkPc=",
      "dev": true
    },
    "node_modules/shebang-command": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/shebang-command/-/shebang-command-2.0.0.tgz",
      "integrity": "sha512-kHxr2zZpYtdmrN1qDjrrX/Z1rR1kG8Dx+gkpK1G4eXmvXswmcE1hTWBWYUzlraYw1/yZp6YuDY77YtvbN0dmDA==",
      "dev": true,
      "dependencies": {
        "shebang-regex": "^3.0.0"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/shebang-regex": {
      "version": "3.0.0",
      "resolved": "https://registry.npmjs.org/shebang-regex/-/shebang-regex-3.0.0.tgz",
      "integrity": "sha512-7++dFhtcx3353uBaq8DDR4NuxBetBzC7ZQOhmTQInHEd6bSrXdiEyzCvG07Z44UYdLShWUyXt5M/yhz8ekcb1A==",
      "dev": true,
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/signal-exit": {
      "version": "3.0.6",
      "resolved": "https://registry.npmjs.org/signal-exit/-/signal-exit-3.0.6.tgz",
      "integrity": "sha512-sDl4qMFpijcGw22U5w63KmD3cZJfBuFlVNbVMKje2keoKML7X2UzWbc4XrmEbDwg0NXJc3yv4/ox7b+JWb57kQ==",
      "dev": true
    },
    "node_modules/single-line-log": {
      "version": "1.1.2",
      "resolved": "https://registry.npmjs.org/single-line-log/-/single-line-log-1.1.2.tgz",
      "integrity": "sha1-wvg/Jzo+GhbtsJlWYdoO1e8DM2Q=",
      "dev": true,
      "dependencies": {
        "string-width": "^1.0.1"
      }
    },
    "node_modules/single-line-log/node_modules/ansi-regex": {
      "version": "2.1.1",
      "resolved": "https://registry.npmjs.org/ansi-regex/-/ansi-regex-2.1.1.tgz",
      "integrity": "sha1-w7M6te42DYbg5ijwRorn7yfWVN8=",
      "dev": true,
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/single-line-log/node_modules/is-fullwidth-code-point": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/is-fullwidth-code-point/-/is-fullwidth-code-point-1.0.0.tgz",
      "integrity": "sha1-754xOG8DGn8NZDr4L95QxFfvAMs=",
      "dev": true,
      "dependencies": {
        "number-is-nan": "^1.0.0"
      },
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/single-line-log/node_modules/string-width": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/string-width/-/string-width-1.0.2.tgz",
      "integrity": "sha1-EYvfW4zcUaKn5w0hHgfisLmxB9M=",
      "dev": true,
      "dependencies": {
        "code-point-at": "^1.0.0",
        "is-fullwidth-code-point": "^1.0.0",
        "strip-ansi": "^3.0.0"
      },
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/single-line-log/node_modules/strip-ansi": {
      "version": "3.0.1",
      "resolved": "https://registry.npmjs.org/strip-ansi/-/strip-ansi-3.0.1.tgz",
      "integrity": "sha1-ajhfuIU9lS1f8F0Oiq+UJ43GPc8=",
      "dev": true,
      "dependencies": {
        "ansi-regex": "^2.0.0"
      },
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/smart-buffer": {
      "version": "4.2.0",
      "resolved": "https://registry.npmjs.org/smart-buffer/-/smart-buffer-4.2.0.tgz",
      "integrity": "sha512-94hK0Hh8rPqQl2xXc3HsaBoOXKV20MToPkcXvwbISWLEs+64sBq5kFgn2kJDHb1Pry9yrP0dxrCI9RRci7RXKg==",
      "dev": true,
      "engines": {
        "node": ">= 6.0.0",
        "npm": ">= 3.0.0"
      }
    },
    "node_modules/socks": {
      "version": "2.6.1",
      "resolved": "https://registry.npmjs.org/socks/-/socks-2.6.1.tgz",
      "integrity": "sha512-kLQ9N5ucj8uIcxrDwjm0Jsqk06xdpBjGNQtpXy4Q8/QY2k+fY7nZH8CARy+hkbG+SGAovmzzuauCpBlb8FrnBA==",
      "dev": true,
      "dependencies": {
        "ip": "^1.1.5",
        "smart-buffer": "^4.1.0"
      },
      "engines": {
        "node": ">= 10.13.0",
        "npm": ">= 3.0.0"
      }
    },
    "node_modules/socks-proxy-agent": {
      "version": "6.1.1",
      "resolved": "https://registry.npmjs.org/socks-proxy-agent/-/socks-proxy-agent-6.1.1.tgz",
      "integrity": "sha512-t8J0kG3csjA4g6FTbsMOWws+7R7vuRC8aQ/wy3/1OWmsgwA68zs/+cExQ0koSitUDXqhufF/YJr9wtNMZHw5Ew==",
      "dev": true,
      "dependencies": {
        "agent-base": "^6.0.2",
        "debug": "^4.3.1",
        "socks": "^2.6.1"
      },
      "engines": {
        "node": ">= 10"
      }
    },
    "node_modules/source-map": {
      "version": "0.6.1",
      "resolved": "https://registry.npmjs.org/source-map/-/source-map-0.6.1.tgz",
      "integrity": "sha512-UjgapumWlbMhkBgzT7Ykc5YXUT46F0iKu8SGXq0bcwP5dz/h0Plj6enJqjz1Zbq2l5WaqYnrVbwWOWMyF3F47g==",
      "dev": true,
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/source-map-support": {
      "version": "0.5.21",
      "resolved": "https://registry.npmjs.org/source-map-support/-/source-map-support-0.5.21.tgz",
      "integrity": "sha512-uBHU3L3czsIyYXKX88fdrGovxdSCoTGDRZ6SYXtSRxLZUzHg5P/66Ht6uoUlHu9EZod+inXhKo3qQgwXUT/y1w==",
      "dev": true,
      "dependencies": {
        "buffer-from": "^1.0.0",
        "source-map": "^0.6.0"
      }
    },
    "node_modules/spdx-correct": {
      "version": "3.1.1",
      "resolved": "https://registry.npmjs.org/spdx-correct/-/spdx-correct-3.1.1.tgz",
      "integrity": "sha512-cOYcUWwhCuHCXi49RhFRCyJEK3iPj1Ziz9DpViV3tbZOwXD49QzIN3MpOLJNxh2qwq2lJJZaKMVw9qNi4jTC0w==",
      "dev": true,
      "dependencies": {
        "spdx-expression-parse": "^3.0.0",
        "spdx-license-ids": "^3.0.0"
      }
    },
    "node_modules/spdx-exceptions": {
      "version": "2.3.0",
      "resolved": "https://registry.npmjs.org/spdx-exceptions/-/spdx-exceptions-2.3.0.tgz",
      "integrity": "sha512-/tTrYOC7PPI1nUAgx34hUpqXuyJG+DTHJTnIULG4rDygi4xu/tfgmq1e1cIRwRzwZgo4NLySi+ricLkZkw4i5A==",
      "dev": true
    },
    "node_modules/spdx-expression-parse": {
      "version": "3.0.1",
      "resolved": "https://registry.npmjs.org/spdx-expression-parse/-/spdx-expression-parse-3.0.1.tgz",
      "integrity": "sha512-cbqHunsQWnJNE6KhVSMsMeH5H/L9EpymbzqTQ3uLwNCLZ1Q481oWaofqH7nO6V07xlXwY6PhQdQ2IedWx/ZK4Q==",
      "dev": true,
      "dependencies": {
        "spdx-exceptions": "^2.1.0",
        "spdx-license-ids": "^3.0.0"
      }
    },
    "node_modules/spdx-license-ids": {
      "version": "3.0.11",
      "resolved": "https://registry.npmjs.org/spdx-license-ids/-/spdx-license-ids-3.0.11.tgz",
      "integrity": "sha512-Ctl2BrFiM0X3MANYgj3CkygxhRmr9mi6xhejbdO960nF6EDJApTYpn0BQnDKlnNBULKiCN1n3w9EBkHK8ZWg+g==",
      "dev": true
    },
    "node_modules/speedometer": {
      "version": "0.1.4",
      "resolved": "https://registry.npmjs.org/speedometer/-/speedometer-0.1.4.tgz",
      "integrity": "sha1-mHbb0qFp0xFUAtSObqYynIgWpQ0=",
      "dev": true
    },
    "node_modules/sprintf-js": {
      "version": "1.1.2",
      "resolved": "https://registry.npmjs.org/sprintf-js/-/sprintf-js-1.1.2.tgz",
      "integrity": "sha512-VE0SOVEHCk7Qc8ulkWw3ntAzXuqf7S2lvwQaDLRnUeIEaKNQJzV6BwmLKhOqT61aGhfUMrXeaBk+oDGCzvhcug==",
      "dev": true,
      "optional": true
    },
    "node_modules/sshpk": {
      "version": "1.17.0",
      "resolved": "https://registry.npmjs.org/sshpk/-/sshpk-1.17.0.tgz",
      "integrity": "sha512-/9HIEs1ZXGhSPE8X6Ccm7Nam1z8KcoCqPdI7ecm1N33EzAetWahvQWVqLZtaZQ+IDKX4IyA2o0gBzqIMkAagHQ==",
      "dev": true,
      "dependencies": {
        "asn1": "~0.2.3",
        "assert-plus": "^1.0.0",
        "bcrypt-pbkdf": "^1.0.0",
        "dashdash": "^1.12.0",
        "ecc-jsbn": "~0.1.1",
        "getpass": "^0.1.1",
        "jsbn": "~0.1.0",
        "safer-buffer": "^2.0.2",
        "tweetnacl": "~0.14.0"
      },
      "bin": {
        "sshpk-conv": "bin/sshpk-conv",
        "sshpk-sign": "bin/sshpk-sign",
        "sshpk-verify": "bin/sshpk-verify"
      },
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/ssri": {
      "version": "8.0.1",
      "resolved": "https://registry.npmjs.org/ssri/-/ssri-8.0.1.tgz",
      "integrity": "sha512-97qShzy1AiyxvPNIkLWoGua7xoQzzPjQ0HAH4B0rWKo7SZ6USuPcrUiAFrws0UH8RrbWmgq3LMTObhPIHbbBeQ==",
      "dev": true,
      "dependencies": {
        "minipass": "^3.1.1"
      },
      "engines": {
        "node": ">= 8"
      }
    },
    "node_modules/string_decoder": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/string_decoder/-/string_decoder-1.1.1.tgz",
      "integrity": "sha512-n/ShnvDi6FHbbVfviro+WojiFzv+s8MPMHBczVePfUpDJLwoLT0ht1l4YwBCbi8pJAveEEdnkHyPyTP/mzRfwg==",
      "dependencies": {
        "safe-buffer": "~5.1.0"
      }
    },
    "node_modules/string-width": {
      "version": "4.2.3",
      "resolved": "https://registry.npmjs.org/string-width/-/string-width-4.2.3.tgz",
      "integrity": "sha512-wKyQRQpjJ0sIp62ErSZdGsjMJWsap5oRNihHhu6G7JVO/9jIB6UyevL+tXuOqrng8j/cxKTWyWUwvSTriiZz/g==",
      "dev": true,
      "dependencies": {
        "emoji-regex": "^8.0.0",
        "is-fullwidth-code-point": "^3.0.0",
        "strip-ansi": "^6.0.1"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/strip-ansi": {
      "version": "6.0.1",
      "resolved": "https://registry.npmjs.org/strip-ansi/-/strip-ansi-6.0.1.tgz",
      "integrity": "sha512-Y38VPSHcqkFrCpFnQ9vuSXmquuv5oXOKpGeT6aGrr3o3Gc9AlVa6JBfUSOCnbxGGZF+/0ooI7KrPuUSztUdU5A==",
      "dev": true,
      "dependencies": {
        "ansi-regex": "^5.0.1"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/strip-bom": {
      "version": "3.0.0",
      "resolved": "https://registry.npmjs.org/strip-bom/-/strip-bom-3.0.0.tgz",
      "integrity": "sha1-IzTBjpx1n3vdVv3vfprj1YjmjtM=",
      "dev": true,
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/strip-eof": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/strip-eof/-/strip-eof-1.0.0.tgz",
      "integrity": "sha1-u0P/VZim6wXYm1n80SnJgzE2Br8=",
      "dev": true,
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/strip-indent": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/strip-indent/-/strip-indent-1.0.1.tgz",
      "integrity": "sha1-DHlipq3vp7vUrDZkYKY4VSrhoKI=",
      "dev": true,
      "dependencies": {
        "get-stdin": "^4.0.1"
      },
      "bin": {
        "strip-indent": "cli.js"
      },
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/strip-outer": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/strip-outer/-/strip-outer-1.0.1.tgz",
      "integrity": "sha512-k55yxKHwaXnpYGsOzg4Vl8+tDrWylxDEpknGjhTiZB8dFRU5rTo9CAzeycivxV3s+zlTKwrs6WxMxR95n26kwg==",
      "dev": true,
      "dependencies": {
        "escape-string-regexp": "^1.0.2"
      },
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/strip-outer/node_modules/escape-string-regexp": {
      "version": "1.0.5",
      "resolved": "https://registry.npmjs.org/escape-string-regexp/-/escape-string-regexp-1.0.5.tgz",
      "integrity": "sha1-G2HAViGQqN/2rjuyzwIAyhMLhtQ=",
      "dev": true,
      "engines": {
        "node": ">=0.8.0"
      }
    },
    "node_modules/sudo-prompt": {
      "version": "9.2.1",
      "resolved": "https://registry.npmjs.org/sudo-prompt/-/sudo-prompt-9.2.1.tgz",
      "integrity": "sha512-Mu7R0g4ig9TUuGSxJavny5Rv0egCEtpZRNMrZaYS1vxkiIxGiGUwoezU3LazIQ+KE04hTrTfNPgxU5gzi7F5Pw==",
      "dev": true
    },
    "node_modules/sumchecker": {
      "version": "3.0.1",
      "resolved": "https://registry.npmjs.org/sumchecker/-/sumchecker-3.0.1.tgz",
      "integrity": "sha512-MvjXzkz/BOfyVDkG0oFOtBxHX2u3gKbMHIF/dXblZsgD3BWOFLmHovIpZY7BykJdAjcqRCBi1WYBNdEC9yI7vg==",
      "dev": true,
      "dependencies": {
        "debug": "^4.1.0"
      },
      "engines": {
        "node": ">= 8.0"
      }
    },
    "node_modules/supports-color": {
      "version": "7.2.0",
      "resolved": "https://registry.npmjs.org/supports-color/-/supports-color-7.2.0.tgz",
      "integrity": "sha512-qpCAvRl9stuOHveKsn7HncJRvv501qIacKzQlO/+Lwxc9+0q2wLyv4Dfvt80/DPn2pqOBsJdDiogXGR9+OvwRw==",
      "dev": true,
      "dependencies": {
        "has-flag": "^4.0.0"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/supports-preserve-symlinks-flag": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/supports-preserve-symlinks-flag/-/supports-preserve-symlinks-flag-1.0.0.tgz",
      "integrity": "sha512-ot0WnXS9fgdkgIcePe6RHNk1WA8+muPa6cSjeR3V8K27q9BB1rTE3R1p7Hv0z1ZyAc8s6Vvv8DIyWf681MAt0w==",
      "dev": true,
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/tar": {
      "version": "6.1.11",
      "resolved": "https://registry.npmjs.org/tar/-/tar-6.1.11.tgz",
      "integrity": "sha512-an/KZQzQUkZCkuoAA64hM92X0Urb6VpRhAFllDzz44U2mcD5scmT3zBc4VgVpkugF580+DQn8eAFSyoQt0tznA==",
      "dev": true,
      "dependencies": {
        "chownr": "^2.0.0",
        "fs-minipass": "^2.0.0",
        "minipass": "^3.0.0",
        "minizlib": "^2.1.1",
        "mkdirp": "^1.0.3",
        "yallist": "^4.0.0"
      },
      "engines": {
        "node": ">= 10"
      }
    },
    "node_modules/tar-fs": {
      "version": "2.1.1",
      "resolved": "https://registry.npmjs.org/tar-fs/-/tar-fs-2.1.1.tgz",
      "integrity": "sha512-V0r2Y9scmbDRLCNex/+hYzvp/zyYjvFbHPNgVTKfQvVrb6guiE/fxP+XblDNR011utopbkex2nM4dHNV6GDsng==",
      "dependencies": {
        "chownr": "^1.1.1",
        "mkdirp-classic": "^0.5.2",
        "pump": "^3.0.0",
        "tar-stream": "^2.1.4"
      }
    },
    "node_modules/tar-fs/node_modules/chownr": {
      "version": "1.1.4",
      "resolved": "https://registry.npmjs.org/chownr/-/chownr-1.1.4.tgz",
      "integrity": "sha512-jJ0bqzaylmJtVnNgzTeSOs8DPavpbYgEr/b0YL8/2GO3xJEhInFmhKMUnEJQjZumK7KXGFhUy89PrsJWlakBVg=="
    },
    "node_modules/tar-stream": {
      "version": "2.2.0",
      "resolved": "https://registry.npmjs.org/tar-stream/-/tar-stream-2.2.0.tgz",
      "integrity": "sha512-ujeqbceABgwMZxEJnk2HDY2DlnUZ+9oEcb1KzTVfYHio0UE6dG71n60d8D2I4qNvleWrrXpmjpt7vZeF1LnMZQ==",
      "dependencies": {
        "bl": "^4.0.3",
        "end-of-stream": "^1.4.1",
        "fs-constants": "^1.0.0",
        "inherits": "^2.0.3",
        "readable-stream": "^3.1.1"
      },
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/tar-stream/node_modules/readable-stream": {
      "version": "3.6.0",
      "resolved": "https://registry.npmjs.org/readable-stream/-/readable-stream-3.6.0.tgz",
      "integrity": "sha512-BViHy7LKeTz4oNnkcLJ+lVSL6vpiFeX6/d3oSH8zCW7UxP2onchk+vTGB143xuFjHS3deTgkKoXXymXqymiIdA==",
      "dependencies": {
        "inherits": "^2.0.3",
        "string_decoder": "^1.1.1",
        "util-deprecate": "^1.0.1"
      },
      "engines": {
        "node": ">= 6"
      }
    },
    "node_modules/tar/node_modules/mkdirp": {
      "version": "1.0.4",
      "resolved": "https://registry.npmjs.org/mkdirp/-/mkdirp-1.0.4.tgz",
      "integrity": "sha512-vVqVZQyf3WLx2Shd0qJ9xuvqgAyKPLAiqITEtqW0oIUjzo3PePDd6fW9iFz30ef7Ysp/oiWqbhszeGWW2T6Gzw==",
      "dev": true,
      "bin": {
        "mkdirp": "bin/cmd.js"
      },
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/temp": {
      "version": "0.9.4",
      "resolved": "https://registry.npmjs.org/temp/-/temp-0.9.4.tgz",
      "integrity": "sha512-yYrrsWnrXMcdsnu/7YMYAofM1ktpL5By7vZhf15CrXijWWrEYZks5AXBudalfSWJLlnen/QUJUB5aoB0kqZUGA==",
      "dev": true,
      "optional": true,
      "dependencies": {
        "mkdirp": "^0.5.1",
        "rimraf": "~2.6.2"
      },
      "engines": {
        "node": ">=6.0.0"
      }
    },
    "node_modules/temp/node_modules/rimraf": {
      "version": "2.6.3",
      "resolved": "https://registry.npmjs.org/rimraf/-/rimraf-2.6.3.tgz",
      "integrity": "sha512-mwqeW5XsA2qAejG46gYdENaxXjx9onRNCfn7L0duuP4hCuTIi/QO7PDK07KJfp1d+izWPrzEJDcSqBa0OZQriA==",
      "dev": true,
      "optional": true,
      "dependencies": {
        "glob": "^7.1.3"
      },
      "bin": {
        "rimraf": "bin.js"
      }
    },
    "node_modules/throttleit": {
      "version": "0.0.2",
      "resolved": "https://registry.npmjs.org/throttleit/-/throttleit-0.0.2.tgz",
      "integrity": "sha1-z+34jmDADdlpe2H90qg0OptoDq8=",
      "dev": true
    },
    "node_modules/through": {
      "version": "2.3.8",
      "resolved": "https://registry.npmjs.org/through/-/through-2.3.8.tgz",
      "integrity": "sha1-DdTJ/6q8NXlgsbckEV1+Doai4fU="
    },
    "node_modules/through2": {
      "version": "0.2.3",
      "resolved": "https://registry.npmjs.org/through2/-/through2-0.2.3.tgz",
      "integrity": "sha1-6zKE2k6jEbbMis42U3SKUqvyWj8=",
      "dev": true,
      "dependencies": {
        "readable-stream": "~1.1.9",
        "xtend": "~2.1.1"
      }
    },
    "node_modules/through2/node_modules/isarray": {
      "version": "0.0.1",
      "resolved": "https://registry.npmjs.org/isarray/-/isarray-0.0.1.tgz",
      "integrity": "sha1-ihis/Kmo9Bd+Cav8YDiTmwXR7t8=",
      "dev": true
    },
    "node_modules/through2/node_modules/readable-stream": {
      "version": "1.1.14",
      "resolved": "https://registry.npmjs.org/readable-stream/-/readable-stream-1.1.14.tgz",
      "integrity": "sha1-fPTFTvZI44EwhMY23SB54WbAgdk=",
      "dev": true,
      "dependencies": {
        "core-util-is": "~1.0.0",
        "inherits": "~2.0.1",
        "isarray": "0.0.1",
        "string_decoder": "~0.10.x"
      }
    },
    "node_modules/through2/node_modules/string_decoder": {
      "version": "0.10.31",
      "resolved": "https://registry.npmjs.org/string_decoder/-/string_decoder-0.10.31.tgz",
      "integrity": "sha1-YuIDvEF2bGwoyfyEMB2rHFMQ+pQ=",
      "dev": true
    },
    "node_modules/tmp": {
      "version": "0.0.33",
      "resolved": "https://registry.npmjs.org/tmp/-/tmp-0.0.33.tgz",
      "integrity": "sha512-jRCJlojKnZ3addtTOjdIqoRuPEKBvNXcGYqzO6zWZX8KfKEpnGY5jfggJQ3EjKuu8D4bJRr0y+cYJFmYbImXGw==",
      "dev": true,
      "dependencies": {
        "os-tmpdir": "~1.0.2"
      },
      "engines": {
        "node": ">=0.6.0"
      }
    },
    "node_modules/tmp-promise": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/tmp-promise/-/tmp-promise-1.1.0.tgz",
      "integrity": "sha512-8+Ah9aB1IRXCnIOxXZ0uFozV1nMU5xiu7hhFVUSxZ3bYu+psD4TzagCzVbexUCgNNGJnsmNDQlS4nG3mTyoNkw==",
      "dev": true,
      "optional": true,
      "dependencies": {
        "bluebird": "^3.5.0",
        "tmp": "0.1.0"
      }
    },
    "node_modules/tmp-promise/node_modules/rimraf": {
      "version": "2.7.1",
      "resolved": "https://registry.npmjs.org/rimraf/-/rimraf-2.7.1.tgz",
      "integrity": "sha512-uWjbaKIK3T1OSVptzX7Nl6PvQ3qAGtKEtVRjRuazjfL3Bx5eI409VZSqgND+4UNnmzLVdPj9FqFJNPqBZFve4w==",
      "dev": true,
      "optional": true,
      "dependencies": {
        "glob": "^7.1.3"
      },
      "bin": {
        "rimraf": "bin.js"
      }
    },
    "node_modules/tmp-promise/node_modules/tmp": {
      "version": "0.1.0",
      "resolved": "https://registry.npmjs.org/tmp/-/tmp-0.1.0.tgz",
      "integrity": "sha512-J7Z2K08jbGcdA1kkQpJSqLF6T0tdQqpR2pnSUXsIchbPdTI9v3e85cLW0d6WDhwuAleOV71j2xWs8qMPfK7nKw==",
      "dev": true,
      "optional": true,
      "dependencies": {
        "rimraf": "^2.6.3"
      },
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/to-readable-stream": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/to-readable-stream/-/to-readable-stream-1.0.0.tgz",
      "integrity": "sha512-Iq25XBt6zD5npPhlLVXGFN3/gyR2/qODcKNNyTMd4vbm39HUaOiAM4PMq0eMVC/Tkxz+Zjdsc55g9yyz+Yq00Q==",
      "dev": true,
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/to-regex-range": {
      "version": "5.0.1",
      "resolved": "https://registry.npmjs.org/to-regex-range/-/to-regex-range-5.0.1.tgz",
      "integrity": "sha512-65P7iz6X5yEr1cwcgvQxbbIw7Uk3gOy5dIdtZ4rDveLqhrdJP+Li/Hx6tyK0NEb+2GCyneCMJiGqrADCSNk8sQ==",
      "dev": true,
      "dependencies": {
        "is-number": "^7.0.0"
      },
      "engines": {
        "node": ">=8.0"
      }
    },
    "node_modules/tough-cookie": {
      "version": "2.5.0",
      "resolved": "https://registry.npmjs.org/tough-cookie/-/tough-cookie-2.5.0.tgz",
      "integrity": "sha512-nlLsUzgm1kfLXSXfRZMc1KLAugd4hqJHDTvc2hDIwS3mZAfMEuMbc03SujMF+GEcpaX/qboeycw6iO8JwVv2+g==",
      "dev": true,
      "dependencies": {
        "psl": "^1.1.28",
        "punycode": "^2.1.1"
      },
      "engines": {
        "node": ">=0.8"
      }
    },
    "node_modules/tr46": {
      "version": "0.0.3",
      "resolved": "https://registry.npmjs.org/tr46/-/tr46-0.0.3.tgz",
      "integrity": "sha1-gYT9NH2snNwYWZLzpmIuFLnZq2o="
    },
    "node_modules/trim-newlines": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/trim-newlines/-/trim-newlines-1.0.0.tgz",
      "integrity": "sha1-WIeWa7WCpFA6QetST301ARgVphM=",
      "dev": true,
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/trim-repeated": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/trim-repeated/-/trim-repeated-1.0.0.tgz",
      "integrity": "sha1-42RqLqTokTEr9+rObPsFOAvAHCE=",
      "dev": true,
      "dependencies": {
        "escape-string-regexp": "^1.0.2"
      },
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/trim-repeated/node_modules/escape-string-regexp": {
      "version": "1.0.5",
      "resolved": "https://registry.npmjs.org/escape-string-regexp/-/escape-string-regexp-1.0.5.tgz",
      "integrity": "sha1-G2HAViGQqN/2rjuyzwIAyhMLhtQ=",
      "dev": true,
      "engines": {
        "node": ">=0.8.0"
      }
    },
    "node_modules/tslib": {
      "version": "2.3.1",
      "resolved": "https://registry.npmjs.org/tslib/-/tslib-2.3.1.tgz",
      "integrity": "sha512-77EbyPPpMz+FRFRuAFlWMtmgUWGe9UOG2Z25NqCwiIjRhOf5iKGuzSe5P2w1laq+FkRy4p+PCuVkJSGkzTEKVw==",
      "dev": true
    },
    "node_modules/tunnel": {
      "version": "0.0.6",
      "resolved": "https://registry.npmjs.org/tunnel/-/tunnel-0.0.6.tgz",
      "integrity": "sha512-1h/Lnq9yajKY2PEbBadPXj3VxsDDu844OnaAo52UVmIzIvwwtBPIuNvkjuzBlTWpfJyUbG3ez0KSBibQkj4ojg==",
      "dev": true,
      "optional": true,
      "engines": {
        "node": ">=0.6.11 <=0.7.0 || >=0.7.3"
      }
    },
    "node_modules/tunnel-agent": {
      "version": "0.6.0",
      "resolved": "https://registry.npmjs.org/tunnel-agent/-/tunnel-agent-0.6.0.tgz",
      "integrity": "sha1-J6XeoGs2sEoKmWZ3SykIaPD8QP0=",
      "dev": true,
      "dependencies": {
        "safe-buffer": "^5.0.1"
      },
      "engines": {
        "node": "*"
      }
    },
    "node_modules/tweetnacl": {
      "version": "0.14.5",
      "resolved": "https://registry.npmjs.org/tweetnacl/-/tweetnacl-0.14.5.tgz",
      "integrity": "sha1-WuaBd/GS1EViadEIr6k/+HQ/T2Q=",
      "dev": true
    },
    "node_modules/type-fest": {
      "version": "0.13.1",
      "resolved": "https://registry.npmjs.org/type-fest/-/type-fest-0.13.1.tgz",
      "integrity": "sha512-34R7HTnG0XIJcBSn5XhDd7nNFPRcXYRZrBB2O2jdKqYODldSzBAqzsWoZYYvduky73toYS/ESqxPvkDf/F0XMg==",
      "dev": true,
      "optional": true,
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/typedarray": {
      "version": "0.0.6",
      "resolved": "https://registry.npmjs.org/typedarray/-/typedarray-0.0.6.tgz",
      "integrity": "sha1-hnrHTjhkGHsdPUfZlqeOxciDB3c=",
      "dev": true
    },
    "node_modules/unbzip2-stream": {
      "version": "1.4.3",
      "resolved": "https://registry.npmjs.org/unbzip2-stream/-/unbzip2-stream-1.4.3.tgz",
      "integrity": "sha512-mlExGW4w71ebDJviH16lQLtZS32VKqsSfk80GCfUlwT/4/hNRFsoscrF/c++9xinkMzECL1uL9DDwXqFWkruPg==",
      "dependencies": {
        "buffer": "^5.2.1",
        "through": "^2.3.8"
      }
    },
    "node_modules/unique-filename": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/unique-filename/-/unique-filename-1.1.1.tgz",
      "integrity": "sha512-Vmp0jIp2ln35UTXuryvjzkjGdRyf9b2lTXuSYUiPmzRcl3FDtYqAwOnTJkAngD9SWhnoJzDbTKwaOrZ+STtxNQ==",
      "dev": true,
      "dependencies": {
        "unique-slug": "^2.0.0"
      }
    },
    "node_modules/unique-slug": {
      "version": "2.0.2",
      "resolved": "https://registry.npmjs.org/unique-slug/-/unique-slug-2.0.2.tgz",
      "integrity": "sha512-zoWr9ObaxALD3DOPfjPSqxt4fnZiWblxHIgeWqW8x7UqDzEtHEQLzji2cuJYQFCU6KmoJikOYAZlrTHHebjx2w==",
      "dev": true,
      "dependencies": {
        "imurmurhash": "^0.1.4"
      }
    },
    "node_modules/universalify": {
      "version": "0.1.2",
      "resolved": "https://registry.npmjs.org/universalify/-/universalify-0.1.2.tgz",
      "integrity": "sha512-rBJeI5CXAlmy1pV+617WB9J63U6XcazHHF2f2dbJix4XzpUF0RS3Zbj0FGIOCAva5P/d/GBOYaACQ1w+0azUkg==",
      "dev": true,
      "engines": {
        "node": ">= 4.0.0"
      }
    },
    "node_modules/uri-js": {
      "version": "4.4.1",
      "resolved": "https://registry.npmjs.org/uri-js/-/uri-js-4.4.1.tgz",
      "integrity": "sha512-7rKUyy33Q1yc98pQ1DAmLtwX109F7TIfWlW1Ydo8Wl1ii1SeHieeh0HHfPeL2fMXK6z0s8ecKs9frCuLJvndBg==",
      "dev": true,
      "dependencies": {
        "punycode": "^2.1.0"
      }
    },
    "node_modules/url-parse-lax": {
      "version": "3.0.0",
      "resolved": "https://registry.npmjs.org/url-parse-lax/-/url-parse-lax-3.0.0.tgz",
      "integrity": "sha1-FrXK/Afb42dsGxmZF3gj1lA6yww=",
      "dev": true,
      "dependencies": {
        "prepend-http": "^2.0.0"
      },
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/username": {
      "version": "5.1.0",
      "resolved": "https://registry.npmjs.org/username/-/username-5.1.0.tgz",
      "integrity": "sha512-PCKbdWw85JsYMvmCv5GH3kXmM66rCd9m1hBEDutPNv94b/pqCMT4NtcKyeWYvLFiE8b+ha1Jdl8XAaUdPn5QTg==",
      "dev": true,
      "dependencies": {
        "execa": "^1.0.0",
        "mem": "^4.3.0"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/util-deprecate": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/util-deprecate/-/util-deprecate-1.0.2.tgz",
      "integrity": "sha1-RQ1Nyfpw3nMnYvvS1KKJgUGaDM8="
    },
    "node_modules/uuid": {
      "version": "3.4.0",
      "resolved": "https://registry.npmjs.org/uuid/-/uuid-3.4.0.tgz",
      "integrity": "sha512-HjSDRw6gZE5JMggctHBcjVak08+KEVhSIiDzFnT9S9aegmp85S/bReBVTb4QTFaRNptJ9kuYaNhnbNEOkbKb/A==",
      "deprecated": "Please upgrade  to version 7 or higher.  Older versions may use Math.random() in certain circumstances, which is known to be problematic.  See https://v8.dev/blog/math-random for details.",
      "dev": true,
      "bin": {
        "uuid": "bin/uuid"
      }
    },
    "node_modules/validate-npm-package-license": {
      "version": "3.0.4",
      "resolved": "https://registry.npmjs.org/validate-npm-package-license/-/validate-npm-package-license-3.0.4.tgz",
      "integrity": "sha512-DpKm2Ui/xN7/HQKCtpZxoRWBhZ9Z0kqtygG8XCgNQ8ZlDnxuQmWhj566j8fN4Cu3/JmbhsDo7fcAJq4s9h27Ew==",
      "dev": true,
      "dependencies": {
        "spdx-correct": "^3.0.0",
        "spdx-expression-parse": "^3.0.0"
      }
    },
    "node_modules/verror": {
      "version": "1.10.0",
      "resolved": "https://registry.npmjs.org/verror/-/verror-1.10.0.tgz",
      "integrity": "sha1-OhBcoXBTr1XW4nDB+CiGguGNpAA=",
      "dev": true,
      "engines": [
        "node >=0.6.0"
      ],
      "dependencies": {
        "assert-plus": "^1.0.0",
        "core-util-is": "1.0.2",
        "extsprintf": "^1.2.0"
      }
    },
    "node_modules/verror/node_modules/core-util-is": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/core-util-is/-/core-util-is-1.0.2.tgz",
      "integrity": "sha1-tf1UIgqivFq1eqtxQMlAdUUDwac=",
      "dev": true
    },
    "node_modules/wcwidth": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/wcwidth/-/wcwidth-1.0.1.tgz",
      "integrity": "sha1-8LDc+RW8X/FSivrbLA4XtTLaL+g=",
      "dev": true,
      "dependencies": {
        "defaults": "^1.0.3"
      }
    },
    "node_modules/webidl-conversions": {
      "version": "3.0.1",
      "resolved": "https://registry.npmjs.org/webidl-conversions/-/webidl-conversions-3.0.1.tgz",
      "integrity": "sha1-JFNCdeKnvGvnvIZhHMFq4KVlSHE="
    },
    "node_modules/whatwg-url": {
      "version": "5.0.0",
      "resolved": "https://registry.npmjs.org/whatwg-url/-/whatwg-url-5.0.0.tgz",
      "integrity": "sha1-lmRU6HZUYuN2RNNib2dCzotwll0=",
      "dependencies": {
        "tr46": "~0.0.3",
        "webidl-conversions": "^3.0.0"
      }
    },
    "node_modules/which": {
      "version": "2.0.2",
      "resolved": "https://registry.npmjs.org/which/-/which-2.0.2.tgz",
      "integrity": "sha512-BLI3Tl1TW3Pvl70l3yq3Y64i+awpwXqsGBYWkkqMtnbXgrMD+yj7rhW0kuEDxzJaYXGjEW5ogapKNMEKNMjibA==",
      "dev": true,
      "dependencies": {
        "isexe": "^2.0.0"
      },
      "bin": {
        "node-which": "bin/node-which"
      },
      "engines": {
        "node": ">= 8"
      }
    },
    "node_modules/wide-align": {
      "version": "1.1.5",
      "resolved": "https://registry.npmjs.org/wide-align/-/wide-align-1.1.5.tgz",
      "integrity": "sha512-eDMORYaPNZ4sQIuuYPDHdQvf4gyCF9rEEV/yPxGfwPkRodwEgiMUUXTx/dex+Me0wxx53S+NgUHaP7y3MGlDmg==",
      "dev": true,
      "dependencies": {
        "string-width": "^1.0.2 || 2 || 3 || 4"
      }
    },
    "node_modules/word-wrap": {
      "version": "1.2.3",
      "resolved": "https://registry.npmjs.org/word-wrap/-/word-wrap-1.2.3.tgz",
      "integrity": "sha512-Hz/mrNwitNRh/HUAtM/VT/5VH+ygD6DV7mYKZAtHOrbs8U7lvPS6xf7EJKMF0uW1KJCl0H701g3ZGus+muE5vQ==",
      "dev": true,
      "optional": true,
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/wrap-ansi": {
      "version": "7.0.0",
      "resolved": "https://registry.npmjs.org/wrap-ansi/-/wrap-ansi-7.0.0.tgz",
      "integrity": "sha512-YVGIj2kamLSTxw6NsZjoBxfSwsn0ycdesmc4p+Q21c5zPuZ1pl+NfxVdxPtdHvmNVOQ6XSYG4AUtyt/Fi7D16Q==",
      "dev": true,
      "dependencies": {
        "ansi-styles": "^4.0.0",
        "string-width": "^4.1.0",
        "strip-ansi": "^6.0.0"
      },
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/chalk/wrap-ansi?sponsor=1"
      }
    },
    "node_modules/wrappy": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/wrappy/-/wrappy-1.0.2.tgz",
      "integrity": "sha1-tSQ9jz7BqjXxNkYFvA0QNuMKtp8="
    },
    "node_modules/ws": {
      "version": "8.2.3",
      "resolved": "https://registry.npmjs.org/ws/-/ws-8.2.3.tgz",
      "integrity": "sha512-wBuoj1BDpC6ZQ1B7DWQBYVLphPWkm8i9Y0/3YdHjHKHiohOJ1ws+3OccDWtH+PoC9DZD5WOTrJvNbWvjS6JWaA==",
      "engines": {
        "node": ">=10.0.0"
      },
      "peerDependencies": {
        "bufferutil": "^4.0.1",
        "utf-8-validate": "^5.0.2"
      },
      "peerDependenciesMeta": {
        "bufferutil": {
          "optional": true
        },
        "utf-8-validate": {
          "optional": true
        }
      }
    },
    "node_modules/xmlbuilder": {
      "version": "9.0.7",
      "resolved": "https://registry.npmjs.org/xmlbuilder/-/xmlbuilder-9.0.7.tgz",
      "integrity": "sha1-Ey7mPS7FVlxVfiD0wi35rKaGsQ0=",
      "dev": true,
      "engines": {
        "node": ">=4.0"
      }
    },
    "node_modules/xtend": {
      "version": "2.1.2",
      "resolved": "https://registry.npmjs.org/xtend/-/xtend-2.1.2.tgz",
      "integrity": "sha1-bv7MKk2tjmlixJAbM3znuoe10os=",
      "dev": true,
      "dependencies": {
        "object-keys": "~0.4.0"
      },
      "engines": {
        "node": ">=0.4"
      }
    },
    "node_modules/xtend/node_modules/object-keys": {
      "version": "0.4.0",
      "resolved": "https://registry.npmjs.org/object-keys/-/object-keys-0.4.0.tgz",
      "integrity": "sha1-KKaq50KN0sOpLz2V8hM13SBOAzY=",
      "dev": true
    },
    "node_modules/y18n": {
      "version": "5.0.8",
      "resolved": "https://registry.npmjs.org/y18n/-/y18n-5.0.8.tgz",
      "integrity": "sha512-0pfFzegeDWJHJIAmTLRP2DwHjdF5s7jo9tuztdQxAhINCdvS+3nGINqPd00AphqJR/0LhANUS6/+7SCb98YOfA==",
      "dev": true,
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/yallist": {
      "version": "4.0.0",
      "resolved": "https://registry.npmjs.org/yallist/-/yallist-4.0.0.tgz",
      "integrity": "sha512-3wdGidZyq5PB084XLES5TpOSRA3wjXAlIWMhum2kRcv/41Sn2emQ0dycQW4uZXLejwKvg6EsvbdlVL+FYEct7A==",
      "dev": true
    },
    "node_modules/yargs": {
      "version": "17.3.1",
      "resolved": "https://registry.npmjs.org/yargs/-/yargs-17.3.1.tgz",
      "integrity": "sha512-WUANQeVgjLbNsEmGk20f+nlHgOqzRFpiGWVaBrYGYIGANIIu3lWjoyi0fNlFmJkvfhCZ6BXINe7/W2O2bV4iaA==",
      "dev": true,
      "dependencies": {
        "cliui": "^7.0.2",
        "escalade": "^3.1.1",
        "get-caller-file": "^2.0.5",
        "require-directory": "^2.1.1",
        "string-width": "^4.2.3",
        "y18n": "^5.0.5",
        "yargs-parser": "^21.0.0"
      },
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/yargs-parser": {
      "version": "20.2.9",
      "resolved": "https://registry.npmjs.org/yargs-parser/-/yargs-parser-20.2.9.tgz",
      "integrity": "sha512-y11nGElTIV+CT3Zv9t7VKl+Q3hTQoT9a1Qzezhhl6Rp21gJ/IVTW7Z3y9EWXhuUBC2Shnf+DX0antecpAwSP8w==",
      "dev": true,
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/yargs/node_modules/yargs-parser": {
      "version": "21.0.0",
      "resolved": "https://registry.npmjs.org/yargs-parser/-/yargs-parser-21.0.0.tgz",
      "integrity": "sha512-z9kApYUOCwoeZ78rfRYYWdiU/iNL6mwwYlkkZfJoyMR1xps+NEBX5X7XmRpxkZHhXJ6+Ey00IwKxBBSW9FIjyA==",
      "dev": true,
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/yarn-or-npm": {
      "version": "3.0.1",
      "resolved": "https://registry.npmjs.org/yarn-or-npm/-/yarn-or-npm-3.0.1.tgz",
      "integrity": "sha512-fTiQP6WbDAh5QZAVdbMQkecZoahnbOjClTQhzv74WX5h2Uaidj1isf9FDes11TKtsZ0/ZVfZsqZ+O3x6aLERHQ==",
      "dev": true,
      "dependencies": {
        "cross-spawn": "^6.0.5",
        "pkg-dir": "^4.2.0"
      },
      "bin": {
        "yarn-or-npm": "bin/index.js",
        "yon": "bin/index.js"
      },
      "engines": {
        "node": ">=8.6.0"
      }
    },
    "node_modules/yarn-or-npm/node_modules/cross-spawn": {
      "version": "6.0.5",
      "resolved": "https://registry.npmjs.org/cross-spawn/-/cross-spawn-6.0.5.tgz",
      "integrity": "sha512-eTVLrBSt7fjbDygz805pMnstIs2VTBNkRm0qxZd+M7A5XDdxVRWO5MxGBXZhjY4cqLYLdtrGqRf8mBPmzwSpWQ==",
      "dev": true,
      "dependencies": {
        "nice-try": "^1.0.4",
        "path-key": "^2.0.1",
        "semver": "^5.5.0",
        "shebang-command": "^1.2.0",
        "which": "^1.2.9"
      },
      "engines": {
        "node": ">=4.8"
      }
    },
    "node_modules/yarn-or-npm/node_modules/path-key": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/path-key/-/path-key-2.0.1.tgz",
      "integrity": "sha1-QRyttXTFoUDTpLGRDUDYDMn0C0A=",
      "dev": true,
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/yarn-or-npm/node_modules/semver": {
      "version": "5.7.1",
      "resolved": "https://registry.npmjs.org/semver/-/semver-5.7.1.tgz",
      "integrity": "sha512-sauaDf/PZdVgrLTNYHRtpXa1iRiKcaebiKQ1BJdpQlWH2lCvexQdX55snPFyK7QzpudqbCI0qXFfOasHdyNDGQ==",
      "dev": true,
      "bin": {
        "semver": "bin/semver"
      }
    },
    "node_modules/yarn-or-npm/node_modules/shebang-command": {
      "version": "1.2.0",
      "resolved": "https://registry.npmjs.org/shebang-command/-/shebang-command-1.2.0.tgz",
      "integrity": "sha1-RKrGW2lbAzmJaMOfNj/uXer98eo=",
      "dev": true,
      "dependencies": {
        "shebang-regex": "^1.0.0"
      },
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/yarn-or-npm/node_modules/shebang-regex": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/shebang-regex/-/shebang-regex-1.0.0.tgz",
      "integrity": "sha1-2kL0l0DAtC2yypcoVxyxkMmO/qM=",
      "dev": true,
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/yarn-or-npm/node_modules/which": {
      "version": "1.3.1",
      "resolved": "https://registry.npmjs.org/which/-/which-1.3.1.tgz",
      "integrity": "sha512-HxJdYWq1MTIQbJ3nw0cqssHoTNU267KlrDuGZ1WYlxDStUtKUhOaJmh112/TZmHxxUfuJqPXSOm7tDyas0OSIQ==",
      "dev": true,
      "dependencies": {
        "isexe": "^2.0.0"
      },
      "bin": {
        "which": "bin/which"
      }
    },
    "node_modules/yauzl": {
      "version": "2.10.0",
      "resolved": "https://registry.npmjs.org/yauzl/-/yauzl-2.10.0.tgz",
      "integrity": "sha1-x+sXyT4RLLEIb6bY5R+wZnt5pfk=",
      "dependencies": {
        "buffer-crc32": "~0.2.3",
        "fd-slicer": "~1.1.0"
      }
    },
    "node_modules/yocto-queue": {
      "version": "0.1.0",
      "resolved": "https://registry.npmjs.org/yocto-queue/-/yocto-queue-0.1.0.tgz",
      "integrity": "sha512-rVksvsnNCdJ/ohGc6xgPwyN8eheCxsiLM8mxuE/t/mOVqJewPuO1miLpTHQiRgTKCLexL4MeAFVagts7HmNZ2Q==",
      "dev": true,
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    }
  }
}


//const infoContainer = document.getElementById("YAYEET");
