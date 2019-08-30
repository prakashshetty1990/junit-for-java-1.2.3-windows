const parser = require("../parser.js");

(async () => {
  try {
    console.log(`Parse JUnit report - test case name as method name`);
    let result = await parser.parse("./tests/sample-junit-results/", { useClassNameAsTestCaseName: false });
    console.log(JSON.stringify(result, null, 4));

  //  result = await parser.parse("./tests/sample-junit-results/TEST*.xml", { useClassNameAsTestCaseName: false });
  //  console.log(JSON.stringify(result, null, 4));

    // result = await parser.parse("./tests/**/*.xml", { useClassNameAsTestCaseName: false });
    // console.log(JSON.stringify(result, null, 4));

  //  result = await parser.parse("./tests/**/sample-junit-results/*runner*.xml", { useClassNameAsTestCaseName: false });
  //  console.log(JSON.stringify(result, null, 4));

    // console.log(`Parse JUnit report - test case name as class name`);
    // result = await parser.parse("./tests/sample-junit-results/", { useClassNameAsTestCaseName: true });
    // console.log(JSON.stringify(result, null, 4));

    // console.log(`Parse JUnit report - test case name as method name`);
    // result = await parser.parse("./tests/sample-junit-results/TEST-sample.junit.CalculateTest.xml", { useClassNameAsTestCaseName: false });
    // console.log(JSON.stringify(result, null, 4));

    // console.log(`Parse JUnit report - test case name as class name`);
    // result = await parser.parse("./tests/sample-junit-results/TEST-sample.junit.CalculateTest.xml", { useClassNameAsTestCaseName: false });
    // console.log(JSON.stringify(result, null, 4));
  } catch (ex) {
    console.error(ex);
  }
})();