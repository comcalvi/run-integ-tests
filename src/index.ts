//import { execSync } from 'child_process';
import * as https from 'https';
import * as core from '@actions/core';

//import * as github from '@actions/github';


const RUN_TEST_SUITE_ENDPOINT = 'hmc71to6j7.execute-api.us-east-1.amazonaws.com';

async function run() {
  //const prNumber: string = core.getInput('pr-number', { required: true });
  //const commitSha: string = core.getInput('commit-sha', { required: true });

  const prNumber = '0';
  const commitSha = 'aws-cdk.zip';

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
  let body = '';

  const req = https.request({
    host: RUN_TEST_SUITE_ENDPOINT,
    method: 'POST',
    path: '/prod',
    headers: {
      'Content-Type': 'application/json',
    },
  }, (response) => {
    response.on('data', (chunk) => {
      body += chunk;
    });

    response.on('end', () => {
      console.log(body);
    });
  });

  req.write(JSON.stringify({
    prNumber,
    commitSha,
  }));

  req.end();

  //execSync(`curl https://hmc71to6j7.execute-api.us-east-1.amazonaws.com/prod/ --data-raw '{"prNumber": ${prNumber}, "commitSha": ${commitSha} }'`, {
  //  stdio: 'inherit',
  //});
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
