const task = require('co-task');
const AWS = require('aws-sdk');
// TODO make this configurable
AWS.config.update({ region: 'us-east-2' });
const CF = new AWS.CloudFormation(
);

// Timer for polling when waiting for stack creation in `waitUntilComplete`,
// check once a minute, realistically this'll take like 30 minutes
const POLLING_TIMER = 30000;

exports.createStack = (options) => CF.createStack(options).promise();
exports.validateTemplate = (...args) => CF.validateTemplate(...args).promise();
exports.describeStacks = (...args) => CF.describeStacks(...args).promise();
exports.describeStackEvents = (...args) => CF.describeStackEvents(...args).promise();
exports.deleteStack = (...args) => CF.deleteStack(...args).promise();
exports.waitUntilComplete = task.async(function* (name) {
  while (true) {
    const data = yield CF.describeStacks({ StackName: name }).promise();
    const stack = data.Stacks[0];
    const status = stack.StackStatus;

    // If still creating, wait POLLING_TIMER milliseconds and retry
    if (status === 'CREATE_IN_PROGRESS') {
      yield new Promise(r => setTimeout(r, POLLING_TIMER));
      continue;
    }

    if (status === 'CREATE_COMPLETE') {
      return stack;
    }

    // If it's not created, or being created, we've got an error.
    throw new Error('Error creating stack.');
  }
});
