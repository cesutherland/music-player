const task      = require('co-task');
const colors    = require('colors/safe');
const spawnSync = require('child_process').spawnSync;
const Table     = require('cli-table');
const Spinner   = require('clui').Spinner;
const SSL       = require('./services/ssl');
const EB        = require('./services/eb');
const CF        = require('./services/cf');

// TODO: per-project config
const template  = require('./template');

const getOptions = options => {
  const name = options.parent.name || 'dev';
  return {
    name: name,
    instanceType: 't2.nano',
    stackName: `altplayer-stack-${name}`,
    solutionStack: '64bit Amazon Linux 2017.09 v4.4.2 running Node.js',
    environment: options.parent.environment || 'dev',
    database: {
      name: 'altplayer'
    }
  };
};

const reportError = (error) => {
  console.error(error);
  console.error(colors.red('There was an error: '), colors.red(error.message));
}

const makeCommand = function (command) {
  return task.async(function* (options) {
    try {
      const gen = yield command(getOptions(options))
      return gen;
    } catch (error) {
      reportError(error);
    }
  });
};

const generateTemplate = makeCommand(function* (options) {
  const data = yield template(options);
  const json = JSON.stringify(data, null, 2);
  console.log(json);
});

const createStack = makeCommand(function* (options) {

  const templateData = template(options);

  const stackName = options.stackName;

  console.log(`Looking for existing '${stackName}'...`);
  try {
    let data = yield CF.describeStacks({'StackName': stackName});
    console.log(colors.red(`Stack ${stackName} found: ${data.Stacks[0].StackStatus}`));
    console.log(colors.red('Cannot continue operation; please delete the stack or wait.'));
    return;
  } catch (e) {
    console.log(`None found.`);
  }

  const spinner = new Spinner(`Creating '${stackName}'...`);
  let data, stack;
  try {
    data = yield CF.createStack({
      "StackName": stackName,
      "Capabilities": ["CAPABILITY_IAM"],
      "TemplateBody": JSON.stringify(templateData),
    });
    console.log(`Stack id: ${data.StackId}`);
    spinner.start();
    spinner.message(`Creating stack...`);
    yield CF.waitUntilComplete(stackName);
    spinner.stop();
    console.log(`Stack ${data.StackId} created.`);
  } catch (e) {
    spinner.stop();
    console.error(e);
    data = yield CF.describeStackEvents({ StackName: stackName });
    printStackEvents(data);
    throw new Error(e);
  }

  console.log('Done');
});

/*
function* createSSL (args) {
  console.log('Creating SSL keys...');
  yield SSL.createSSLKeys();
  console.log('SSL keys created.');

  console.log(`Uploading API SSL keys as '${args.sslApiName}'...`);
  yield SSL.uploadServerCertificate(args.sslApiName);
  console.log(`Uploading client SSL keys as '${args.sslClientName}'...`);
  yield SSL.uploadServerCertificate(args.sslClientName);
}
*/


const destroyStack = makeCommand(function* (options) {

  const stackName = options.stackName;

  console.log(`Destroying stack '${stackName}'...`);

  yield CF.deleteStack({
    StackName: stackName
  });

  console.log('Done.\nFuck stacks.');
});

function* describeStack (options) {
  const stackName = `${options.name}-wavestash-stack`;
  const data = yield CF.describeStacks({ StackName: stackName });
  console.log(data.Stacks[0].Outputs);
}

const deploy = makeCommand(function* deploy (options) {

  // Grab AWS credentials from config so we can set it
  // as an environment variable for our shell script that
  // runs `aws` CLI.
  /*
  var AWS_CREDS = {
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,//config.accessKeyId,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,//config.secretAccessKey,
    AWS_DEFAULT_REGION: 'us-west-2'//config.region
  };
  */

  const AWS_CREDS = {};
  var env = {
    APP_NAME: `altplayer-${options.name}`,
    ENV_NAME: `altplayer-env-${options.name}`,
    BUILD_ENV: 'latest',
    PATH: process.env.PATH,
    S3_BUCKET: `altplayer-apps-${options.name}`
  };

  if (!env) {
    return console.error('Run this in the client or api projects.');
  }

  var script = __dirname + '/deploy.sh';
  var options = {
    stdio: ['inherit','inherit','inherit'],
    env: Object.assign(env, AWS_CREDS),
  };
  var deploy = spawnSync(script, [], options);
  if (deploy.status) throw new Error('Deploy failed.');
  console.log('Finished.');
});

function printStackEvents (data) {
  var table = new Table({
    chars: {'mid': '', 'left-mid': '', 'mid-mid': '', 'right-mid': ''},
    head: ['LogicalResourceId', 'ResourceType', 'ResourceStatus'],
    style: {'head': ['cyan']},
    colWidths: [28, 40, 24]
  });
  function getStatus(event) {
    var status = event['ResourceStatus'];
    if (status === 'CREATE_COMPLETE') {
      status = colors.green(status);
    }
    if (status === 'CREATE_FAILED') {
      status = colors.red(status);
    }
    if (
      status === 'ROLLBACK_IN_PROGRESS' ||
      status === 'DELETE_IN_PROGRESS' ||
      status === 'DELETE_COMPLETE' ||
      status === 'ROLLBACK_COMPLETE'
    ) {
      status = colors.yellow(status);
    }
    return status;
  }
  var failure = null;
  data['StackEvents'].reverse().forEach(function (event) {
    table.push([
      event['LogicalResourceId'],
      event['ResourceType'],
      getStatus(event)
    ]);
    if (!failure && event['ResourceStatus'] === 'CREATE_FAILED') {
      failure = event;
    }
  });
  console.log(table.toString());
  console.log(' LogicalResourceId:\t'+failure['LogicalResourceId']);
  console.log(' ResourceType:\t\t'+failure['ResourceType']);
  console.log(' ResourceStatus:\t'+failure['ResourceStatus']);
  console.log(' Cause:\t\t\t' + colors.red(failure['ResourceStatusReason']));
};

module.exports = {
  createStack: createStack,
  destroyStack: destroyStack,
  describeStack: describeStack,
  generateTemplate: generateTemplate,
  deploy: deploy
};
