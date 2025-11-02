# Serverless Framework Quick Start

This is a condensed guide to get your backend up and running quickly with Serverless Framework.

## Prerequisites

- AWS Account
- Node.js 20.x
- AWS CLI configured

## Quick Setup (5 Steps)

### 1. Install Serverless Framework

```bash
npm install -g serverless
```

### 2. Create Backend Directory Structure

```bash
# Create directory
mkdir backend
cd backend

# Initialize project
npm init -y

# Install dependencies
npm install @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb

# Install dev dependencies
npm install -D serverless-offline serverless-plugin-log-retention
```

### 3. Create serverless.yml

Copy the `serverless.yml` from `SERVERLESS_DEPLOYMENT_GUIDE.md` or use this minimal version:

```yaml
service: homeschool-tracker

provider:
  name: aws
  runtime: nodejs20.x
  region: us-east-1
  stage: ${opt:stage, 'dev'}

  environment:
    STUDENTS_TABLE: homeschool-students-${self:provider.stage}
    SUBJECTS_TABLE: homeschool-subjects-${self:provider.stage}
    TIME_ENTRIES_TABLE: homeschool-time-entries-${self:provider.stage}
    SETTINGS_TABLE: homeschool-settings-${self:provider.stage}

  iam:
    role:
      statements:
        - Effect: Allow
          Action:
            - dynamodb:*
          Resource: '*'

plugins:
  - serverless-offline

functions:
  students:
    handler: functions/students/handler.main
    events:
      - http:
          path: students
          method: any
          cors: true

resources:
  Resources:
    StudentsTable:
      Type: AWS::DynamoDB::Table
      Properties:
        TableName: homeschool-students-${self:provider.stage}
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
```

### 4. Create Your First Function

Create `functions/students/handler.js`:

```javascript
export const main = async (event) => {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({
      message: 'Students endpoint works!',
      event: event,
    }),
  };
};
```

### 5. Deploy

```bash
# Deploy to dev
serverless deploy

# Deploy to production
serverless deploy --stage prod
```

That's it! You now have a working Lambda function with API Gateway and DynamoDB.

---

## Testing Your Deployment

After deployment, you'll see an API endpoint like:
```
https://abc123.execute-api.us-east-1.amazonaws.com/dev/students
```

Test it:
```bash
curl https://your-api-url.amazonaws.com/dev/students
```

---

## Local Development

```bash
# Start local server
serverless offline

# Test locally
curl http://localhost:3001/students
```

---

## Project Structure

```
backend/
├── serverless.yml           # Infrastructure config
├── package.json
├── functions/
│   ├── students/
│   │   └── handler.js
│   ├── subjects/
│   │   └── handler.js
│   └── timeEntries/
│       └── handler.js
├── lib/
│   ├── dynamodb.js         # Shared utilities
│   ├── response.js
│   └── validation.js
└── resources/
    ├── dynamodb.yml        # DynamoDB tables
    └── cognito.yml         # Cognito User Pool
```

---

## Common Commands

```bash
# Deploy
serverless deploy

# Deploy single function (faster)
serverless deploy function -f students

# Test locally
serverless offline

# View logs
serverless logs -f students --tail

# Remove everything
serverless remove

# Get info
serverless info
```

---

## Next Steps

1. ✅ Basic setup complete
2. Add more functions (subjects, time-entries, reports)
3. Add DynamoDB tables (see full guide)
4. Add Cognito authentication (see full guide)
5. Implement full CRUD operations
6. Update frontend to use API

---

## Troubleshooting

### Error: "Serverless command not found"
```bash
npm install -g serverless
```

### Error: "AWS credentials not configured"
```bash
aws configure
# or
serverless config credentials --provider aws --key KEY --secret SECRET
```

### Error: "Table already exists"
Remove the stack and redeploy:
```bash
serverless remove
serverless deploy
```

### Function timeout
Increase timeout in serverless.yml:
```yaml
functions:
  students:
    timeout: 30  # 30 seconds
```

---

## Full Documentation

- Complete setup: `SERVERLESS_DEPLOYMENT_GUIDE.md`
- Lambda functions: `LAMBDA_FUNCTIONS_GUIDE.md`
- Frontend integration: `FRONTEND_MIGRATION_GUIDE.md`
- Architecture: `AWS_ARCHITECTURE.md`

---

## Cost Estimate

With Serverless Framework on AWS:

| Service | Free Tier | Cost (beyond free tier) |
|---------|-----------|------------------------|
| Lambda | 1M requests/month | $0.20 per 1M requests |
| API Gateway | 1M requests/month | $3.50 per 1M requests |
| DynamoDB | 25 GB storage | $0.25 per GB |
| Cognito | 50k MAUs | $0.0055 per MAU |

**Estimated monthly cost for small app: $0-10**

---

## Production Checklist

- [ ] Set up multiple stages (dev, staging, prod)
- [ ] Enable DynamoDB Point-in-Time Recovery
- [ ] Set up CloudWatch alarms
- [ ] Enable API Gateway logging
- [ ] Set up CI/CD pipeline
- [ ] Configure custom domain
- [ ] Enable X-Ray tracing
- [ ] Set up backup strategy
- [ ] Review IAM permissions (principle of least privilege)
- [ ] Enable API throttling
- [ ] Set up monitoring dashboards

---

## Support & Resources

- [Serverless Framework Docs](https://www.serverless.com/framework/docs)
- [AWS Lambda Docs](https://docs.aws.amazon.com/lambda/)
- [Serverless Examples](https://github.com/serverless/examples)
- [Serverless Forum](https://forum.serverless.com/)

---

## Quick Tips

1. **Use stages**: Always deploy to `dev` first, then `prod`
2. **Keep functions small**: Split by functionality
3. **Use shared code**: Put common code in `lib/`
4. **Log everything**: Use `console.log()` liberally
5. **Test locally first**: Use `serverless offline`
6. **Monitor costs**: Set up AWS Budgets
7. **Version control**: Always commit before deploying
8. **Use environment variables**: Never hardcode secrets
