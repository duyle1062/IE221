# IE221 Infrastructure Documentation

This directory contains the infrastructure-as-code (IaC) for the IE221 Foodi application, including AWS CloudFormation templates and GitHub Actions CI/CD workflows.

## Overview

The infrastructure follows a modern cloud architecture pattern with:
- **3-tier VPC architecture** for network isolation
- **Containerized application** deployment using ECS Fargate
- **Automated CI/CD pipelines** using GitHub Actions
- **Secrets management** using AWS Secrets Manager
- **Auto-scaling** capabilities for high availability
- **Load balancing** with Application Load Balancer

## Architecture Components

### Network Architecture
- **VPC**: 10.1.0.0/16 CIDR block
- **6 Subnets across 2 Availability Zones** (AZ-a and AZ-c):
  - 2 Public Subnets (10.1.1.0/24, 10.1.2.0/24)
  - 2 Private App Subnets (10.1.11.0/24, 10.1.12.0/24)
  - 2 Private DB Subnets (10.1.21.0/24, 10.1.22.0/24)
- **Internet Gateway** for public internet access
- **NAT Gateway** in Public Subnet 1 for private subnet outbound traffic
- **S3 Gateway Endpoint** for cost-effective S3 access from private subnets

### Compute Resources
- **ECS Fargate Cluster**: Serverless container orchestration
- **Application Load Balancer**: HTTP/HTTPS traffic distribution
- **Auto Scaling**: CPU and Memory-based scaling (1-5 tasks)
- **ECR Repository**: Container image storage with lifecycle policy (keep 10 images)
- **CloudWatch Logs**: Centralized logging (14-day retention)

### Security
- **Security Groups**:
  - ALB SG: Allows HTTP (80) and HTTPS (443) from internet
  - ECS Task SG: Allows traffic from ALB on port 8000
  - RDS SG: Allows PostgreSQL (5432) from ECS tasks only
- **IAM Roles**:
  - Task Execution Role: ECR pull, Secrets Manager access, CloudWatch logging
  - Task Role: S3 media bucket access

### Secrets Management
All sensitive data stored in AWS Secrets Manager:
- Django SECRET_KEY
- Database password
- Email host password (Gmail SMTP)
- VNPay payment gateway hash secret
- AWS Access Key ID and Secret Access Key (for S3 media storage)

## CloudFormation Templates

The infrastructure is deployed in a specific order using 4 CloudFormation templates:

### 1. Network Stack (`1. d-IE221-network.yaml`)
Creates the foundational network infrastructure.

**Resources Created**:
- VPC with DNS support
- Internet Gateway
- 6 Subnets (2 public, 2 private app, 2 private DB)
- NAT Gateway with Elastic IP
- 3 Route Tables (public, private app, private DB)
- S3 Gateway Endpoint

**Parameters**:
```yaml
VPCCidr: 10.1.0.0/16
PublicSubnet1Cidr: 10.1.1.0/24
PublicSubnet2Cidr: 10.1.2.0/24
PrivateAppSubnet1Cidr: 10.1.11.0/24
PrivateAppSubnet2Cidr: 10.1.12.0/24
PrivateDBSubnet1Cidr: 10.1.21.0/24
PrivateDBSubnet2Cidr: 10.1.22.0/24
```

**Deployment**:
```bash
aws cloudformation create-stack \
  --stack-name ie221-network-stack \
  --template-body file://cfn-template/1.\ d-IE221-network.yaml \
  --region ap-southeast-1
```

### 2. Security Groups Stack (`2. d-IE221-sg.yaml`)
Creates security groups for application components.

**Resources Created**:
- ALB Security Group
- ECS Task Security Group
- RDS Security Group

**Parameters**:
```yaml
VpcId: (Select VPC from stack 1)
```

**Deployment**:
```bash
aws cloudformation create-stack \
  --stack-name ie221-sg-stack \
  --template-body file://cfn-template/2.\ d-IE221-sg.yaml \
  --parameters ParameterKey=VpcId,ParameterValue=<VPC_ID> \
  --region ap-southeast-1
```

### 3. Secrets Manager Stack (`3. d-IE221-parameter.yaml`)
Manages application secrets securely.

**Resources Created**:
- Django Secret Key secret
- Database password secret
- Email host password secret
- VNPay hash secret
- AWS Access Key ID secret
- AWS Secret Access Key secret

**Parameters** (all NoEcho):
```yaml
DjangoSecretKey: (Django SECRET_KEY)
DBPassword: (PostgreSQL password)
EmailHostPassword: (Gmail app password)
VNPayHashSecret: (VNPay hash secret)
AWSAccessKeyId: (AWS access key for S3)
AWSSecretAccessKey: (AWS secret key for S3)
```

