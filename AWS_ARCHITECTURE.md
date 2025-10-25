# AWS Architecture Plan - Homeschool Time Tracker

## Overview

This document outlines the architecture for deploying the Homeschool Time Tracker application on AWS using serverless services.

## Architecture Components

```
┌─────────────┐
│   User      │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│   CloudFront CDN    │ (Optional but recommended)
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│   S3 Static Site    │ (React Frontend)
└─────────────────────┘
       │
       ▼
┌─────────────────────┐
│   AWS Cognito       │ (Authentication)
└─────────────────────┘
       │
       ▼
┌─────────────────────┐
│   API Gateway       │ (REST API)
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│   Lambda Functions  │ (Business Logic)
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│   DynamoDB Tables   │ (Data Storage)
└─────────────────────┘
```

## 1. Frontend Hosting (S3 + CloudFront)

### S3 Bucket Configuration
- **Bucket Name**: `homeschool-tracker-frontend` (must be globally unique)
- **Static Website Hosting**: Enabled
- **Public Access**: Blocked (access via CloudFront only)
- **CORS**: Configured for API requests

### CloudFront Distribution (Recommended)
- **Origin**: S3 bucket
- **SSL Certificate**: AWS Certificate Manager (free)
- **Custom Domain**: Optional (e.g., tracker.yourdomain.com)
- **Benefits**: HTTPS, CDN caching, better performance

**Cost Estimate**: ~$0.50-$2/month for low traffic

## 2. Authentication (AWS Cognito)

### Cognito User Pool
- **Purpose**: User registration, login, password management
- **Features**:
  - Email/password authentication
  - OAuth 2.0 / OIDC support
  - Social identity providers (Google, Facebook, etc.)
  - Multi-factor authentication (optional)
  - Password policies and validation

### Configuration
```yaml
User Pool Settings:
  - Sign-in: Email
  - Password: Min 8 characters, require uppercase, lowercase, number
  - MFA: Optional
  - Email Verification: Required
  - Self-registration: Enabled

App Client:
  - Type: Public client (SPA)
  - Auth Flows: USER_SRP_AUTH, REFRESH_TOKEN_AUTH
  - OAuth Scopes: openid, email, profile
```

### Identity Pool (Optional)
- If you need direct AWS service access from frontend
- Maps Cognito users to IAM roles

**Cost Estimate**: Free for first 50,000 MAUs, then $0.0055/MAU

## 3. API Gateway

### REST API Structure

```
Base URL: https://api-id.execute-api.us-east-1.amazonaws.com/prod

Endpoints:
├── /students
│   ├── GET     /students              (List all students)
│   ├── POST    /students              (Create student)
│   ├── GET     /students/{id}         (Get student)
│   ├── PUT     /students/{id}         (Update student)
│   └── DELETE  /students/{id}         (Delete student)
│
├── /subjects
│   ├── GET     /subjects              (List all subjects)
│   ├── POST    /subjects              (Create subject)
│   ├── GET     /subjects/{id}         (Get subject)
│   ├── PUT     /subjects/{id}         (Update subject)
│   └── DELETE  /subjects/{id}         (Delete subject)
│
├── /time-entries
│   ├── GET     /time-entries          (List entries with filters)
│   ├── POST    /time-entries          (Create entry)
│   ├── GET     /time-entries/{id}     (Get entry)
│   ├── PUT     /time-entries/{id}     (Update entry)
│   └── DELETE  /time-entries/{id}     (Delete entry)
│
├── /reports
│   ├── GET     /reports/summary       (Dashboard summary)
│   ├── GET     /reports/by-student    (Student report)
│   ├── GET     /reports/by-subject    (Subject report)
│   └── GET     /reports/export        (Export data)
│
└── /settings
    ├── GET     /settings              (Get user settings)
    └── PUT     /settings              (Update settings)
```

### Security
- **Authorizer**: Cognito User Pool authorizer
- **CORS**: Enabled for frontend domain
- **Throttling**: 10,000 requests/second (adjustable)
- **API Keys**: Optional for additional security

**Cost Estimate**: $3.50 per million requests + $0.09/GB data transfer

