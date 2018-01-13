#!/bin/sh
# 
# Environment:
# APP_NAME - EBS application name for the client or api applicaiton.
# S3_BUCKET - Application versions bucket.
#
# Local:
# APP_VERSION - `ISO-date` `git-sha`
#

set -e # exit on any failure
set -v # wtf is going on

# install aws cli
# pip install awscli

APP_VERSION="`date -u +%Y-%m-%dT%H:%M:%SZ`-`git rev-parse HEAD`"

echo "Deploying $APP_NAME@$APP_VERSION"

# build stuff
export BUILD_ENV=$BUILD_ENV
export API_URL=$API_URL
./scripts/build.sh

# zip the application
echo "Creating zip '${APP_NAME}-${APP_VERSION}.zip'"
cd build;
zip -q -r "${APP_NAME}-${APP_VERSION}.zip" *

# upload to S3
aws --version
aws s3 ls "s3://${S3_BUCKET}/"
aws s3 cp ${APP_NAME}-${APP_VERSION}.zip "s3://${S3_BUCKET}/${APP_NAME}-${APP_VERSION}.zip"

# create a new version
aws elasticbeanstalk create-application-version --application-name "${APP_NAME}" --version-label "${APP_VERSION}" --source-bundle S3Bucket="${S3_BUCKET}",S3Key="${APP_NAME}-${APP_VERSION}.zip"

# Ping build server
aws elasticbeanstalk update-environment --environment-name "${ENV_NAME}" --version-label "${APP_VERSION}"

# Cleanup
rm "${APP_NAME}-${APP_VERSION}.zip"

echo "Deployed."
