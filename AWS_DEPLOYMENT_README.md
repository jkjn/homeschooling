# AWS Deployment - Complete Guide Collection

This directory contains comprehensive documentation for deploying the Homeschool Time Tracker to AWS.

## 📚 Available Documentation

### Getting Started
- **[SAM_VS_SERVERLESS.md](SAM_VS_SERVERLESS.md)** - Compare deployment tools and choose the right one
- **[AWS_ARCHITECTURE.md](AWS_ARCHITECTURE.md)** - Complete architecture overview and design decisions

### Deployment Guides

#### Option 1: Serverless Framework (Recommended for Beginners)
1. **[SERVERLESS_QUICKSTART.md](SERVERLESS_QUICKSTART.md)** - ⚡ Get started in 5 minutes
2. **[SERVERLESS_DEPLOYMENT_GUIDE.md](SERVERLESS_DEPLOYMENT_GUIDE.md)** - Complete deployment instructions

#### Option 2: AWS SAM (For AWS Experts)
1. **[AWS_DEPLOYMENT_GUIDE.md](AWS_DEPLOYMENT_GUIDE.md)** - Step-by-step SAM deployment

### Implementation Guides
- **[LAMBDA_FUNCTIONS_GUIDE.md](LAMBDA_FUNCTIONS_GUIDE.md)** - Lambda function code and structure
- **[FRONTEND_MIGRATION_GUIDE.md](FRONTEND_MIGRATION_GUIDE.md)** - Update frontend for AWS Cognito

### Templates
- **[backend-template-package.json](backend-template-package.json)** - Backend package.json template

---

## 🚀 Quick Decision Tree

```
Do you want the easiest path?
├─ Yes → Use Serverless Framework
│   └─ Start with: SERVERLESS_QUICKSTART.md
│
└─ No, I want full AWS control
    └─ Use AWS SAM
        └─ Start with: AWS_DEPLOYMENT_GUIDE.md

Need to compare first?
└─ Read: SAM_VS_SERVERLESS.md
```

---

## 📖 Suggested Reading Order

### For Complete Beginners

1. **[AWS_ARCHITECTURE.md](AWS_ARCHITECTURE.md)**
   - Understand what you're building
   - Learn about costs (~$3-15/month)
   - Review the architecture diagram

2. **[SAM_VS_SERVERLESS.md](SAM_VS_SERVERLESS.md)**
   - Choose your deployment tool
   - Most users should choose Serverless Framework

3. **[SERVERLESS_QUICKSTART.md](SERVERLESS_QUICKSTART.md)**
   - Get your first Lambda function deployed in 5 minutes
   - Test the deployment

4. **[SERVERLESS_DEPLOYMENT_GUIDE.md](SERVERLESS_DEPLOYMENT_GUIDE.md)**
   - Build the complete backend
   - Set up all tables and functions

5. **[LAMBDA_FUNCTIONS_GUIDE.md](LAMBDA_FUNCTIONS_GUIDE.md)**
   - Implement the Lambda functions
   - Add CRUD operations

6. **[FRONTEND_MIGRATION_GUIDE.md](FRONTEND_MIGRATION_GUIDE.md)**
   - Update React app for AWS Cognito
   - Connect frontend to API Gateway

### For AWS Experts

1. **[AWS_ARCHITECTURE.md](AWS_ARCHITECTURE.md)** - Review architecture
2. **[AWS_DEPLOYMENT_GUIDE.md](AWS_DEPLOYMENT_GUIDE.md)** - Deploy with SAM
3. **[LAMBDA_FUNCTIONS_GUIDE.md](LAMBDA_FUNCTIONS_GUIDE.md)** - Implement functions
4. **[FRONTEND_MIGRATION_GUIDE.md](FRONTEND_MIGRATION_GUIDE.md)** - Update frontend

---

## 🎯 Your Next Steps

### Step 1: Choose Your Path

**Path A: Serverless Framework (Recommended)**
```bash
# Install Serverless
npm install -g serverless

# Follow the quickstart guide
# → SERVERLESS_QUICKSTART.md
```

**Path B: AWS SAM**
```bash
# Install SAM CLI
brew install aws-sam-cli  # macOS
# or download from AWS

# Follow the deployment guide
# → AWS_DEPLOYMENT_GUIDE.md
```

### Step 2: Set Up AWS

Both paths require:
- AWS Account
- AWS CLI configured
- Node.js 20.x installed

```bash
# Configure AWS credentials
aws configure
```

### Step 3: Deploy Backend

**Serverless Framework:**
```bash
cd backend
serverless deploy
```

**AWS SAM:**
```bash
cd backend
sam build && sam deploy --guided
```

### Step 4: Update Frontend

Follow: **[FRONTEND_MIGRATION_GUIDE.md](FRONTEND_MIGRATION_GUIDE.md)**