**Deployment**:
```bash
aws cloudformation create-stack \
  --stack-name ie221-secrets-stack \
  --template-body file://cfn-template/3.\ d-IE221-parameter.yaml \
  --parameters \
    ParameterKey=DjangoSecretKey,ParameterValue=<SECRET_KEY> \
    ParameterKey=DBPassword,ParameterValue=<DB_PASSWORD> \
    ParameterKey=EmailHostPassword,ParameterValue=<EMAIL_PASSWORD> \
    ParameterKey=VNPayHashSecret,ParameterValue=<VNPAY_SECRET> \
    ParameterKey=AWSAccessKeyId,ParameterValue=<AWS_KEY_ID> \
    ParameterKey=AWSSecretAccessKey,ParameterValue=<AWS_SECRET> \
  --region ap-southeast-1
```

### 4. Compute Stack (`4. d-IE221-compute.yaml`)
Creates the application compute resources.

**Resources Created**:
- ECS Cluster with Container Insights
- Task Definition with environment variables and secrets
- ECS Service with Fargate launch type
- Application Load Balancer
- Target Group with health checks
- HTTP Listener
- ECR Repository
- CloudWatch Log Group
- IAM Roles (Task Execution & Task Role)
- Auto Scaling Target
- CPU and Memory Scaling Policies

**Key Parameters**:
```yaml
# Networking (from Stack 1)
VPCId: <VPC_ID>
PublicSubnet1Id: <PUBLIC_SUBNET_1_ID>
PublicSubnet2Id: <PUBLIC_SUBNET_2_ID>
PrivateAppSubnet1Id: <PRIVATE_APP_SUBNET_1_ID>
PrivateAppSubnet2Id: <PRIVATE_APP_SUBNET_2_ID>

# Security Groups (from Stack 2)
ALBSecurityGroupId: <ALB_SG_ID>
AppSecurityGroupId: <ECS_TASK_SG_ID>

# Secrets Manager ARNs (from Stack 3)
DjangoSecretKeyArn: <DJANGO_SECRET_ARN>
DBPasswordArn: <DB_PASSWORD_ARN>
EmailPasswordArn: <EMAIL_PASSWORD_ARN>
VNPayHashSecretArn: <VNPAY_SECRET_ARN>
AWSAccessKeyId: <AWS_ACCESS_KEY_ARN>
AWSSecretAccessKey: <AWS_SECRET_KEY_ARN>

# Service Configuration
ServiceName: foodi-api
ECRRepositoryName: ie221-ecr-foodi-prod
ContainerPort: 8000
ContainerCpu: 256
ContainerMemory: 512
DesiredCount: 0  # Set to 0 to avoid costs initially

# Auto Scaling
TargetCPUUtilization: 60
TargetMemoryUtilization: 70
MinCapacity: 1
MaxCapacity: 5
```

**Deployment**:
```bash
aws cloudformation create-stack \
  --stack-name ie221-compute-stack \
  --template-body file://cfn-template/4.\ d-IE221-compute.yaml \
  --parameters \
    ParameterKey=VPCId,ParameterValue=<VPC_ID> \
    ParameterKey=PublicSubnet1Id,ParameterValue=<PUBLIC_SUBNET_1_ID> \
    ParameterKey=PublicSubnet2Id,ParameterValue=<PUBLIC_SUBNET_2_ID> \
    ParameterKey=PrivateAppSubnet1Id,ParameterValue=<PRIVATE_APP_SUBNET_1_ID> \
    ParameterKey=PrivateAppSubnet2Id,ParameterValue=<PRIVATE_APP_SUBNET_2_ID> \
    ParameterKey=ALBSecurityGroupId,ParameterValue=<ALB_SG_ID> \
    ParameterKey=AppSecurityGroupId,ParameterValue=<ECS_TASK_SG_ID> \
    ParameterKey=DjangoSecretKeyArn,ParameterValue=<DJANGO_SECRET_ARN> \
    ParameterKey=DBPasswordArn,ParameterValue=<DB_PASSWORD_ARN> \
    ParameterKey=EmailPasswordArn,ParameterValue=<EMAIL_PASSWORD_ARN> \
    ParameterKey=VNPayHashSecretArn,ParameterValue=<VNPAY_SECRET_ARN> \
    ParameterKey=AWSAccessKeyId,ParameterValue=<AWS_ACCESS_KEY_ARN> \
    ParameterKey=AWSSecretAccessKey,ParameterValue=<AWS_SECRET_KEY_ARN> \
  --capabilities CAPABILITY_NAMED_IAM \
  --region ap-southeast-1
```

