//import { execSync } from 'child_process';
import * as https from 'https';
import * as core from '@actions/core';

//import * as github from '@actions/github';

enum Endpoint {
  RunTestSuite = '0bjlcakvw7.execute-api.us-east-1.amazonaws.com',
  GetTestSuiteStatus = 'afvkrm47p7.execute-api.us-east-1.amazonaws.com',
  DeleteTestSuite = '3brt2r46mh.execute-api.us-east-1.amazonaws.com',
}

interface HandlerResult {
  statusCode: HandlerStatusCode;
  headers: any;
  body: string;
}

enum HandlerStatusCode {
  SUCCESS = 200,
  FAIL = 500,
}

enum TestStatus {
  /**
   * The test has succeeded
   */
  PASSED = 'passed',

  /**
   * The test has failed
   */
  FAILED = 'failed',

  /**
   * The test has not finished executing yet
   */
  PENDING = 'pending',
}

interface TestResult {
  /**
   * The name of the CDK integration test being executed
   */
  readonly testName: string;

  /**
   * Whether the test has passed, failed, or is in progress
   */
  readonly status: TestStatus;

  /**
   * If the test has failed, this field will be populated
   */
  readonly error?: string;
}

interface SessionEntry extends TestResult {
  /**
   * The PR which is being tested
   */
  readonly prNumber: number;

  /**
   * The commit SHA of the PR being tested (there may be multiple Sessions of the same PR, but with different SHAs)
   */
  readonly commitSha: string;
}

async function run() {
  //let prNumber: string = core.getInput('pr-number', { required: true });
  //let commitSha: string = core.getInput('commit-sha', { required: true });

  let prNumber = '0';
  let commitSha = 'aws-cdk.zip';

  await runTestSuite(prNumber, commitSha);

  let testResults = await getTestResults(prNumber, commitSha);

  console.log(testResults);

  await deleteTestSuite(prNumber, commitSha);

  if (testsFailed(testResults)) {
    throw new Error('some tests failed!');
  }
}

run().then().catch(error => {
  core.setFailed(error.message);
});

/**
 * runs a test suite. Will block until the test suite has been started
 */
async function runTestSuite(prNumber: string, commitSha: string): Promise<void> {
  const runTestSuiteResponse = await request(prNumber, commitSha, Endpoint.RunTestSuite);

  if (runTestSuiteResponse.statusCode === HandlerStatusCode.FAIL) {
    throw new Error(`RunTestSuiteHandler failed! Response: ${runTestSuiteResponse}`);
  }

  console.log(`successfully submitted test suite: '${prNumber}' and commitSha '${commitSha}' for execution`);
}

function testsFailed(testResults: TestResult[]): boolean {
  let failedTest = false;
  for (const result of testResults) {
    if (result.status === TestStatus.FAILED) {
      failedTest = true;
    }
  }

  return failedTest;
}

/**
 * gets the status of a test suite. Will block until the test suite's results are all non-PENDING
 */
async function getTestResults(prNumber: string, commitSha: string): Promise<TestResult[]> {
  let getTestSuiteStatusResponse = undefined;
  let testsPending = true;

  while (testsPending) {
    getTestSuiteStatusResponse = await request(prNumber, commitSha, Endpoint.GetTestSuiteStatus);

    if (getTestSuiteStatusResponse.statusCode === HandlerStatusCode.FAIL) {
      throw new Error(`RunTestSuiteHandler failed! Response: ${getTestSuiteStatusResponse}`);
    }

    console.log(getTestSuiteStatusResponse);

    const session: SessionEntry[] = JSON.parse(getTestSuiteStatusResponse.body);
    testsPending = checkPendingTests(session);

    await sleep(5000);
  }

  return JSON.parse(getTestSuiteStatusResponse!.body);
}

function checkPendingTests(session: SessionEntry[]): boolean {
  let testsPending = false;

  for (const test of session) {
    if (test.status === TestStatus.PENDING) {
      testsPending = true;
    }
  }

  return testsPending;
}

/**
 * deletes a test suite. Will block until the test suite is gone.
 */
async function deleteTestSuite(prNumber: string, commitSha: string) {
  const deleteTestSuiteResponse = await request(prNumber, commitSha, Endpoint.DeleteTestSuite);

  if (deleteTestSuiteResponse.statusCode !== HandlerStatusCode.SUCCESS) {
    throw new Error(`Test Suite failed to delete! PR Number: ${prNumber}, commitSha: ${commitSha}, failure response ${JSON.stringify(deleteTestSuiteResponse)}`);
  }

  console.log(`successfully deleted test suite! PR Number: '${prNumber}', commitSha: '${commitSha}' `);
}

/**
 * sleeps for `ms` miliseconds
 */
async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function request(prNumber: string, commitSha: string, endpoint: Endpoint): Promise<HandlerResult> {
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
        resolve({
          statusCode: response.statusCode ?? 500,
          body,
          headers: response.headers,
        });
      });
    });

    req.write(JSON.stringify({
      prNumber: prNumber,
      commitSha,
    }));

    req.end();
  });
}