## 4. Lambda Functions

### Function Architecture

Each endpoint will have its own Lambda function for better isolation and scaling.

#### Core Functions

1. **students-manager** (Node.js 20.x)
   - Handles all student CRUD operations
   - Memory: 256 MB
   - Timeout: 10 seconds

2. **subjects-manager** (Node.js 20.x)
   - Handles all subject CRUD operations
   - Memory: 256 MB
   - Timeout: 10 seconds

3. **time-entries-manager** (Node.js 20.x)
   - Handles time entry CRUD operations
   - Memory: 512 MB (might process more data)
   - Timeout: 15 seconds

4. **reports-generator** (Node.js 20.x)
   - Generates reports and analytics
   - Memory: 1024 MB (aggregations can be memory intensive)
   - Timeout: 30 seconds

5. **settings-manager** (Node.js 20.x)
   - Handles user settings
   - Memory: 128 MB
   - Timeout: 10 seconds

### Lambda Layer (Shared Dependencies)
- AWS SDK v3
- DynamoDB Document Client
- Shared utilities and validation

### Environment Variables
```
DYNAMODB_TABLE_STUDENTS=homeschool-students
DYNAMODB_TABLE_SUBJECTS=homeschool-subjects
DYNAMODB_TABLE_TIME_ENTRIES=homeschool-time-entries
DYNAMODB_TABLE_SETTINGS=homeschool-settings
REGION=us-east-1
```

**Cost Estimate**: Free tier: 1M requests + 400,000 GB-seconds/month
Beyond free tier: $0.20 per 1M requests + $0.0000166667/GB-second

## 5. DynamoDB Tables

### Table Design

#### Table 1: Students
```
Table Name: homeschool-students
Partition Key: userId (String)
Sort Key: studentId (String)

Attributes:
- userId: String (Cognito user ID)
- studentId: String (UUID)
- name: String
- grade: String
- birthDate: String (ISO 8601)
- color: String (hex color)
- active: Boolean
- createdAt: Number (timestamp)
- updatedAt: Number (timestamp)

Capacity: On-Demand (pay per request)

GSI: None (queries by userId only)
```

#### Table 2: Subjects
```
Table Name: homeschool-subjects
Partition Key: userId (String)
Sort Key: subjectId (String)

Attributes:
- userId: String
- subjectId: String (UUID)
- name: String
- category: String
- color: String (hex color)
- active: Boolean
- requiredHours: Number (optional, annual goal)
- createdAt: Number
- updatedAt: Number

Capacity: On-Demand
```

#### Table 3: TimeEntries
```
Table Name: homeschool-time-entries
Partition Key: userId (String)
Sort Key: entryId (String)

Attributes:
- userId: String
- entryId: String (UUID)
- studentId: String
- subjectId: String
- date: String (YYYY-MM-DD)
- hours: Number (decimal)
- minutes: Number
- notes: String
- createdAt: Number
- updatedAt: Number

Capacity: On-Demand

GSI 1: UserDateIndex
- Partition Key: userId
- Sort Key: date
- Purpose: Query entries by date range

GSI 2: StudentSubjectIndex
- Partition Key: userId#studentId
- Sort Key: date
- Purpose: Query entries by student

GSI 3: SubjectDateIndex
- Partition Key: userId#subjectId
- Sort Key: date
- Purpose: Query entries by subject
```

#### Table 4: Settings
```
Table Name: homeschool-settings
Partition Key: userId (String)
Sort Key: settingKey (String)

Attributes:
- userId: String
- settingKey: String (e.g., "preferences", "notifications")
- settingValue: Map (JSON object)
- updatedAt: Number

Capacity: On-Demand
```

