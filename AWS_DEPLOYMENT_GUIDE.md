# AWS Deployment Guide - Step by Step

This guide provides detailed instructions for deploying the Homeschool Time Tracker to AWS.

## Prerequisites

- AWS Account with administrative access
- AWS CLI installed and configured
- Node.js 20.x or later
- Git

## Table of Contents

1. [Initial Setup](#1-initial-setup)
2. [Create DynamoDB Tables](#2-create-dynamodb-tables)
3. [Set Up AWS Cognito](#3-set-up-aws-cognito)
4. [Deploy Lambda Functions](#4-deploy-lambda-functions)
5. [Configure API Gateway](#5-configure-api-gateway)
6. [Update Frontend Code](#6-update-frontend-code)
7. [Deploy to S3](#7-deploy-to-s3)
8. [Set Up CloudFront (Optional)](#8-set-up-cloudfront-optional)
9. [Testing](#9-testing)
10. [Monitoring and Maintenance](#10-monitoring-and-maintenance)

---

## 1. Initial Setup

### 1.1 Install AWS CLI

```bash
# macOS
brew install awscli

# Windows
# Download from: https://aws.amazon.com/cli/

# Linux
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
```

### 1.2 Configure AWS CLI

```bash
aws configure
```

Enter your:
- AWS Access Key ID
- AWS Secret Access Key
- Default region (e.g., us-east-1)
- Default output format (json)

### 1.3 Choose Your Region

Pick a region close to your users:
- US East: `us-east-1` (Virginia) - Cheapest
- US West: `us-west-2` (Oregon)
- Europe: `eu-west-1` (Ireland)
- Asia Pacific: `ap-southeast-1` (Singapore)

**Use the same region for all services in this guide.**

---

## 2. Create DynamoDB Tables

### 2.1 Students Table

```bash
aws dynamodb create-table \
    --table-name homeschool-students \
    --attribute-definitions \
        AttributeName=userId,AttributeType=S \
        AttributeName=studentId,AttributeType=S \
    --key-schema \
        AttributeName=userId,KeyType=HASH \
        AttributeName=studentId,KeyType=RANGE \
    --billing-mode PAY_PER_REQUEST \
    --region us-east-1
```

### 2.2 Subjects Table

```bash
aws dynamodb create-table \
    --table-name homeschool-subjects \
    --attribute-definitions \
        AttributeName=userId,AttributeType=S \
        AttributeName=subjectId,AttributeType=S \
    --key-schema \
        AttributeName=userId,KeyType=HASH \
        AttributeName=subjectId,KeyType=RANGE \
    --billing-mode PAY_PER_REQUEST \
    --region us-east-1
```

### 2.3 Time Entries Table

```bash
aws dynamodb create-table \
    --table-name homeschool-time-entries \
    --attribute-definitions \
        AttributeName=userId,AttributeType=S \
        AttributeName=entryId,AttributeType=S \
        AttributeName=date,AttributeType=S \
        AttributeName=userStudent,AttributeType=S \
        AttributeName=userSubject,AttributeType=S \
    --key-schema \
        AttributeName=userId,KeyType=HASH \
        AttributeName=entryId,KeyType=RANGE \
    --global-secondary-indexes \
        "[
            {
                \"IndexName\": \"UserDateIndex\",
                \"KeySchema\": [
                    {\"AttributeName\":\"userId\",\"KeyType\":\"HASH\"},
                    {\"AttributeName\":\"date\",\"KeyType\":\"RANGE\"}
                ],
                \"Projection\": {\"ProjectionType\":\"ALL\"},
                \"ProvisionedThroughput\": {\"ReadCapacityUnits\":0,\"WriteCapacityUnits\":0}
            },
            {
                \"IndexName\": \"StudentIndex\",
                \"KeySchema\": [
                    {\"AttributeName\":\"userStudent\",\"KeyType\":\"HASH\"},
                    {\"AttributeName\":\"date\",\"KeyType\":\"RANGE\"}
                ],
                \"Projection\": {\"ProjectionType\":\"ALL\"},
                \"ProvisionedThroughput\": {\"ReadCapacityUnits\":0,\"WriteCapacityUnits\":0}
            },
            {
                \"IndexName\": \"SubjectIndex\",
                \"KeySchema\": [
                    {\"AttributeName\":\"userSubject\",\"KeyType\":\"HASH\"},
                    {\"AttributeName\":\"date\",\"KeyType\":\"RANGE\"}
                ],
                \"Projection\": {\"ProjectionType\":\"ALL\"},
                \"ProvisionedThroughput\": {\"ReadCapacityUnits\":0,\"WriteCapacityUnits\":0}
            }
        ]" \
    --billing-mode PAY_PER_REQUEST \
    --region us-east-1
```

### 2.4 Settings Table

```bash
aws dynamodb create-table \
    --table-name homeschool-settings \
    --attribute-definitions \
        AttributeName=userId,AttributeType=S \
        AttributeName=settingKey,AttributeType=S \
    --key-schema \
        AttributeName=userId,KeyType=HASH \
        AttributeName=settingKey,KeyType=RANGE \
    --billing-mode PAY_PER_REQUEST \
    --region us-east-1
```

### 2.5 Verify Tables

```bash
aws dynamodb list-tables --region us-east-1
```

You should see all four tables listed.

---

## 3. Set Up AWS Cognito

### 3.1 Create User Pool (AWS Console)

1. Go to [AWS Cognito Console](https://console.aws.amazon.com/cognito/)
2. Click **Create user pool**
3. **Step 1: Configure sign-in experience**
   - Sign-in options: ✓ Email
   - User name requirements: Default
   - Click **Next**

4. **Step 2: Configure security requirements**
   - Password policy: Choose your preference (recommend: default)
   - MFA: No MFA (or enable if desired)
   - User account recovery: Email only
   - Click **Next**

5. **Step 3: Configure sign-up experience**
   - Self-registration: ✓ Enable self-registration
   - Attribute verification: ✓ Send email verification
   - Required attributes: name, email
   - Click **Next**

6. **Step 4: Configure message delivery**
   - Email provider: Send email with Cognito
   - FROM email address: Use default
   - Click **Next**

7. **Step 5: Integrate your app**
   - User pool name: `homeschool-tracker-users`
   - Hosted UI: Skip for now
   - App client name: `homeschool-tracker-client`
   - Client secret: Don't generate (public client)
   - Click **Next**

8. **Step 6: Review and create**
   - Review settings
   - Click **Create user pool**

### 3.2 Note Important Values

After creation, note these values (you'll need them later):

```
User Pool ID: us-east-1_xxxxxxxxx
App Client ID: xxxxxxxxxxxxxxxxxxxxxxxxxx
Region: us-east-1
```

### 3.3 Configure App Client Settings

1. In your User Pool, go to **App integration** tab
2. Click on your app client
3. Under **Hosted UI settings**, configure:
   - Allowed callback URLs: `http://localhost:5173,https://yourdomain.com`
   - Allowed sign-out URLs: `http://localhost:5173,https://yourdomain.com`
   - OAuth 2.0 grant types: ✓ Implicit grant
   - OAuth scopes: ✓ email, ✓ openid, ✓ profile

### 3.4 Enable Social Identity Providers (Optional)

#### Google
1. Go to **Sign-in experience** → **Federated identity provider sign-in**
2. Click **Add identity provider**
3. Select **Google**
4. Enter Google Client ID and Client Secret (from Google Cloud Console)
5. Set Authorized scopes: `profile email openid`

#### Facebook/Amazon (Similar process)

---

## 4. Deploy Lambda Functions

### 4.1 Create Lambda Deployment Package

We'll use AWS SAM (Serverless Application Model) for easier deployment.

#### Install AWS SAM CLI

```bash
# macOS
brew install aws-sam-cli

# Windows
# Download from: https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html

# Linux
pip install aws-sam-cli
```

### 4.2 Create Lambda Function Code Structure

Create a new directory for backend code:

```bash
mkdir -p backend/src/functions
mkdir -p backend/src/shared
```

### 4.3 Create SAM Template

Create `backend/template.yaml`:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Description: Homeschool Tracker Backend

Globals:
  Function:
    Timeout: 30
    Runtime: nodejs20.x
    Environment:
      Variables:
        REGION: !Ref AWS::Region
        STUDENTS_TABLE: homeschool-students
        SUBJECTS_TABLE: homeschool-subjects
        TIME_ENTRIES_TABLE: homeschool-time-entries
        SETTINGS_TABLE: homeschool-settings
    Architectures:
      - x86_64

Resources:
  # API Gateway
  HomeschoolApi:
    Type: AWS::Serverless::Api
    Properties:
      StageName: prod
      Auth:
        DefaultAuthorizer: CognitoAuthorizer
        Authorizers:
          CognitoAuthorizer:
            UserPoolArn: !GetAtt UserPool.Arn
      Cors:
        AllowMethods: "'GET,POST,PUT,DELETE,OPTIONS'"
        AllowHeaders: "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
        AllowOrigin: "'*'"

  # Students Function
  StudentsFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: src/functions/students/
      Handler: index.handler
      Policies:
        - DynamoDBCrudPolicy:
            TableName: homeschool-students
      Events:
        GetStudents:
          Type: Api
          Properties:
            RestApiId: !Ref HomeschoolApi
            Path: /students
            Method: get
        CreateStudent:
          Type: Api
          Properties:
            RestApiId: !Ref HomeschoolApi
            Path: /students
            Method: post
        GetStudent:
          Type: Api
          Properties:
            RestApiId: !Ref HomeschoolApi
            Path: /students/{id}
            Method: get
        UpdateStudent:
          Type: Api
          Properties:
            RestApiId: !Ref HomeschoolApi
            Path: /students/{id}
            Method: put
        DeleteStudent:
          Type: Api
          Properties:
            RestApiId: !Ref HomeschoolApi
            Path: /students/{id}
            Method: delete

  # Subjects Function
  SubjectsFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: src/functions/subjects/
      Handler: index.handler
      Policies:
        - DynamoDBCrudPolicy:
            TableName: homeschool-subjects
      Events:
        GetSubjects:
          Type: Api
          Properties:
            RestApiId: !Ref HomeschoolApi
            Path: /subjects
            Method: get
        CreateSubject:
          Type: Api
          Properties:
            RestApiId: !Ref HomeschoolApi
            Path: /subjects
            Method: post
        GetSubject:
          Type: Api
          Properties:
            RestApiId: !Ref HomeschoolApi
            Path: /subjects/{id}
            Method: get
        UpdateSubject:
          Type: Api
          Properties:
            RestApiId: !Ref HomeschoolApi
            Path: /subjects/{id}
            Method: put
        DeleteSubject:
          Type: Api
          Properties:
            RestApiId: !Ref HomeschoolApi
            Path: /subjects/{id}
            Method: delete

  # Time Entries Function
  TimeEntriesFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: src/functions/time-entries/
      Handler: index.handler
      MemorySize: 512
      Policies:
        - DynamoDBCrudPolicy:
            TableName: homeschool-time-entries
      Events:
        GetEntries:
          Type: Api
          Properties:
            RestApiId: !Ref HomeschoolApi
            Path: /time-entries
            Method: get
        CreateEntry:
          Type: Api
          Properties:
            RestApiId: !Ref HomeschoolApi
            Path: /time-entries
            Method: post
        GetEntry:
          Type: Api
          Properties:
            RestApiId: !Ref HomeschoolApi
            Path: /time-entries/{id}
            Method: get
        UpdateEntry:
          Type: Api
          Properties:
            RestApiId: !Ref HomeschoolApi
            Path: /time-entries/{id}
            Method: put
        DeleteEntry:
          Type: Api
          Properties:
            RestApiId: !Ref HomeschoolApi
            Path: /time-entries/{id}
            Method: delete

  # Reports Function
  ReportsFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: src/functions/reports/
      Handler: index.handler
      MemorySize: 1024
      Policies:
        - DynamoDBReadPolicy:
            TableName: homeschool-students
        - DynamoDBReadPolicy:
            TableName: homeschool-subjects
        - DynamoDBReadPolicy:
            TableName: homeschool-time-entries
      Events:
        GetSummary:
          Type: Api
          Properties:
            RestApiId: !Ref HomeschoolApi
            Path: /reports/summary
            Method: get
        GetByStudent:
          Type: Api
          Properties:
            RestApiId: !Ref HomeschoolApi
            Path: /reports/by-student
            Method: get
        GetBySubject:
          Type: Api
          Properties:
            RestApiId: !Ref HomeschoolApi
            Path: /reports/by-subject
            Method: get

  # Settings Function
  SettingsFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: src/functions/settings/
      Handler: index.handler
      Policies:
        - DynamoDBCrudPolicy:
            TableName: homeschool-settings
      Events:
        GetSettings:
          Type: Api
          Properties:
            RestApiId: !Ref HomeschoolApi
            Path: /settings
            Method: get
        UpdateSettings:
          Type: Api
          Properties:
            RestApiId: !Ref HomeschoolApi
            Path: /settings
            Method: put

Outputs:
  ApiUrl:
    Description: "API Gateway endpoint URL"
    Value: !Sub "https://${HomeschoolApi}.execute-api.${AWS::Region}.amazonaws.com/prod/"

  ApiId:
    Description: "API Gateway ID"
    Value: !Ref HomeschoolApi
```

### 4.4 Build and Deploy with SAM

```bash
cd backend

# Build
sam build

# Deploy (first time with guided setup)
sam deploy --guided

# Follow prompts:
# Stack Name: homeschool-tracker-backend
# AWS Region: us-east-1 (or your chosen region)
# Confirm changes: Y
# Allow SAM CLI IAM role creation: Y
# Save arguments to samconfig.toml: Y
```

### 4.5 Note the API Gateway URL

After deployment, note the API Gateway URL from the outputs:
```
https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/prod/
```

---

## 5. Configure API Gateway

The API Gateway is automatically configured by SAM, but you may want to:

### 5.1 Enable CloudWatch Logs

1. Go to API Gateway Console
2. Select your API
3. Go to **Settings**
4. Enable **CloudWatch log role ARN**
5. Select **INFO** level logging

### 5.2 Configure Throttling (Optional)

1. Go to **Stages** → **prod**
2. Set **Throttle Settings**:
   - Rate: 1000 requests per second
   - Burst: 2000 requests

### 5.3 Set Up Custom Domain (Optional)

1. Request SSL certificate in AWS Certificate Manager
2. In API Gateway, go to **Custom domain names**
3. Create custom domain
4. Map to your API stage

---

## 6. Update Frontend Code

### 6.1 Install AWS Amplify

```bash
npm install aws-amplify @aws-amplify/ui-react
```

### 6.2 Update Environment Variables

Create/update `.env`:

```env
VITE_AWS_REGION=us-east-1
VITE_COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx
VITE_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_API_GATEWAY_URL=https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/prod
```

### 6.3 Create Amplify Configuration

Create `src/aws-config.ts`:

```typescript
import { Amplify } from 'aws-amplify';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
      userPoolClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
      signUpVerificationMethod: 'code',
      loginWith: {
        email: true,
      },
    },
  },
  API: {
    REST: {
      homeschoolApi: {
        endpoint: import.meta.env.VITE_API_GATEWAY_URL,
        region: import.meta.env.VITE_AWS_REGION,
      },
    },
  },
});
```

### 6.4 Replace Firebase Auth with Cognito

This will require updating:
- `src/contexts/AuthContext.tsx` - Replace Firebase auth calls with Amplify
- `src/components/auth/Login.tsx` - Update sign-in logic
- `src/components/auth/Signup.tsx` - Update sign-up logic
- All API calls to use API Gateway instead of local state

---

## 7. Deploy to S3

### 7.1 Create S3 Bucket

```bash
# Create bucket (must be globally unique name)
aws s3 mb s3://homeschool-tracker-frontend-YOUR-NAME --region us-east-1

# Enable static website hosting
aws s3 website s3://homeschool-tracker-frontend-YOUR-NAME \
    --index-document index.html \
    --error-document index.html
```

### 7.2 Configure Bucket Policy

Create `bucket-policy.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::homeschool-tracker-frontend-YOUR-NAME/*"
    }
  ]
}
```

Apply policy:
```bash
aws s3api put-bucket-policy \
    --bucket homeschool-tracker-frontend-YOUR-NAME \
    --policy file://bucket-policy.json
```

### 7.3 Build and Deploy Frontend

```bash
# Build
npm run build

# Upload to S3
aws s3 sync dist/ s3://homeschool-tracker-frontend-YOUR-NAME --delete

# Set proper MIME types for files
aws s3 cp s3://homeschool-tracker-frontend-YOUR-NAME \
    s3://homeschool-tracker-frontend-YOUR-NAME \
    --recursive \
    --metadata-directive REPLACE \
    --content-type "text/html" \
    --exclude "*" \
    --include "*.html"
```

### 7.4 Get Website URL

```bash
echo "http://homeschool-tracker-frontend-YOUR-NAME.s3-website-us-east-1.amazonaws.com"
```

---

## 8. Set Up CloudFront (Optional but Recommended)

### 8.1 Request SSL Certificate

1. Go to [AWS Certificate Manager](https://console.aws.amazon.com/acm/)
2. Request certificate
3. Domain name: `yourdomain.com` or `*.yourdomain.com`
4. Validation: DNS (easier) or Email
5. Complete validation
6. Wait for status: **Issued**

### 8.2 Create CloudFront Distribution

```bash
aws cloudfront create-distribution \
    --origin-domain-name homeschool-tracker-frontend-YOUR-NAME.s3.amazonaws.com \
    --default-root-object index.html
```

Or use AWS Console:
1. Go to [CloudFront Console](https://console.aws.amazon.com/cloudfront/)
2. Create distribution
3. Origin domain: Your S3 bucket
4. Origin access: Public
5. Default root object: index.html
6. SSL certificate: Custom (select your ACM cert)
7. Create distribution

### 8.3 Update Bucket Policy

Update bucket policy to only allow CloudFront access (more secure).

### 8.4 Configure Custom Error Pages

In CloudFront:
- Error code: 403
- Response page path: /index.html
- Response code: 200

---

## 9. Testing

### 9.1 Test Authentication

1. Go to your website URL
2. Click **Sign Up**
3. Create an account
4. Check email for verification code
5. Sign in
6. Verify JWT token is sent with API calls

### 9.2 Test API Endpoints

```bash
# Get auth token from browser (Developer Tools → Application → Cookies)
TOKEN="your-cognito-id-token"

# Test students endpoint
curl -H "Authorization: Bearer $TOKEN" \
     https://your-api-url.execute-api.us-east-1.amazonaws.com/prod/students

# Create a student
curl -X POST \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"name":"John Doe","grade":"5th"}' \
     https://your-api-url.execute-api.us-east-1.amazonaws.com/prod/students
```

### 9.3 Test DynamoDB

Check if data is being written:

```bash
aws dynamodb scan --table-name homeschool-students --region us-east-1
```

---

## 10. Monitoring and Maintenance

### 10.1 Set Up CloudWatch Alarms

```bash
# Lambda errors
aws cloudwatch put-metric-alarm \
    --alarm-name homeschool-lambda-errors \
    --alarm-description "Alert on Lambda errors" \
    --metric-name Errors \
    --namespace AWS/Lambda \
    --statistic Sum \
    --period 300 \
    --evaluation-periods 1 \
    --threshold 5 \
    --comparison-operator GreaterThanThreshold

# API Gateway 5xx errors
aws cloudwatch put-metric-alarm \
    --alarm-name homeschool-api-5xx-errors \
    --alarm-description "Alert on API 5xx errors" \
    --metric-name 5XXError \
    --namespace AWS/ApiGateway \
    --statistic Sum \
    --period 300 \
    --evaluation-periods 1 \
    --threshold 10 \
    --comparison-operator GreaterThanThreshold
```

### 10.2 Regular Maintenance

- Review CloudWatch logs weekly
- Monitor DynamoDB capacity
- Update Lambda runtime when new versions available
- Review security bulletins
- Backup DynamoDB data (enable Point-in-Time Recovery)

### 10.3 Enable DynamoDB Backups

```bash
aws dynamodb update-continuous-backups \
    --table-name homeschool-students \
    --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true

# Repeat for other tables
```

---

## Troubleshooting

### Issue: CORS Errors
**Solution**: Verify API Gateway CORS settings and OPTIONS method

### Issue: Cognito Authentication Fails
**Solution**: Check app client settings and callback URLs

### Issue: Lambda Timeout
**Solution**: Increase timeout in SAM template and redeploy

### Issue: DynamoDB Throttling
**Solution**: Switch to provisioned capacity or increase on-demand limits

### Issue: S3 403 Errors
**Solution**: Check bucket policy and public access settings

---

## Deployment Checklist

- [ ] DynamoDB tables created
- [ ] Cognito User Pool configured
- [ ] Lambda functions deployed
- [ ] API Gateway endpoint working
- [ ] Frontend updated with Amplify
- [ ] S3 bucket created and configured
- [ ] CloudFront distribution set up (optional)
- [ ] SSL certificate installed
- [ ] Custom domain configured (optional)
- [ ] Authentication tested
- [ ] API endpoints tested
- [ ] CloudWatch alarms configured
- [ ] DynamoDB backups enabled

---

## Cost Optimization Tips

1. Use CloudFront free tier (1TB data transfer)
2. Enable DynamoDB on-demand billing (pay only for what you use)
3. Set Lambda memory to minimum required
4. Use S3 Intelligent-Tiering for objects
5. Enable API Gateway caching for frequently accessed data
6. Delete old CloudWatch logs after 30 days
7. Use AWS Budgets to set spending alerts

---

## Next Steps

After successful deployment:
1. Set up CI/CD with GitHub Actions
2. Implement additional features
3. Add monitoring dashboards
4. Set up automated backups
5. Configure disaster recovery plan
