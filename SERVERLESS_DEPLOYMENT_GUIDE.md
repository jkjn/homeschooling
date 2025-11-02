# Serverless Framework Deployment Guide

This guide shows how to deploy the Homeschool Time Tracker backend using the Serverless Framework instead of AWS SAM.

## Why Serverless Framework?

**Advantages:**
- Simpler syntax and configuration
- Better plugin ecosystem
- Multi-cloud support (AWS, Azure, GCP)
- Built-in deployment packaging
- Great local development tools
- Active community and excellent documentation
- Easier environment variable management

**Comparison with SAM:**
- SAM: AWS-native, deeper AWS integration, CloudFormation-based
- Serverless: More abstracted, easier to learn, better DX

---

## Table of Contents

1. [Installation](#1-installation)
2. [Project Setup](#2-project-setup)
3. [Configuration](#3-configuration)
4. [Lambda Functions](#4-lambda-functions)
5. [Deployment](#5-deployment)
6. [Testing](#6-testing)
7. [Monitoring](#7-monitoring)
8. [CI/CD](#8-cicd)

---

## 1. Installation

### 1.1 Install Serverless Framework

```bash
# Install globally
npm install -g serverless

# Verify installation
serverless --version
# or
sls --version
```

### 1.2 Configure AWS Credentials

```bash
# Option 1: Using AWS CLI (if already configured)
# Serverless will use AWS CLI credentials

# Option 2: Configure directly
serverless config credentials \
  --provider aws \
  --key YOUR_AWS_ACCESS_KEY \
  --secret YOUR_AWS_SECRET_KEY
```

### 1.3 Install Serverless Plugins (Optional but Recommended)

```bash
# For local development
npm install -D serverless-offline

# For better deployment packaging
npm install -D serverless-webpack serverless-bundle

# For environment variables
npm install -D serverless-dotenv-plugin

# For API documentation
npm install -D serverless-aws-documentation

# For CloudWatch Logs
npm install -D serverless-plugin-log-retention
```

---

## 2. Project Setup

### 2.1 Create Backend Directory

```bash
mkdir backend
cd backend
```

### 2.2 Initialize Serverless Project

```bash
# Initialize with Node.js template
serverless create --template aws-nodejs --path .

# Or initialize npm project
npm init -y

# Install dependencies
npm install @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb
npm install -D serverless-offline
```

### 2.3 Project Structure

```
backend/
├── serverless.yml           # Main configuration
├── package.json             # Dependencies
├── .env                     # Environment variables (local)
├── .env.production          # Production environment variables
├── functions/
│   ├── students/
│   │   └── handler.js       # Students Lambda
│   ├── subjects/
│   │   └── handler.js       # Subjects Lambda
│   ├── timeEntries/
│   │   └── handler.js       # Time Entries Lambda
│   ├── reports/
│   │   └── handler.js       # Reports Lambda
│   └── settings/
│       └── handler.js       # Settings Lambda
├── lib/
│   ├── dynamodb.js          # DynamoDB utilities
│   ├── response.js          # HTTP response helpers
│   └── validation.js        # Input validation
└── resources/
    ├── dynamodb.yml         # DynamoDB tables
    ├── cognito.yml          # Cognito User Pool
    └── api-gateway.yml      # API Gateway config (optional)
```

---

## 3. Configuration

### 3.1 Main serverless.yml

Create `backend/serverless.yml`:

```yaml
service: homeschool-tracker-backend

frameworkVersion: '3'

provider:
  name: aws
  runtime: nodejs20.x
  region: ${opt:region, 'us-east-1'}
  stage: ${opt:stage, 'dev'}

  # Environment variables for all functions
  environment:
    REGION: ${self:provider.region}
    STAGE: ${self:provider.stage}
    STUDENTS_TABLE: ${self:custom.studentsTable}
    SUBJECTS_TABLE: ${self:custom.subjectsTable}
    TIME_ENTRIES_TABLE: ${self:custom.timeEntriesTable}
    SETTINGS_TABLE: ${self:custom.settingsTable}

  # IAM Role Permissions
  iam:
    role:
      statements:
        # DynamoDB permissions
        - Effect: Allow
          Action:
            - dynamodb:Query
            - dynamodb:Scan
            - dynamodb:GetItem
            - dynamodb:PutItem
            - dynamodb:UpdateItem
            - dynamodb:DeleteItem
            - dynamodb:BatchGetItem
            - dynamodb:BatchWriteItem
          Resource:
            - 'arn:aws:dynamodb:${self:provider.region}:*:table/${self:custom.studentsTable}'
            - 'arn:aws:dynamodb:${self:provider.region}:*:table/${self:custom.subjectsTable}'
            - 'arn:aws:dynamodb:${self:provider.region}:*:table/${self:custom.timeEntriesTable}'
            - 'arn:aws:dynamodb:${self:provider.region}:*:table/${self:custom.timeEntriesTable}/index/*'
            - 'arn:aws:dynamodb:${self:provider.region}:*:table/${self:custom.settingsTable}'

        # CloudWatch Logs permissions
        - Effect: Allow
          Action:
            - logs:CreateLogGroup
            - logs:CreateLogStream
            - logs:PutLogEvents
          Resource: '*'

  # API Gateway configuration
  apiGateway:
    restApiId: ${self:custom.apiGateway.restApiId}
    restApiRootResourceId: ${self:custom.apiGateway.rootResourceId}
    description: Homeschool Tracker API

  # Enable X-Ray tracing (optional)
  tracing:
    apiGateway: true
    lambda: true

  # Log retention
  logRetentionInDays: 14

# Custom variables
custom:
  # Table names
  studentsTable: homeschool-students-${self:provider.stage}
  subjectsTable: homeschool-subjects-${self:provider.stage}
  timeEntriesTable: homeschool-time-entries-${self:provider.stage}
  settingsTable: homeschool-settings-${self:provider.stage}

  # API Gateway (will be created on first deploy)
  apiGateway:
    restApiId: !Ref ApiGatewayRestApi
    rootResourceId: !GetAtt ApiGatewayRestApi.RootResourceId

  # Serverless Offline plugin config
  serverless-offline:
    httpPort: 3001
    lambdaPort: 3002

  # Log retention plugin
  logRetentionInDays: 14

# Plugins
plugins:
  - serverless-offline
  - serverless-plugin-log-retention

# Package configuration
package:
  individually: false
  patterns:
    - '!node_modules/**'
    - '!.git/**'
    - '!.env*'
    - '!README.md'
    - '!*.md'

# Lambda Functions
functions:
  # Students CRUD
  students:
    handler: functions/students/handler.main
    description: Handles student CRUD operations
    memorySize: 256
    timeout: 10
    events:
      - http:
          path: students
          method: get
          cors: true
          authorizer:
            type: COGNITO_USER_POOLS
            authorizerId: !Ref ApiGatewayAuthorizer
      - http:
          path: students
          method: post
          cors: true
          authorizer:
            type: COGNITO_USER_POOLS
            authorizerId: !Ref ApiGatewayAuthorizer
      - http:
          path: students/{id}
          method: get
          cors: true
          authorizer:
            type: COGNITO_USER_POOLS
            authorizerId: !Ref ApiGatewayAuthorizer
      - http:
          path: students/{id}
          method: put
          cors: true
          authorizer:
            type: COGNITO_USER_POOLS
            authorizerId: !Ref ApiGatewayAuthorizer
      - http:
          path: students/{id}
          method: delete
          cors: true
          authorizer:
            type: COGNITO_USER_POOLS
            authorizerId: !Ref ApiGatewayAuthorizer

  # Subjects CRUD
  subjects:
    handler: functions/subjects/handler.main
    description: Handles subject CRUD operations
    memorySize: 256
    timeout: 10
    events:
      - http:
          path: subjects
          method: get
          cors: true
          authorizer:
            type: COGNITO_USER_POOLS
            authorizerId: !Ref ApiGatewayAuthorizer
      - http:
          path: subjects
          method: post
          cors: true
          authorizer:
            type: COGNITO_USER_POOLS
            authorizerId: !Ref ApiGatewayAuthorizer
      - http:
          path: subjects/{id}
          method: get
          cors: true
          authorizer:
            type: COGNITO_USER_POOLS
            authorizerId: !Ref ApiGatewayAuthorizer
      - http:
          path: subjects/{id}
          method: put
          cors: true
          authorizer:
            type: COGNITO_USER_POOLS
            authorizerId: !Ref ApiGatewayAuthorizer
      - http:
          path: subjects/{id}
          method: delete
          cors: true
          authorizer:
            type: COGNITO_USER_POOLS
            authorizerId: !Ref ApiGatewayAuthorizer

  # Time Entries CRUD
  timeEntries:
    handler: functions/timeEntries/handler.main
    description: Handles time entry CRUD operations
    memorySize: 512
    timeout: 15
    events:
      - http:
          path: time-entries
          method: get
          cors: true
          authorizer:
            type: COGNITO_USER_POOLS
            authorizerId: !Ref ApiGatewayAuthorizer
      - http:
          path: time-entries
          method: post
          cors: true
          authorizer:
            type: COGNITO_USER_POOLS
            authorizerId: !Ref ApiGatewayAuthorizer
      - http:
          path: time-entries/{id}
          method: get
          cors: true
          authorizer:
            type: COGNITO_USER_POOLS
            authorizerId: !Ref ApiGatewayAuthorizer
      - http:
          path: time-entries/{id}
          method: put
          cors: true
          authorizer:
            type: COGNITO_USER_POOLS
            authorizerId: !Ref ApiGatewayAuthorizer
      - http:
          path: time-entries/{id}
          method: delete
          cors: true
          authorizer:
            type: COGNITO_USER_POOLS
            authorizerId: !Ref ApiGatewayAuthorizer

  # Reports
  reports:
    handler: functions/reports/handler.main
    description: Generates reports and analytics
    memorySize: 1024
    timeout: 30
    events:
      - http:
          path: reports/summary
          method: get
          cors: true
          authorizer:
            type: COGNITO_USER_POOLS
            authorizerId: !Ref ApiGatewayAuthorizer
      - http:
          path: reports/by-student
          method: get
          cors: true
          authorizer:
            type: COGNITO_USER_POOLS
            authorizerId: !Ref ApiGatewayAuthorizer
      - http:
          path: reports/by-subject
          method: get
          cors: true
          authorizer:
            type: COGNITO_USER_POOLS
            authorizerId: !Ref ApiGatewayAuthorizer

  # Settings
  settings:
    handler: functions/settings/handler.main
    description: Handles user settings
    memorySize: 128
    timeout: 10
    events:
      - http:
          path: settings
          method: get
          cors: true
          authorizer:
            type: COGNITO_USER_POOLS
            authorizerId: !Ref ApiGatewayAuthorizer
      - http:
          path: settings
          method: put
          cors: true
          authorizer:
            type: COGNITO_USER_POOLS
            authorizerId: !Ref ApiGatewayAuthorizer

# CloudFormation Resources
resources:
  # Import resource definitions
  - ${file(resources/dynamodb.yml)}
  - ${file(resources/cognito.yml)}

  # Outputs
  - Outputs:
      ApiGatewayUrl:
        Description: API Gateway endpoint URL
        Value: !Sub 'https://${ApiGatewayRestApi}.execute-api.${AWS::Region}.amazonaws.com/${self:provider.stage}'
        Export:
          Name: ${self:service}-${self:provider.stage}-api-url

      UserPoolId:
        Description: Cognito User Pool ID
        Value: !Ref CognitoUserPool
        Export:
          Name: ${self:service}-${self:provider.stage}-user-pool-id

      UserPoolClientId:
        Description: Cognito User Pool Client ID
        Value: !Ref CognitoUserPoolClient
        Export:
          Name: ${self:service}-${self:provider.stage}-user-pool-client-id
```

### 3.2 DynamoDB Resources

Create `backend/resources/dynamodb.yml`:

```yaml
Resources:
  # Students Table
  StudentsTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: ${self:custom.studentsTable}
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: userId
          AttributeType: S
        - AttributeName: studentId
          AttributeType: S
      KeySchema:
        - AttributeName: userId
          KeyType: HASH
        - AttributeName: studentId
          KeyType: RANGE
      StreamSpecification:
        StreamViewType: NEW_AND_OLD_IMAGES
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      Tags:
        - Key: Environment
          Value: ${self:provider.stage}
        - Key: Service
          Value: ${self:service}

  # Subjects Table
  SubjectsTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: ${self:custom.subjectsTable}
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: userId
          AttributeType: S
        - AttributeName: subjectId
          AttributeType: S
      KeySchema:
        - AttributeName: userId
          KeyType: HASH
        - AttributeName: subjectId
          KeyType: RANGE
      StreamSpecification:
        StreamViewType: NEW_AND_OLD_IMAGES
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      Tags:
        - Key: Environment
          Value: ${self:provider.stage}
        - Key: Service
          Value: ${self:service}

  # Time Entries Table
  TimeEntriesTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: ${self:custom.timeEntriesTable}
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: userId
          AttributeType: S
        - AttributeName: entryId
          AttributeType: S
        - AttributeName: date
          AttributeType: S
        - AttributeName: userStudent
          AttributeType: S
        - AttributeName: userSubject
          AttributeType: S
      KeySchema:
        - AttributeName: userId
          KeyType: HASH
        - AttributeName: entryId
          KeyType: RANGE
      GlobalSecondaryIndexes:
        - IndexName: UserDateIndex
          KeySchema:
            - AttributeName: userId
              KeyType: HASH
            - AttributeName: date
              KeyType: RANGE
          Projection:
            ProjectionType: ALL
        - IndexName: StudentIndex
          KeySchema:
            - AttributeName: userStudent
              KeyType: HASH
            - AttributeName: date
              KeyType: RANGE
          Projection:
            ProjectionType: ALL
        - IndexName: SubjectIndex
          KeySchema:
            - AttributeName: userSubject
              KeyType: HASH
            - AttributeName: date
              KeyType: RANGE
          Projection:
            ProjectionType: ALL
      StreamSpecification:
        StreamViewType: NEW_AND_OLD_IMAGES
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      Tags:
        - Key: Environment
          Value: ${self:provider.stage}
        - Key: Service
          Value: ${self:service}

  # Settings Table
  SettingsTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: ${self:custom.settingsTable}
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: userId
          AttributeType: S
        - AttributeName: settingKey
          AttributeType: S
      KeySchema:
        - AttributeName: userId
          KeyType: HASH
        - AttributeName: settingKey
          KeyType: RANGE
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      Tags:
        - Key: Environment
          Value: ${self:provider.stage}
        - Key: Service
          Value: ${self:service}
```

### 3.3 Cognito Resources

Create `backend/resources/cognito.yml`:

```yaml
Resources:
  # Cognito User Pool
  CognitoUserPool:
    Type: AWS::Cognito::UserPool
    Properties:
      UserPoolName: ${self:service}-${self:provider.stage}-user-pool
      UsernameAttributes:
        - email
      UsernameConfiguration:
        CaseSensitive: false
      AutoVerifiedAttributes:
        - email
      EmailVerificationMessage: 'Your verification code is {####}'
      EmailVerificationSubject: 'Verify your email for Homeschool Tracker'
      Policies:
        PasswordPolicy:
          MinimumLength: 8
          RequireUppercase: true
          RequireLowercase: true
          RequireNumbers: true
          RequireSymbols: true
      Schema:
        - Name: email
          AttributeDataType: String
          Required: true
          Mutable: false
        - Name: name
          AttributeDataType: String
          Required: true
          Mutable: true
      AccountRecoverySetting:
        RecoveryMechanisms:
          - Name: verified_email
            Priority: 1
      UserPoolTags:
        Environment: ${self:provider.stage}
        Service: ${self:service}

  # Cognito User Pool Client
  CognitoUserPoolClient:
    Type: AWS::Cognito::UserPoolClient
    Properties:
      ClientName: ${self:service}-${self:provider.stage}-client
      UserPoolId: !Ref CognitoUserPool
      GenerateSecret: false
      ExplicitAuthFlows:
        - ALLOW_USER_SRP_AUTH
        - ALLOW_REFRESH_TOKEN_AUTH
      PreventUserExistenceErrors: ENABLED
      RefreshTokenValidity: 30
      AccessTokenValidity: 60
      IdTokenValidity: 60
      TokenValidityUnits:
        AccessToken: minutes
        IdToken: minutes
        RefreshToken: days
      ReadAttributes:
        - email
        - name
        - email_verified
      WriteAttributes:
        - email
        - name

  # API Gateway Authorizer
  ApiGatewayAuthorizer:
    Type: AWS::ApiGateway::Authorizer
    Properties:
      Name: ${self:service}-${self:provider.stage}-authorizer
      Type: COGNITO_USER_POOLS
      IdentitySource: method.request.header.Authorization
      RestApiId: !Ref ApiGatewayRestApi
      ProviderARNs:
        - !GetAtt CognitoUserPool.Arn
```

---

## 4. Lambda Functions

The Lambda function code is the same as in the SAM guide. Use the code from `LAMBDA_FUNCTIONS_GUIDE.md`, just adjust the file paths to match the Serverless structure.

**Example: Students Handler**

Create `backend/functions/students/handler.js`:

```javascript
import { randomUUID } from 'crypto';
import { getItem, putItem, updateItem, deleteItem, queryItems } from '../../lib/dynamodb.js';
import { success, error, notFound, badRequest } from '../../lib/response.js';
import { validateRequired, sanitizeInput } from '../../lib/validation.js';

const STUDENTS_TABLE = process.env.STUDENTS_TABLE;

const getUserId = (event) => {
  return event.requestContext.authorizer.claims.sub;
};

export const main = async (event) => {
  console.log('Event:', JSON.stringify(event));

  const httpMethod = event.httpMethod;
  const userId = getUserId(event);

  try {
    switch (httpMethod) {
      case 'GET':
        return await handleGet(event, userId);
      case 'POST':
        return await handlePost(event, userId);
      case 'PUT':
        return await handlePut(event, userId);
      case 'DELETE':
        return await handleDelete(event, userId);
      default:
        return badRequest(`Unsupported method: ${httpMethod}`);
    }
  } catch (err) {
    console.error('Error:', err);
    return error(err.message);
  }
};

// ... rest of the handler code from LAMBDA_FUNCTIONS_GUIDE.md
```

---

## 5. Deployment

### 5.1 Deploy Everything

```bash
# Deploy to dev stage (default)
serverless deploy

# Deploy to production
serverless deploy --stage prod

# Deploy to specific region
serverless deploy --region us-west-2

# Deploy with verbose output
serverless deploy --verbose

# Deploy a single function (faster)
serverless deploy function --function students
```

### 5.2 Deployment Output

After deployment, you'll see:

```
Service Information
service: homeschool-tracker-backend
stage: dev
region: us-east-1
stack: homeschool-tracker-backend-dev
endpoints:
  GET - https://abc123.execute-api.us-east-1.amazonaws.com/dev/students
  POST - https://abc123.execute-api.us-east-1.amazonaws.com/dev/students
  ... (all endpoints)
functions:
  students: homeschool-tracker-backend-dev-students
  subjects: homeschool-tracker-backend-dev-subjects
  ... (all functions)
```

### 5.3 Get Deployment Info

```bash
# Get all outputs
serverless info

# Get specific output
serverless info --verbose

# Get API Gateway URL
serverless info --verbose | grep ServiceEndpoint
```

### 5.4 Remove Deployment

```bash
# Remove entire stack
serverless remove

# Remove from specific stage
serverless remove --stage prod
```

---

## 6. Testing

### 6.1 Local Testing with Serverless Offline

```bash
# Start local API
serverless offline

# or
sls offline

# Access at http://localhost:3001
```

### 6.2 Invoke Function Locally

```bash
# Invoke with test data
serverless invoke local --function students --data '{"httpMethod":"GET","requestContext":{"authorizer":{"claims":{"sub":"test-user"}}}}'

# Invoke with file
serverless invoke local --function students --path test-events/get-students.json
```

Create `backend/test-events/get-students.json`:

```json
{
  "httpMethod": "GET",
  "path": "/students",
  "requestContext": {
    "authorizer": {
      "claims": {
        "sub": "test-user-id"
      }
    }
  }
}
```

### 6.3 Invoke Deployed Function

```bash
# Invoke deployed function
serverless invoke --function students

# Invoke with data
serverless invoke --function students --data '{"httpMethod":"GET"}'

# View logs
serverless logs --function students

# Tail logs
serverless logs --function students --tail
```

---

## 7. Monitoring

### 7.1 View Logs

```bash
# Tail all function logs
serverless logs --function students --tail

# Get logs from last hour
serverless logs --function students --startTime 1h

# Get logs with specific filter
serverless logs --function students --filter "ERROR"
```

### 7.2 Metrics

```bash
# View metrics (requires plugin)
serverless metrics
```

---

## 8. CI/CD

### 8.1 GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy Backend

on:
  push:
    branches:
      - main
    paths:
      - 'backend/**'
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json

      - name: Install dependencies
        working-directory: backend
        run: npm ci

      - name: Deploy to AWS
        working-directory: backend
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        run: |
          npm install -g serverless
          serverless deploy --stage prod
```

---

## 9. Useful Commands

```bash
# Check serverless version
serverless --version

# Validate configuration
serverless print

# Package without deploying
serverless package

# Deploy a single function
serverless deploy function -f students

# View CloudFormation stack
serverless info --verbose

# Rollback to previous deployment
serverless rollback

# List deployed services
serverless list

# Create function from template
serverless create function -f newFunction --handler functions/newFunction/handler.main
```

---

## 10. Environment-Specific Configurations

### 10.1 Multiple Stages

Create `backend/config/dev.yml`:

```yaml
studentsTable: homeschool-students-dev
apiThrottleRate: 100
apiThrottleBurst: 200
```

Create `backend/config/prod.yml`:

```yaml
studentsTable: homeschool-students-prod
apiThrottleRate: 10000
apiThrottleBurst: 5000
```

Update `serverless.yml`:

```yaml
custom:
  config: ${file(config/${self:provider.stage}.yml)}
  studentsTable: ${self:custom.config.studentsTable}
```

---

## 11. Cost Optimization

### 11.1 Provisioned Concurrency (Optional)

For functions that need warm starts:

```yaml
functions:
  students:
    handler: functions/students/handler.main
    provisionedConcurrency: 1  # Keep 1 instance warm
```

### 11.2 Reserved Concurrency

Limit concurrent executions:

```yaml
functions:
  students:
    handler: functions/students/handler.main
    reservedConcurrency: 5
```

---

## Next Steps

1. Complete Lambda function implementations
2. Set up Cognito User Pool manually (or use CloudFormation)
3. Deploy with `serverless deploy`
4. Test endpoints
5. Update frontend with API URLs
6. Set up CI/CD pipeline
7. Monitor and optimize

---

## Comparison: Serverless vs SAM

| Feature | Serverless Framework | AWS SAM |
|---------|---------------------|---------|
| Configuration | YAML (simpler) | YAML + CloudFormation |
| Learning Curve | Easier | Steeper |
| Deployment | Fast | Moderate |
| Local Testing | serverless-offline | sam local |
| Multi-cloud | Yes | No (AWS only) |
| Plugin Ecosystem | Extensive | Limited |
| AWS Integration | Good | Excellent |
| Community | Large | Growing |

**Recommendation**: Use Serverless Framework for faster development and easier configuration. Use SAM if you need deep AWS integration or are already familiar with CloudFormation.