### DynamoDB Best Practices
- Use composite sort keys for efficient queries (userId#entityId)
- Single-table design could be used for smaller apps
- Use sparse indexes for optional attributes
- Implement optimistic locking with version numbers
- Use batch operations for bulk reads/writes

**Cost Estimate**:
- On-Demand: $1.25 per million write requests, $0.25 per million read requests
- Storage: $0.25 per GB-month
- Estimate: ~$1-5/month for typical usage

## 6. IAM Roles and Permissions

### Lambda Execution Role
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query",
        "dynamodb:Scan",
        "dynamodb:BatchGetItem",
        "dynamodb:BatchWriteItem"
      ],
      "Resource": [
        "arn:aws:dynamodb:*:*:table/homeschool-*",
        "arn:aws:dynamodb:*:*:table/homeschool-*/index/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    }
  ]
}
```

## 7. Monitoring and Logging

### CloudWatch
- Lambda function logs
- API Gateway access logs
- X-Ray tracing (optional)
- Custom metrics (API latency, error rates)
- Alarms for errors and throttling

### Recommended Alarms
- Lambda errors > 5 in 5 minutes
- API Gateway 4XX/5XX errors > 10 in 5 minutes
- DynamoDB throttled requests > 0

## 8. Security Considerations

### Frontend Security
- HTTPS only (enforced by CloudFront)
- Content Security Policy headers
- No sensitive data in frontend code
- Cognito tokens stored securely (httpOnly cookies or secure storage)

### API Security
- Cognito authentication required for all endpoints
- User can only access their own data (userId validation)
- Input validation in Lambda functions
- SQL injection not applicable (NoSQL)
- Rate limiting via API Gateway

### DynamoDB Security
- Encryption at rest (enabled by default)
- Encryption in transit (TLS)
- IAM-based access control
- VPC endpoints (optional for private access)

## 9. CI/CD Pipeline (Optional)

### GitHub Actions Workflow
```yaml
Build → Test → Deploy to S3 → Invalidate CloudFront
```

### AWS SAM or Serverless Framework
- Infrastructure as Code
- Automated Lambda deployments
- Environment management (dev, staging, prod)

## 10. Cost Estimation Summary

### Monthly Costs (Estimated for 1-10 users, moderate usage)

| Service | Estimated Cost |
|---------|---------------|
| S3 Storage | $0.10 - $0.50 |
| CloudFront | $0.50 - $2.00 |
| Cognito | Free (under 50k MAUs) |
| API Gateway | $1.00 - $5.00 |
| Lambda | Free tier / $0.50 - $2.00 |
| DynamoDB | $1.00 - $5.00 |
| **Total** | **$3 - $15/month** |

**Note**: Most services have free tiers that cover low traffic applications.

## 11. Deployment Strategy

### Phase 1: Infrastructure Setup
1. Create DynamoDB tables
2. Set up Cognito User Pool
3. Deploy Lambda functions
4. Configure API Gateway
5. Set up IAM roles and permissions

### Phase 2: Frontend Updates
1. Replace Firebase Auth with AWS Amplify/Cognito
2. Update API calls to use API Gateway endpoints
3. Handle authentication tokens
4. Update environment variables

### Phase 3: Deployment
1. Build React application
2. Upload to S3 bucket
3. Configure CloudFront distribution
4. Set up custom domain (optional)
5. Test authentication and API calls

### Phase 4: Migration (if existing users)
1. Export data from Firebase (if applicable)
2. Import data to DynamoDB
3. Notify users of migration
4. Monitor for issues

## 12. Development Environment

### Local Development
- Use AWS SAM CLI for local Lambda testing
- DynamoDB Local for database testing
- Mock Cognito with environment variables
- Serverless Offline plugin

### Environment Variables (.env.local)
```
VITE_AWS_REGION=us-east-1
VITE_COGNITO_USER_POOL_ID=us-east-1_xxxxx
VITE_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxx
VITE_API_GATEWAY_URL=https://xxxxx.execute-api.us-east-1.amazonaws.com/prod
```

## Next Steps

1. Review this architecture plan
2. Confirm AWS account setup and permissions
3. Choose deployment method (AWS Console, SAM, Serverless Framework, Terraform)
4. Decide on CI/CD requirements
5. Begin implementation phase

## Resources

- [AWS Amplify Documentation](https://docs.amplify.aws/)
- [AWS SAM Documentation](https://docs.aws.amazon.com/serverless-application-model/)
- [DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)
- [API Gateway REST API Guide](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-rest-api.html)