## CI/CD Pipelines

### Frontend Deployment (`.github/workflows/deploy-frontend.yml`)

Automatically deploys the React frontend to S3 and CloudFront.

**Trigger**:
- Push to `dev` branch
- Changes in `frontend/**` or workflow file
- Manual trigger via `workflow_dispatch`

**Pipeline Steps**:
1. Checkout code
2. Setup Node.js 22.17.0 with npm caching
3. Install dependencies (`npm ci` + `npm install`)
4. Build React application with environment variables
5. Configure AWS credentials using OIDC
6. Deploy to S3 with optimized caching:
   - Static assets (JS, CSS, images): 1-year cache (immutable)
   - `index.html`: no-cache
   - `asset-manifest.json`: no-cache
7. Invalidate CloudFront distribution

**Required Secrets**:
```yaml
AWS_ACCOUNT_ID: AWS account ID
REACT_APP_API_URL: Backend API URL
S3_FRONTEND_BUCKET: S3 bucket name for frontend
CLOUDFRONT_DISTRIBUTION_ID: CloudFront distribution ID
CLOUDFRONT_DOMAIN: CloudFront domain name
```

**Required Variables**:
```yaml
AWS_REGION: AWS region (e.g., ap-southeast-1)
```

**IAM Role**:
```
arn:aws:iam::<ACCOUNT_ID>:role/IE221-GitHubActionsRole
```

### Backend Deployment (`.github/workflows/deploy-backend.yaml`)

Builds and pushes Docker images to Amazon ECR.

**Trigger**:
- Push to `dev` branch
- Changes in `backend/**`

**Pipeline Steps**:
1. Checkout code
2. Setup Docker Buildx
3. Configure AWS credentials using OIDC
4. Login to Amazon ECR
5. Generate image tag from git SHA (first 7 characters)
6. Build and push Docker image with tags:
   - `latest`
   - `<short-sha>` (e.g., `abc1234`)
7. Use GitHub Actions cache for faster builds

**Note**: Currently stops at ECR push. ECS deployment is manual to control costs.

**Required Secrets**:
```yaml
AWS_ACCOUNT_ID: AWS account ID
```

**Required Variables**:
```yaml
AWS_REGION: AWS region
ECR_REPOSITORY: ECR repository name
```

## Deployment Order

Follow this order to deploy the complete infrastructure:

1. **Deploy Network Stack** (creates VPC, subnets, routing)
2. **Deploy Security Groups Stack** (creates security groups)
3. **Deploy Secrets Manager Stack** (stores application secrets)
4. **Deploy Compute Stack** (creates ECS, ALB, auto-scaling)
5. **Setup GitHub Secrets** (configure CI/CD pipelines)
6. **Push Code** to `dev` branch to trigger deployments

## Environment Variables

### Backend Container Environment Variables
```bash
# Database
DB_NAME=ie221_db
DB_USER=neondb_owner
DB_HOST=ep-steep-darkness-a1bgc8qi-pooler.ap-southeast-1.aws.neon.tech
DB_PORT=5432

# Django
ALLOWED_HOSTS=*
CORS_ALLOWED_ORIGINS=https://d1a87c4jc0zeu.cloudfront.net,https://foodi.liaman.link
CSRF_TRUSTED_ORIGINS=https://d1a87c4jc0zeu.cloudfront.net,https://foodi.liaman.link

# AWS
AWS_STORAGE_BUCKET_NAME=ie221
AWS_S3_REGION_NAME=ap-southeast-1
AWS_REGION=ap-southeast-1

# Email
EMAIL_HOST_USER=ie221noreply@gmail.com

# Frontend
FRONTEND_DOMAIN=foodi.liaman.link
FRONTEND_PROTOCOL=https

# VNPay
VNPAY_TMN_CODE=BG6RGL0E
VNPAY_PAYMENT_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=https://foodi.liaman.link/payment/result
VNPAY_API_URL=https://sandbox.vnpayment.vn/merchant_webapi/api/transaction
```

### Secrets (from Secrets Manager)
```bash
SECRET_KEY=<Django SECRET_KEY>
DB_PASSWORD=<Database password>
EMAIL_HOST_PASSWORD=<Gmail app password>
VNPAY_HASH_SECRET=<VNPay hash secret>
AWS_ACCESS_KEY_ID=<AWS access key>
AWS_SECRET_ACCESS_KEY=<AWS secret key>
```

