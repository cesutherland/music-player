module.exports = options => ({

  'AWSTemplateFormatVersion': '2010-09-09',
  'Description': `Altplayer '${options.name}' running ${options.environment} environment`,

  'Resources': {
    'altplayerEnv': {
      'Type': 'AWS::ElasticBeanstalk::Environment',
      'Properties': {
        'ApplicationName': {
          'Ref': 'altplayerApp'
        },
        'EnvironmentName': `altplayer-env-${options.name}`,
        'SolutionStackName': options.solutionStack,
        // CNAMEPrefix: options.apiCname,
        'Description': 'Altplayer environment.',
        'OptionSettings': [

          { 'Namespace': 'aws:autoscaling:asg', 'OptionName': 'Availability Zones', 'Value': 'Any 1' },
          { 'Namespace': 'aws:autoscaling:asg', 'OptionName': 'Cooldown', 'Value': '360' },
          { 'Namespace': 'aws:autoscaling:asg', 'OptionName': 'MinSize', 'Value': '1' },
          { 'Namespace': 'aws:autoscaling:asg', 'OptionName': 'MaxSize', 'Value': '1' },

          /*
          { 'Namespace': 'aws:elb:loadbalancer', 'OptionName': 'LoadBalancerHTTPSPort', 'Value': '443' },
          { 'Namespace': 'aws:elb:loadbalancer', 'OptionName': 'LoadBalancerHTTPPort', 'Value': 'OFF' },
          { "Namespace": "aws:elb:loadbalancer", "OptionName": "SSLCertificateId", "Value": {
            "Fn::Join": [ "", [ "arn:aws:iam::", { "Ref":"AWS::AccountId" }, ":server-certificate", "/", options.sslApiName ] ] } },
            */

          { 'Namespace': 'aws:autoscaling:launchconfiguration', 'OptionName': 'IamInstanceProfile', 'Value': 'aws-elasticbeanstalk-ec2-role' },
          // { 'Namespace': 'aws:autoscaling:launchconfiguration', 'OptionName': 'SecurityGroups', 'Value': { 'Ref' : 'securitygroupapi' }},
          { 'Namespace': 'aws:autoscaling:launchconfiguration', 'OptionName': 'InstanceType', 'Value': options.instanceType},

          // TODO ssh debug mode
          // { 'Namespace': 'aws:autoscaling:launchconfiguration', 'OptionName': 'EC2KeyName', 'Value': 'fuck' }
             
          // Environtment:

          { 'Namespace': 'aws:elasticbeanstalk:application:environment',
            'OptionName': 'NODE_ENV', 'Value': options.environment },
          { 'Namespace': 'aws:elasticbeanstalk:application:environment',
            'OptionName': 'ALTPLAYER_CLIENT_SECRET', 'Value': process.env.ALTPLAYER_CLIENT_SECRET },

          /*
          { 'Namespace': 'aws:elasticbeanstalk:application:environment',
            'OptionName': 'AWS_ACCESS_KEY_ID', 'Value': {'Ref': 'apiuseraccesskey' } },
          { 'Namespace': 'aws:elasticbeanstalk:application:environment',
            'OptionName': 'AWS_SECRET_ACCESS_KEY', 'Value': { 'Fn::GetAtt': ['apiuseraccesskey', 'SecretAccessKey'] } },
          */

          { 'Namespace': 'aws:elasticbeanstalk:application:environment',
            'OptionName': 'DB_NAME', 'Value': options.database.name },
          { 'Namespace': 'aws:elasticbeanstalk:application:environment',
            'OptionName': 'DB_HOST', 'Value': { 'Fn::GetAtt': ['altplayerDatabase', 'Endpoint.Address'] } },
          { 'Namespace': 'aws:elasticbeanstalk:application:environment',
            'OptionName': 'DB_PORT', 'Value': { 'Fn::GetAtt': ['altplayerDatabase', 'Endpoint.Port'] } },
          { 'Namespace': 'aws:elasticbeanstalk:application:environment',
            'OptionName': 'DB_USER', 'Value': options.database.username },
          { 'Namespace': 'aws:elasticbeanstalk:application:environment',
            'OptionName': 'DB_PASSWORD', 'Value': options.database.password },
          /*
            */
          { 'Namespace': 'aws:elasticbeanstalk:application:environment',
            'OptionName': 'ELASTICBEANSTALK', 'Value': '1' }
        ]
      }
    },
    'altplayerApp': {
      'Type': 'AWS::ElasticBeanstalk::Application',
      'Properties': {
        'ApplicationName': `altplayer-${options.name}`,
        'Description': 'App'
      }
    },
    'altplayerDatabase': {
      'Type': 'AWS::RDS::DBInstance',
      'Properties': {
        'DBInstanceIdentifier': `altplayer-database-${options.name}`,
        'MasterUsername': options.database.username,
        'MasterUserPassword': options.database.password,
        'DBName': options.database.name,
        'AllocatedStorage': '5',
        'AllowMajorVersionUpgrade': 'false',
        'DBInstanceClass': `db.${options.instanceType}`,
        'Port': '5432',
        'StorageType': 'standard',
        'BackupRetentionPeriod': '7',
        'PreferredBackupWindow': '07:02-07:32',
        'PreferredMaintenanceWindow': 'mon:08:02-mon:08:32',
        'Engine': 'mariadb',
        'EngineVersion': '10.2'//,
        //'VPCSecurityGroups': [ { 'Fn::GetAtt': [ 'securitygroupdb', 'GroupId' ] } ]
      }
    },
    'altplayerS3Apps': {
      'Type': 'AWS::S3::Bucket',
      'Properties': {
        'BucketName': `altplayer-apps-${options.name}`,
        'AccessControl': 'Private',
        'VersioningConfiguration': {
          'Status': 'Suspended'
        }
      }
    }
    // TODO: security groups for DB and EC2
  }
});
