//import { execSync } from 'child_process';
import * as https from 'https';
import * as core from '@actions/core';

//import * as github from '@actions/github';

enum Endpoint {
  RunTestSuite = '0bjlcakvw7.execute-api.us-east-1.amazonaws.com',
  GetTestSuiteStatus = 'afvkrm47p7.execute-api.us-east-1.amazonaws.com',
  DeleteTestSuite = '3brt2r46mh.execute-api.us-east-1.amazonaws.com',
}

async function run() {
  //const prNumber: string = core.getInput('pr-number', { required: true });
  //const commitSha: string = core.getInput('commit-sha', { required: true });

  const prNumber = '0';
  const commitSha = 'aws-cdk.zip';

  const runTestSuiteResopnse = await runTestSuite(prNumber, commitSha);

  console.log(runTestSuiteResopnse);

  const getTestSuiteResponse = await getTestSuiteStatus(prNumber, commitSha);

  console.log(getTestSuiteResponse);

  await deleteTestSuite(prNumber, commitSha);
}

run().catch(error => {
  core.setFailed(error.message);
});

/**
 * runs a test suite. Will block until the test suite has been started
 */
async function runTestSuite(prNumber: string, commitSha: string): Promise<string> {
  return request(prNumber, commitSha, Endpoint.RunTestSuite);
}

/**
 * gets the status of a test suite. Will block until the test suite's results are all non-PENDING
 */
async function getTestSuiteStatus(prNumber: string, commitSha: string): Promise<string> {
  return request(prNumber, commitSha, Endpoint.GetTestSuiteStatus);
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

async function request(prNumber: string, commitSha: string, endpoint: Endpoint): Promise<string> {
  return new Promise((resolve) => {
    let body = '';
    const req = https.request({
      host: endpoint,
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
        resolve(body);
      });
    });

    req.write(JSON.stringify({
      prNumber,
      commitSha,
    }));

    req.end();
  });
}
