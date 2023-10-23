# Run Integ Tests GitHub Action

Invokes the [Integ Test Execution System](https://github.com/cdklabs/cdk-integ-test-automation/) to run a suite of PR tests.
Will fail if any test in the suite fails. 

Since this action deploys AWS Resources into accounts, ensure that it is run in a Workflow that has to access a GitHub Environment before it runs.
This ensures a maintainer will authorize every deployment by hand.

## Usage:

``` yaml
name: run-integ-tests

on:
  pull_request:
    branches: [ "main" ]

jobs:
  run-integ-tests:
    environment: integ-test-workflow-env
    name: run integ tests
    runs-on: ubuntu-latest
    steps:
      - uses: comcalvi/run-integ-tests@main
        with:
          pr-number: ${{ github.event.number }}
          commit-sha: ${{ github.event.pull_request.head.sha }}
```