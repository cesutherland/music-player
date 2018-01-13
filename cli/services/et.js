"use strict";

const fs = require("fs");
const task = require('co-task');
const AWS = require('aws-sdk');
// TODO make this configurable
AWS.config.update({ region: 'us-west-2' });
const ET = new AWS.ElasticTranscoder();

exports.createPipeline = (...args) => ET.createPipeline(...args).promise();
exports.deletePipeline = (...args) => ET.deletePipeline(...args).promise();