## GitHub Actions Setup

### Step 1: Create IAM Role for GitHub Actions

Create an IAM role with OIDC trust policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::<ACCOUNT_ID>:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:duyle1062/IE221:*"
        }
      }
    }
  ]
}
```

### Step 2: Attach Required Policies

Attach these managed policies to the role:
- `AmazonS3FullAccess` (for frontend deployment)
- `CloudFrontFullAccess` (for cache invalidation)
- `AmazonEC2ContainerRegistryPowerUser` (for ECR push)

### Step 3: Configure Repository Secrets

In GitHub repository settings, add these secrets:

**Frontend Secrets**:
- `AWS_ACCOUNT_ID`
- `REACT_APP_API_URL`
- `S3_FRONTEND_BUCKET`
- `CLOUDFRONT_DISTRIBUTION_ID`
- `CLOUDFRONT_DOMAIN`

**Backend Secrets**:
- `AWS_ACCOUNT_ID` (already added)

**Repository Variables**:
- `AWS_REGION`
- `ECR_REPOSITORY`

## Cost Optimization

### Current Setup
- **Network**: NAT Gateway (~$32/month) - single NAT for cost savings
- **Compute**: ECS Fargate - pay only when running (DesiredCount=0 by default)
- **Database**: Using Neon.tech serverless PostgreSQL (external)
- **ECR**: Lifecycle policy keeps only 10 images
- **CloudWatch**: 14-day log retention

### Cost-Saving Tips
1. Set `DesiredCount=0` when not in use
2. Use single NAT Gateway instead of per-AZ
3. Enable auto-scaling only when needed
4. Monitor CloudWatch costs and adjust retention
5. Use S3 Gateway Endpoint for free S3 access from VPC

## Monitoring and Logging

### CloudWatch Metrics
- ECS service CPU and memory utilization
- ALB request count and target response time
- Auto-scaling activity

### CloudWatch Logs
- Log Group: `/aws/ecs/ie221-ecs-foodi-api`
- Retention: 14 days
- Stream prefix: `ecs`

### Container Insights
Enabled on ECS cluster for detailed container metrics.

## Health Checks

### ALB Target Group Health Check
- **Path**: `/health/`
- **Protocol**: HTTP
- **Interval**: 30 seconds
- **Timeout**: 5 seconds
- **Healthy threshold**: 2
- **Unhealthy threshold**: 3

## Auto Scaling Configuration

### CPU-Based Scaling
- **Target**: 60% CPU utilization
- **Scale out cooldown**: 300 seconds
- **Scale in cooldown**: 300 seconds

### Memory-Based Scaling
- **Target**: 70% Memory utilization
- **Scale out cooldown**: 300 seconds
- **Scale in cooldown**: 300 seconds

### Task Limits
- **Minimum**: 1 task
- **Maximum**: 5 tasks

## Troubleshooting

### Frontend Deployment Issues
1. **Build fails**: Check `REACT_APP_API_URL` secret is set correctly
2. **S3 upload fails**: Verify IAM role has S3 permissions
3. **CloudFront not updating**: Wait for invalidation to complete (~1-2 minutes)

### Backend Deployment Issues
1. **ECR login fails**: Check IAM role has ECR permissions
2. **Image push fails**: Verify ECR repository exists
3. **Build timeout**: Increase GitHub Actions timeout or optimize Dockerfile

### ECS Task Issues
1. **Task fails to start**: Check CloudWatch logs for errors
2. **Health check fails**: Verify `/health/` endpoint returns 200
3. **Secrets not loading**: Verify Secrets Manager ARNs are correct
4. **Database connection fails**: Check security group rules and database credentials

## Security Best Practices

1. **Secrets**: Never commit secrets to Git - use Secrets Manager
2. **IAM**: Follow principle of least privilege
3. **Network**: Use private subnets for application and database
4. **Updates**: Regularly update container images for security patches
5. **Logging**: Enable CloudWatch logs for audit trail

## Naming Convention

All resources follow this naming pattern:
```
ie221-<resource-type>-<service>-<identifier>
```

Examples:
- `ie221-vpc-foodi-001`
- `ie221-ecs-foodi-api`
- `ie221-sg-foodi-alb`

## Tags

All resources are tagged with:
```yaml
Name: <resource-name>
Environment: dev
SystemID: IE221
```

## Support

For issues or questions:
1. Check CloudWatch Logs for error messages
2. Review GitHub Actions workflow runs
3. Verify all stack outputs are correctly referenced

## License

This infrastructure is part of the IE221 project, group 10
