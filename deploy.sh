#!/bin/bash

# 🚀 AI Lawsuit Bot - Deployment Script
echo "🚀 Starting AI Lawsuit Bot Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if git is installed
if ! command -v git &> /dev/null; then
    print_error "Git is not installed. Please install Git first."
    exit 1
fi

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    print_error "Not in a git repository. Please initialize git first."
    exit 1
fi

# Step 1: Check current status
print_status "Checking git status..."
if [[ -n $(git status --porcelain) ]]; then
    print_warning "You have uncommitted changes. Please commit them first:"
    git status
    echo ""
    read -p "Do you want to commit all changes? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git add .
        git commit -m "Prepare for deployment - $(date)"
    else
        print_error "Please commit your changes before deploying."
        exit 1
    fi
fi

# Step 2: Push to remote
print_status "Pushing to remote repository..."
if ! git push origin main; then
    print_error "Failed to push to remote repository."
    exit 1
fi
print_success "Code pushed to remote repository."

# Step 3: Check environment files
print_status "Checking environment files..."

if [[ ! -f "backend/.env" ]]; then
    print_warning "backend/.env not found. Please create it with your production environment variables."
fi

if [[ ! -f "frontend/.env.local" ]]; then
    print_warning "frontend/.env.local not found. Please create it with your production environment variables."
fi

# Step 4: Display deployment instructions
echo ""
print_success "Code is ready for deployment!"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. 🌐 Deploy Backend to Railway:"
echo "   - Go to https://railway.app"
echo "   - Connect your GitHub account"
echo "   - Create new project from your repository"
echo "   - Set root directory to 'backend'"
echo "   - Add environment variables from backend/.env"
echo "   - Add PostgreSQL database"
echo ""
echo "2. 🎨 Deploy Frontend to Vercel:"
echo "   - Go to https://vercel.com"
echo "   - Connect your GitHub account"
echo "   - Import your repository"
echo "   - Set root directory to 'frontend'"
echo "   - Add environment variables"
echo "   - Deploy!"
echo ""
echo "3. 🔗 Connect Frontend to Backend:"
echo "   - Update NEXT_PUBLIC_API_URL in Vercel"
echo "   - Test all functionality"
echo ""
echo "📖 For detailed instructions, see DEPLOYMENT.md"
echo ""
print_success "Deployment preparation complete! 🎉" 