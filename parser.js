/** 
 * Parsing JUnit report (target/surefire-reports/*.xml)
 */

"use strict";

const fs = require("fs");
const globby = require("globby");
const path = require("path");
const archiver = require("archiver");
const os = require("os");
var tabletojson = require('tabletojson');

const MAX_LOG_FILE = 5;
const timestamp = new Date();

let packageJson = require("./package.json");
// delete folder  recursively
function deleteFolderSync(folderPath) {
  if (fs.existsSync(folderPath)) {
    fs.readdirSync(folderPath).forEach(function (file, index) {
      var curPath = folderPath + "/" + file;
      if (fs.lstatSync(curPath).isDirectory()) {
        deleteFolderSync(curPath);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(folderPath);
  }
};

function zipFolder(folderPath, filePattern, outputFilePath) {
  return new Promise(function (resolve, reject) {
    var output = fs.createWriteStream(outputFilePath);
    var zipArchive = archiver('zip');

    output.on('close', function () {
      console.log(zipArchive.pointer() + ' total bytes');
      console.log('archiver has been finalized and the output file descriptor has closed.');
      resolve(undefined);
    });

    output.on('end', function () {
      console.log('Data has been drained');
      resolve(undefined);
    });

    zipArchive.on('warning', function (err) {
      if (err.code === 'ENOENT') {
        // log warning
      } else {
        reject(err);
      }
    });

    zipArchive.on('error', function (err) {
      reject(err);
    });

    // pipe archive data to the file
    zipArchive.pipe(output);

    zipArchive.glob(filePattern, {
      cwd: folderPath
    });
    zipArchive.finalize(function (err, bytes) {
      if (err) {
        reject(err);
      }
    });
  })

}

function buildTestResultByMethodName(obj) {
  //if (!obj || !obj.$ || !obj.$.name) {
 /* if (!obj || !obj.$) {
    return undefined;
  }*/
  //let name = obj.$.classname ? `${obj.$.classname}#${obj.$.name}` : obj.$.name;
  let exe_start_date = new Date(timestamp);
  let exe_end_date = new Date(timestamp);
  //exe_end_date.setSeconds(exe_start_date.getSeconds() + (parseInt(obj.$.time || 0, 10)));
  let name = obj[0][0]["Test Case"]
  let Status1  = obj[0][0]["Status"]
  let status = (undefined != Status1) ? "SKIP" : (Status1=="Fail") ? "FAIL" : "PASS";

 // let status = (undefined != obj.skipped) ? "SKIP" : obj.failure ? "FAIL" : "PASS";
  let testCase = {
    status: status,
    name: name,
    attachments: [],
    exe_start_date: exe_start_date.toISOString(),
    exe_end_date: exe_end_date.toISOString(),
    automation_content: name,
    test_step_logs: [{
      order: 0,
      status: status,
      description: "",
      expected_result: ""
    }]
  };
 /* if (obj.failure) {
    let failedMsg = obj.failure._ || obj.failure.$.message || JSON.stringify(obj.failure, null, 4);
    testCase.attachments.push({
      name: `${obj.$.name}.txt`,
      data: Buffer.from(failedMsg).toString("base64"),
      content_type: "text/plain"
    });
  }*/
  return testCase;
}

function parseFile(fileName) {
  return new Promise((resolve, reject) => {
    //let jsonString = fs.readFileSync(path.resolve(__dirname, '../sample-junit-results/test/Results1.html'), {encoding: 'UTF-8'});
    let html = fs.readFileSync(path.resolve(__dirname, fileName), {encoding: 'UTF-8'});
    //const jsonString = tabletojson.convert(html);
    resolve(tabletojson.convert(html), {
      preserveChildrenOrder: true,
      explicitArray: false,
      explicitChildren: false
    });
  })
}



  /*, function (err, result) {

  });
}
*/


async function parse(pathToTestResult, options) {
  console.log(` == Parser name: ${packageJson.name}, version ${packageJson.version} ==`);
  console.log("Path to test result: " + pathToTestResult);
  let resultFiles = [];
  if(-1 !== pathToTestResult.indexOf("*")) {
    resultFiles = globby.sync(pathToTestResult);
  } else if (fs.statSync(pathToTestResult).isFile()) {
    resultFiles.push(pathToTestResult);
  } else if (fs.statSync(pathToTestResult).isDirectory()) {
    let pattern = undefined;
    pathToTestResult = pathToTestResult.replace(/\\/g, "/");
    if (pathToTestResult[pathToTestResult.length - 1] === '/') {
    //  pattern = pathToTestResult + "**/*.xml";
      pattern = pathToTestResult + "**/*.html";
    } else {
      //pattern = pathToTestResult + "/**/*.xml";
      pattern = pathToTestResult + "/**/*.html";
    }
    resultFiles = globby.sync(pattern);
  }
  
  if (0 === resultFiles.length) {
    throw new Error(`Could not find any result log-file(s) in: ' + ${pathToTestResult}`);
  }

  let resultMap = new Map();
  let order = 1;
  for (let file of resultFiles) {
    console.log(`Parsing ${file} ...`);
    let parseFileResult = undefined;
    try {
      parseFileResult = await parseFile(file);
    } catch (error) {
      console.error(`Could not parse ${file}`, error);
      continue;
    }
    //parseFileResult = JSON.parse(parseFileResult);
    console.log(JSON.stringify(parseFileResult, null, 4));
    //buildTestResultByMethodName(parseFileResult);

    let tcObj = buildTestResultByMethodName(parseFileResult);
    if (tcObj && !resultMap.has(tcObj.automation_content)) {
      tcObj.order = order++;
      resultMap.set(tcObj.automation_content, tcObj);
    }
    console.log(`Finish parsing ${file}`);

    return (Array.from(resultMap.values()));
  }
};

module.exports = {
  parse: parse
};