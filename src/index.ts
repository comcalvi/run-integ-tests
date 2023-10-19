import * as https from 'https';
import * as core from '@actions/core';
//import * as github from '@actions/github';


const RUN_TEST_SUITE_ENDPOINT = 'https://hmc71to6j7.execute-api.us-east-1.amazonaws.com/prod/';

async function run() {
  const prNumber: string = core.getInput('prNumber', { required: true });
  const commitSha: string = core.getInput('commitSha', { required: true });

  await runTestSuite(prNumber, commitSha);

  await getTestSuiteStatus(prNumber, commitSha);

  await deleteTestSuite(prNumber, commitSha);
}

run().catch(error => {
  core.setFailed(error.message);
});

/**
 * runs a test suite. Will block until the test suite has been started
 */
async function runTestSuite(prNumber: string, commitSha: string) {
  const req = https.request({
    host: RUN_TEST_SUITE_ENDPOINT,
    method: 'POST',
  }, (response) => {
    console.log(response);
  });

  req.write(JSON.stringify({
    prNumber,
    commitSha,
  }));

  req.end();
}

/**
 * gets the status of a test suite. Will block until the test suite's results are all non-PENDING
 */
async function getTestSuiteStatus(_prNumber: string, _commitSha: string) {

}

/**
 * deletes a test suite. Will block until the test suite is gone.
 */
async function deleteTestSuite(_prNumber: string, _commitSha: string) {

}
/**
 * sleeps for `ms` miliseconds
 */
/*
async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
*/