---

## 🏗️ Architecture Overview

```
┌─────────────┐
│   User      │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│   CloudFront CDN    │ (Optional)
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│   S3 Static Site    │ (React App)
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

**Components:**
- **Frontend**: React app hosted on S3 + CloudFront
- **Authentication**: AWS Cognito User Pools
- **API**: API Gateway + Lambda functions
- **Database**: DynamoDB (4 tables)

**Estimated Cost**: $3-15/month for typical usage

---

## 📊 Comparison: Serverless vs SAM

| Feature | Serverless Framework | AWS SAM |
|---------|---------------------|---------|
| **Ease of Use** | ⭐⭐⭐⭐⭐ Easy | ⭐⭐⭐ Moderate |
| **Deployment Speed** | ⭐⭐⭐⭐⭐ Fast | ⭐⭐⭐⭐ Good |
| **Learning Curve** | ⭐⭐⭐⭐⭐ Gentle | ⭐⭐⭐ Steep |
| **AWS Integration** | ⭐⭐⭐⭐ Good | ⭐⭐⭐⭐⭐ Excellent |
| **Plugin Ecosystem** | ⭐⭐⭐⭐⭐ 350+ | ⭐⭐ Limited |
| **Community** | ⭐⭐⭐⭐⭐ Large | ⭐⭐⭐ Growing |

**Recommendation**: Serverless Framework for this project

---

## 🔧 Tools You'll Need

### Required
- [Node.js 20+](https://nodejs.org/)
- [AWS CLI](https://aws.amazon.com/cli/)
- [Git](https://git-scm.com/)
- AWS Account

### Choose One
- [Serverless Framework](https://www.serverless.com/) - Recommended
- [AWS SAM CLI](https://aws.amazon.com/serverless/sam/) - Alternative

### Optional
- [Docker](https://www.docker.com/) - For SAM local testing
- [Postman](https://www.postman.com/) - API testing
- [AWS Console Mobile App](https://aws.amazon.com/console/mobile/) - Monitor on the go

---

## 💰 Cost Breakdown

### Free Tier (First Year)
- Lambda: 1M requests/month
- API Gateway: 1M requests/month
- DynamoDB: 25 GB storage
- Cognito: 50k MAUs
- S3: 5 GB storage
- CloudFront: 1 TB transfer

### After Free Tier (Typical Small App)

| Service | Monthly Cost |
|---------|-------------|
| S3 + CloudFront | $0.50 - $2 |
| Lambda | $0.50 - $2 |
| API Gateway | $1 - $5 |
| DynamoDB | $1 - $5 |
| Cognito | Free (under 50k users) |
| **Total** | **$3 - $15** |

### Cost Optimization Tips
1. Use on-demand billing for DynamoDB
2. Enable CloudFront caching
3. Set Lambda memory appropriately
4. Delete old Lambda versions
5. Use AWS Budgets for alerts

---

## 🔒 Security Checklist

- [ ] Enable MFA on AWS account
- [ ] Use IAM roles (not access keys)
- [ ] Enable CloudTrail logging
- [ ] Set up AWS Budgets
- [ ] Enable DynamoDB encryption
- [ ] Configure API Gateway throttling
- [ ] Use environment variables for secrets
- [ ] Enable CloudWatch alarms
- [ ] Set up VPC (optional)
- [ ] Configure CORS properly

---

## 📝 Project Status Tracking

### Phase 1: Infrastructure Setup
- [ ] DynamoDB tables created
- [ ] Cognito User Pool configured
- [ ] Lambda functions deployed
- [ ] API Gateway configured
- [ ] IAM roles set up

### Phase 2: Backend Implementation
- [ ] Students CRUD operations
- [ ] Subjects CRUD operations
- [ ] Time Entries CRUD operations
- [ ] Reports generation
- [ ] Settings management

### Phase 3: Frontend Migration
- [ ] Install AWS Amplify
- [ ] Replace Firebase Auth with Cognito
- [ ] Update API calls
- [ ] Test authentication flow
- [ ] Test all features

### Phase 4: Deployment
- [ ] Deploy backend to dev
- [ ] Test in dev environment
- [ ] Deploy backend to prod
- [ ] Deploy frontend to S3
- [ ] Configure CloudFront
- [ ] Set up custom domain (optional)

### Phase 5: Monitoring
- [ ] CloudWatch dashboards
- [ ] CloudWatch alarms
- [ ] Log aggregation
- [ ] Error tracking
- [ ] Performance monitoring

---

## 🐛 Troubleshooting

### Common Issues

**1. AWS Credentials Not Found**
```bash
aws configure
# Enter your credentials
```

**2. Serverless Command Not Found**
```bash
npm install -g serverless
```

**3. Lambda Timeout**
- Increase timeout in configuration
- Optimize function code
- Check DynamoDB response times

**4. CORS Errors**
- Verify API Gateway CORS settings
- Check OPTIONS method
- Verify headers

**5. Cognito Authentication Fails**
- Check User Pool ID and Client ID
- Verify callback URLs
- Check Amplify configuration

### Getting Help

- Check CloudWatch Logs
- Review AWS documentation
- Search Stack Overflow
- Ask in Serverless Forum
- Review AWS Support

---

## 📚 Additional Resources

### AWS Documentation
- [Lambda Developer Guide](https://docs.aws.amazon.com/lambda/)
- [DynamoDB Developer Guide](https://docs.aws.amazon.com/dynamodb/)
- [API Gateway Developer Guide](https://docs.aws.amazon.com/apigateway/)
- [Cognito Developer Guide](https://docs.aws.amazon.com/cognito/)

### Community Resources
- [Serverless Framework Docs](https://www.serverless.com/framework/docs)
- [AWS SAM Documentation](https://docs.aws.amazon.com/serverless-application-model/)
- [AWS Amplify Docs](https://docs.amplify.aws/)
- [Serverless Stack Guide](https://serverless-stack.com/)

### Video Tutorials
- [Serverless Framework Crash Course](https://www.youtube.com/results?search_query=serverless+framework+tutorial)
- [AWS Lambda Tutorial](https://www.youtube.com/results?search_query=aws+lambda+tutorial)
- [DynamoDB Tutorial](https://www.youtube.com/results?search_query=dynamodb+tutorial)

---

## 🎓 Learning Path

### Week 1: Foundations
- Read AWS_ARCHITECTURE.md
- Set up AWS account
- Deploy first Lambda function
- Create DynamoDB table

### Week 2: Backend
- Implement all Lambda functions
- Set up Cognito
- Configure API Gateway
- Test endpoints

### Week 3: Frontend
- Install AWS Amplify
- Replace Firebase Auth
- Update API calls
- Test integration

### Week 4: Production
- Deploy to production
- Set up monitoring
- Configure CI/CD
- Performance testing

---

## ✅ Pre-Deployment Checklist

### AWS Account Setup
- [ ] AWS account created
- [ ] Billing alerts configured
- [ ] IAM user created (not root)
- [ ] AWS CLI configured
- [ ] Region selected

### Development Environment
- [ ] Node.js 20+ installed
- [ ] Git configured
- [ ] Code editor set up
- [ ] Terminal/command line ready

### Project Setup
- [ ] Backend directory created
- [ ] Dependencies installed
- [ ] Configuration files ready
- [ ] Environment variables set

### Knowledge Check
- [ ] Read architecture guide
- [ ] Chose deployment tool
- [ ] Understand AWS services
- [ ] Know basic Lambda concepts

---

## 🚦 Current Project Status

✅ **Completed:**
- Firebase authentication removed
- App reverted to no-auth state
- AWS documentation created
- Deployment guides written
- Architecture designed

🔄 **In Progress:**
- Awaiting user to choose deployment path

⏳ **Next Steps:**
1. Choose: Serverless Framework or AWS SAM
2. Set up AWS account
3. Deploy backend infrastructure
4. Implement Lambda functions
5. Update frontend for AWS Cognito

---

## 💡 Pro Tips

1. **Start Small**: Deploy one function first, then expand
2. **Use Dev Stage**: Always test in dev before prod
3. **Log Everything**: Use console.log liberally
4. **Monitor Costs**: Set up AWS Budgets on day 1
5. **Version Control**: Commit before every deployment
6. **Test Locally**: Use serverless-offline or sam-local
7. **Document**: Keep notes of what works
8. **Backup**: Enable DynamoDB PITR from the start

---

## 🤝 Contributing

Have improvements or found issues?
- Create an issue
- Submit a pull request
- Update documentation
- Share your experience

---

## 📞 Support

Need help? Here's the priority order:

1. **Check this documentation** - Most answers are here
2. **CloudWatch Logs** - Check Lambda logs first
3. **AWS Documentation** - Official AWS docs
4. **Stack Overflow** - Search for similar issues
5. **AWS Forums** - Ask AWS community
6. **GitHub Issues** - Report bugs in tools

---

## 🎉 Ready to Deploy?

**Choose your path:**

### Quick Start (Serverless Framework)
```bash
npm install -g serverless
cd backend
serverless deploy
```
→ Continue with [SERVERLESS_QUICKSTART.md](SERVERLESS_QUICKSTART.md)

### Full Control (AWS SAM)
```bash
brew install aws-sam-cli
cd backend
sam build && sam deploy --guided
```
→ Continue with [AWS_DEPLOYMENT_GUIDE.md](AWS_DEPLOYMENT_GUIDE.md)

---

**Good luck with your deployment! 🚀**
