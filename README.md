# IE221 - Foodi: Food Ordering Platform

A modern full-stack food ordering web application built with Django REST Framework backend and React frontend, deployed on AWS infrastructure.

## 📹 Video Demo

[Watch Demo Video](https://drive.google.com/file/d/1xQZBQc4DIEMvqeLg_TY4LRkskntK1-PP/view?usp=sharing)

## 🌟 Project Overview

Foodi is a comprehensive food ordering platform that enables users to browse restaurants, order food, make payments through VNPay, and participate in group orders. The application features user authentication, product management, shopping cart functionality, order tracking, and payment integration.

### Key Features

- User authentication and authorization with JWT tokens
- Product catalog with search and filtering
- Shopping cart management
- Order placement and tracking
- Payment integration with VNPay gateway
- Group ordering functionality (collaborative orders with shareable codes)
- Address management for delivery
- Admin dashboard for restaurant management
- Recommendation system for personalized product suggestions
- Email notifications
- Media file management with AWS S3

## 🏗️ Architecture

### Technology Stack

**Backend:**
- Django 5.1+ with Django REST Framework
- PostgreSQL database (AWS RDS)
- JWT authentication
- AWS S3 for media storage
- VNPay payment integration
- Celery for async tasks (planned)

**Frontend:**
- React 18 with TypeScript
- Material-UI (MUI) and Ant Design components
- Redux for state management
- React Router for navigation
- Axios for API calls
- Recharts for data visualization

**Infrastructure:**
- AWS ECS Fargate (containerized deployment)
- AWS Application Load Balancer
- Amazon ECR (container registry)
- AWS S3 (static files + media storage)
- CloudFront CDN (frontend distribution)
- AWS Secrets Manager (secrets management)
- GitHub Actions (CI/CD pipelines)

### System Architecture

```
┌─────────────────┐
│   CloudFront    │ ← Frontend (React)
│   + S3 Bucket   │
└────────┬────────┘
         │
         ↓ API Calls
┌─────────────────┐
│  Load Balancer  │
└────────┬────────┘
         │
    ┌────┴────┐
    │  ECS    │
    │ Fargate │ ← Backend (Django)
    └────┬────┘
         │
    ┌────┴──────────┐
    │               │
┌───┴────┐   ┌─────┴─────┐
│   RDS  │   │  AWS S3   │
│   DB   │   │  (Media)  │
└────────┘   └───────────┘
```

## 📁 Project Structure

```
IE221/
├── backend/                      # Django REST API
│   ├── apps/
│   │   ├── authentication/       # User auth (login, register, JWT)
│   │   ├── users/               # User profile management
│   │   ├── product/             # Product catalog & recommendations
│   │   ├── carts/               # Shopping cart functionality
│   │   ├── orders/              # Order management & group orders
│   │   ├── payment/             # VNPay payment integration
│   │   └── addresses/           # Delivery address management
│   ├── IE221/                   # Django project settings
│   ├── static/                  # Static files
│   ├── media/                   # Local media (development)
│   ├── requirements.txt         # Python dependencies
│   ├── Dockerfile-prod          # Production Docker image
│   └── manage.py
├── frontend/                    # React application
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   ├── pages/              # Page components
│   │   ├── services/           # API service layer
│   │   ├── context/            # React context providers
│   │   ├── utils/              # Utility functions
│   │   ├── types/              # TypeScript types
│   │   └── styles/             # Global styles
│   ├── public/                 # Static assets
│   └── package.json
├── infrastructure/              # AWS Infrastructure as Code
│   ├── cfn-template/           # CloudFormation templates
│   │   ├── 1. d-IE221-network.yaml      # VPC, subnets, routing
│   │   ├── 2. d-IE221-sg.yaml           # Security groups
│   │   ├── 3. d-IE221-parameter.yaml    # Secrets Manager
│   │   └── 4. d-IE221-compute.yaml      # ECS, ALB, auto-scaling
│   └── README.md               # Infrastructure documentation
├── .github/
│   └── workflows/
│       ├── deploy-frontend.yml  # Frontend CI/CD pipeline
│       └── deploy-backend.yaml  # Backend CI/CD pipeline
├── package.json                # Root package scripts
└── README.md                   # This file
```

## 🚀 Getting Started

### Prerequisites

- **Python 3.12+**
- **Node.js 22.17.0+**
- **PostgreSQL 15+** (or use provided RDS)
- **Git**

### Local Development Setup

#### 1. Clone the Repository

```bash
git clone https://github.com/duyle1062/IE221.git
cd IE221
```

#### 2. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# OR
.\venv\Scripts\Activate.ps1  # Windows

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run migrations
python manage.py migrate

# Create superuser for admin access
python manage.py createsuperuser

# Collect static files
python manage.py collectstatic --noinput

# Run development server
python manage.py runserver
```

Backend will be available at `http://127.0.0.1:8000`

#### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your backend API URL

# Start development server
npm start
```

Frontend will be available at `http://localhost:3000`

#### 4. Quick Setup with Root Scripts

Alternatively, use the root-level scripts:

```bash
# Install all dependencies
npm run install-all

# Run migrations
npm run migrate

# Start both backend and frontend
npm run dev
```

### Environment Variables

#### Backend (.env)

```bash
# Django Settings
DEBUG=True
SECRET_KEY=your-secret-key-here
ALLOWED_HOSTS=localhost,127.0.0.1

# Database (PostgreSQL)
DB_NAME=ie221_db
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_HOST=localhost
DB_PORT=5432

# CORS Settings
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# AWS S3 (for media files)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_STORAGE_BUCKET_NAME=your_bucket_name
AWS_S3_REGION_NAME=ap-southeast-1

# Email Configuration (Gmail SMTP)
EMAIL_HOST_USER=your_email@gmail.com
EMAIL_HOST_PASSWORD=your_gmail_app_password

# VNPay Payment Gateway
VNPAY_TMN_CODE=your_vnpay_code
VNPAY_HASH_SECRET=your_vnpay_secret
VNPAY_PAYMENT_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=http://localhost:3000/payment/result

# Frontend Configuration
FRONTEND_DOMAIN=localhost:3000
FRONTEND_PROTOCOL=http
```

#### Frontend (.env)

```bash
# API Configuration
REACT_APP_API_URL=http://127.0.0.1:8000

# Other settings
GENERATE_SOURCEMAP=false
```

## 📚 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register/` | User registration |
| POST | `/api/auth/login/` | User login (returns JWT tokens) |
| POST | `/api/auth/token/refresh/` | Refresh access token |
| POST | `/api/auth/logout/` | User logout |
| POST | `/api/auth/password-reset/` | Request password reset |

### User Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/profile/` | Get user profile |
| PUT | `/api/users/profile/` | Update user profile |
| GET | `/api/users/addresses/` | List user addresses |
| POST | `/api/users/addresses/` | Create new address |

### Products

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products/` | List all products |
| GET | `/api/products/{id}/` | Get product details |
| GET | `/api/products/search/?q=query` | Search products |
| GET | `/api/products/recommendations/` | Get personalized recommendations |

### Shopping Cart

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/carts/` | Get current cart |
| POST | `/api/carts/items/` | Add item to cart |
| PUT | `/api/carts/items/{id}/` | Update cart item |
| DELETE | `/api/carts/items/{id}/` | Remove cart item |
| DELETE | `/api/carts/clear/` | Clear entire cart |

### Orders

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/orders/` | List user orders |
| POST | `/api/orders/` | Create new order |
| GET | `/api/orders/{id}/` | Get order details |
| PUT | `/api/orders/{id}/cancel/` | Cancel order |

### Group Orders

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/group-orders/` | Create group order |
| POST | `/api/group-orders/join/` | Join group order with code |
| GET | `/api/group-orders/{id}/` | Get group order details |
| POST | `/api/group-orders/{id}/items/` | Add item to group order |
| POST | `/api/group-orders/{id}/finalize/` | Finalize and place order |

### Payment

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payment/create/` | Create VNPay payment URL |
| GET | `/api/payment/callback/` | VNPay payment callback |
| GET | `/api/payment/status/{order_id}/` | Check payment status |

For detailed API documentation, see [GROUP_ORDER_API.md](backend/GROUP_ORDER_API.md)

## 🧪 Testing

```bash
# Run all tests
npm run test

# Backend tests only
npm run test:backend
cd backend && python manage.py test

# Frontend tests only
npm run test:frontend
cd frontend && npm test

# Run specific backend app tests
cd backend && python manage.py test apps.authentication
cd backend && python manage.py test apps.orders
```

## 📦 Available Scripts

### Root Level Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both backend and frontend |
| `npm run backend` | Start Django server only |
| `npm run frontend` | Start React app only |
| `npm run install-all` | Install all dependencies |
| `npm run setup` | Install dependencies and run migrations |
| `npm run build` | Build React app for production |
| `npm run test` | Run all tests |
| `npm run migrate` | Run Django migrations |
| `npm run makemigrations` | Create Django migrations |
| `npm run collectstatic` | Collect static files |

### Backend Scripts

```bash
cd backend

# Database
python manage.py migrate
python manage.py makemigrations
python manage.py createsuperuser

# Development
python manage.py runserver
python manage.py shell

# Static files
python manage.py collectstatic

# Testing
python manage.py test
```

### Frontend Scripts

```bash
cd frontend

# Development
npm start          # Start dev server
npm run build      # Production build
npm test           # Run tests
npm run eject      # Eject from CRA (not recommended)
```

## 🚀 Production Deployment

### AWS Infrastructure

The application is deployed on AWS using Infrastructure as Code (CloudFormation). See [infrastructure/README.md](infrastructure/README.md) for detailed deployment instructions.

#### Infrastructure Components

1. **Network Stack**: 3-tier VPC with 6 subnets across 2 AZs
2. **Security Groups**: ALB, ECS Task, and RDS security groups
3. **Secrets Manager**: Secure storage for sensitive configuration
4. **Compute Stack**: ECS Fargate, ALB, Auto Scaling, CloudWatch

#### Deployment Steps

```bash
# 1. Deploy Network Stack
aws cloudformation create-stack \
  --stack-name ie221-network-stack \
  --template-body file://infrastructure/cfn-template/1.\ d-IE221-network.yaml

# 2. Deploy Security Groups
aws cloudformation create-stack \
  --stack-name ie221-sg-stack \
  --template-body file://infrastructure/cfn-template/2.\ d-IE221-sg.yaml \
  --parameters ParameterKey=VpcId,ParameterValue=<VPC_ID>

# 3. Deploy Secrets Manager
aws cloudformation create-stack \
  --stack-name ie221-secrets-stack \
  --template-body file://infrastructure/cfn-template/3.\ d-IE221-parameter.yaml \
  --parameters ...

# 4. Deploy Compute Stack
aws cloudformation create-stack \
  --stack-name ie221-compute-stack \
  --template-body file://infrastructure/cfn-template/4.\ d-IE221-compute.yaml \
  --parameters ... \
  --capabilities CAPABILITY_NAMED_IAM
```

### CI/CD Pipelines

The project uses GitHub Actions for automated deployment:

#### Frontend Pipeline (`.github/workflows/deploy-frontend.yml`)

- **Trigger**: Push to `main` branch (frontend changes)
- **Steps**:
  1. Build React application
  2. Deploy to S3 bucket
  3. Invalidate CloudFront cache
- **Target**: CloudFront + S3 static hosting

#### Backend Pipeline (`.github/workflows/deploy-backend.yaml`)

- **Trigger**: Push to `main` branch (backend changes)
- **Steps**:
  1. Build Docker image
  2. Push to Amazon ECR
  3. Tag with git SHA and `latest`
- **Target**: Amazon ECR (manual ECS deployment)

#### Required GitHub Secrets

```yaml
# AWS Configuration
AWS_ACCOUNT_ID: Your AWS account ID
AWS_REGION: ap-southeast-1

# Frontend Deployment
S3_FRONTEND_BUCKET: S3 bucket name
CLOUDFRONT_DISTRIBUTION_ID: CloudFront distribution ID
CLOUDFRONT_DOMAIN: CloudFront domain name
REACT_APP_API_URL: Backend API URL

# Backend Deployment
ECR_REPOSITORY: ECR repository name
```

### Manual Deployment

#### Backend (Docker)

```bash
# Build Docker image
cd backend
docker build -f Dockerfile-prod -t foodi-backend:latest .

# Tag and push to ECR
aws ecr get-login-password --region ap-southeast-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.ap-southeast-1.amazonaws.com
docker tag foodi-backend:latest <account-id>.dkr.ecr.ap-southeast-1.amazonaws.com/ie221-ecr-foodi-api:latest
docker push <account-id>.dkr.ecr.ap-southeast-1.amazonaws.com/ie221-ecr-foodi-api:latest

# Update ECS service
aws ecs update-service \
  --cluster ie221-ecs-foodi-api \
  --service ie221-ecs-service-foodi-api \
  --force-new-deployment
```

#### Frontend (S3 + CloudFront)

```bash
# Build React app
cd frontend
npm run build

# Deploy to S3
aws s3 sync build/ s3://your-bucket-name --delete

# Invalidate CloudFront
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"
```

## 🔐 Security

### Best Practices Implemented

- JWT token-based authentication with refresh tokens
- Secrets stored in AWS Secrets Manager (production)
- CORS configuration for API security
- HTTPS enforced in production (CloudFront + ALB)
- Security groups limiting network access
- SQL injection protection (Django ORM)
- XSS protection (React auto-escaping)
- CSRF tokens for state-changing operations
- Private subnets for application and database tiers
- IAM roles following principle of least privilege

### Environment-Specific Security

**Development:**
- Debug mode enabled
- Permissive CORS settings
- Local file storage

**Production:**
- Debug mode disabled
- Strict CORS whitelist
- AWS S3 for media storage
- Secrets in AWS Secrets Manager
- CloudFront CDN with SSL/TLS

## 📊 Monitoring and Logging

### CloudWatch Integration

- **Logs**: Centralized logging in CloudWatch Logs (14-day retention)
- **Metrics**: ECS service CPU/Memory utilization
- **Alarms**: Auto-scaling based on resource usage
- **Container Insights**: Detailed container-level metrics

### Application Monitoring

```bash
# View ECS logs
aws logs tail /aws/ecs/ie221-ecs-foodi-api --follow

# Check service status
aws ecs describe-services \
  --cluster ie221-ecs-foodi-api \
  --services ie221-ecs-service-foodi-api
```

## 🔧 Troubleshooting

### Common Issues

#### Backend Issues

**Database connection fails:**
```bash
# Check database credentials in .env
# Verify PostgreSQL is running
sudo systemctl status postgresql

# Test connection
psql -h localhost -U your_user -d ie221_db
```

**Static files not loading:**
```bash
# Collect static files
python manage.py collectstatic --noinput

# Check STATIC_ROOT and STATIC_URL settings
```

**Import errors:**
```bash
# Ensure virtual environment is activated
source venv/bin/activate

# Reinstall dependencies
pip install -r requirements.txt
```

#### Frontend Issues

**API calls fail:**
- Check `REACT_APP_API_URL` in `.env`
- Verify backend is running
- Check CORS settings in Django

**Build fails:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### Deployment Issues

**ECS task fails to start:**
- Check CloudWatch logs for errors
- Verify secrets are accessible
- Ensure security groups allow traffic

**Frontend not updating:**
- Clear CloudFront cache
- Verify S3 bucket contents
- Check cache-control headers

## 💡 Development Tips

### Backend Development

- Use Django shell for testing: `python manage.py shell`
- Create migrations after model changes: `python manage.py makemigrations`
- Use Django Debug Toolbar in development
- Follow PEP 8 style guide
- Write tests for new features

### Frontend Development

- Use React Developer Tools browser extension
- Leverage TypeScript for type safety
- Follow component-based architecture
- Use React hooks for state management
- Implement error boundaries for robustness

### Database Management

```bash
# Backup database
pg_dump -U your_user ie221_db > backup.sql

# Restore database
psql -U your_user ie221_db < backup.sql

# Reset database (development only)
python manage.py flush
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Contribution Guidelines

- Write clear commit messages
- Add tests for new features
- Update documentation as needed
- Follow existing code style
- Ensure all tests pass before submitting PR

## 📄 License

This project is part of the IE221 course, Group 10.

## 👥 Team

**Group 10 - IE221**

- GitHub: [@duyle1062](https://github.com/duyle1062)

## 🔗 Links

- **Production**: https://foodi.liaman.link
- **Backend API**: https://api.foodi.liaman.link
- **Repository**: https://github.com/duyle1062/IE221
- **Video Demo**: [Google Drive](https://drive.google.com/file/d/1xQZBQc4DIEMvqeLg_TY4LRkskntK1-PP/view?usp=sharing)
- **Infrastructure Docs**: [infrastructure/README.md](infrastructure/README.md)

## 📞 Support

For issues or questions:
1. Check existing issues on GitHub
2. Review documentation in `/docs` folder
3. Check CloudWatch logs for production issues
4. Contact the development team

## 🙏 Acknowledgments

- Django REST Framework for the robust API framework
- React team for the excellent frontend library
- AWS for reliable cloud infrastructure
- VNPay for payment gateway integration
- All open-source contributors whose libraries made this project possible

---

Built with ❤️ by Group 10 for IE221 Course
