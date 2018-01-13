'use strict';

const fs = require('fs');
const path = require('path');
const task = require('co-task');
const AWS = require('aws-sdk');
// TODO make this configurable
AWS.config.update({ region: 'us-west-2' });
const execFileSync = require('child_process').execFileSync;
const IAM = new AWS.IAM();

exports.createSSLKeys = task.async(function* () {
  execFileSync(path.join(__dirname, '..', 'scripts', 'ssl.sh'), {
    cwd: path.join(__dirname, '..')
  });
});

exports.uploadServerCertificate = task.async(function *(name) {
  let body, key, res;
  try {
    res = yield IAM.getServerCertificate({ ServerCertificateName: name }).promise();
  } catch (e) {
    try {
      body = fs.readFileSync(path.join(__dirname, '..', '.sslkeys', 'server.pem')) + '';
      key = fs.readFileSync(path.join(__dirname, '..', '.sslkeys', 'private-key.pem')) + '';
    } catch (e) {
      console.error(e);
      return;
    }

    res = yield IAM.uploadServerCertificate({
      CertificateBody: body,
      PrivateKey: key,
      ServerCertificateName: name
    }).promise();

    return res.ServerCertificateMetadata.Arn;
  }

  console.log(`SSL cert for ${name} already exists.`);
  return res.ServerCertificate.ServerCertificateMetadata.Arn;
});
