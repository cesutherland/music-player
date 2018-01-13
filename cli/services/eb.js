const AWS = require('aws-sdk');
// TODO make this configurable
AWS.config.update({ region: 'us-west-2' });
const EB = new AWS.ElasticBeanstalk();

exports.updateEnvironment = (...args) => EB.updateEnvironment(...args).promise();
exports.describeConfigurationSettings = (...args) => EB.describeConfigurationSettings(...args).promise();
