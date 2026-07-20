# Beleqet Job Platform 🚀

A modern job marketplace platform connecting employers with job seekers and freelancers in Ethiopia.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [Docker Setup](#docker-setup)
- [Database Setup](#database-setup)
- [OpenSearch Setup](#opensearch-setup)
- [Telegram Bot Setup](#telegram-bot-setup)
- [File Upload Setup](#file-upload-setup)
- [Webhook Setup (ngrok)](#webhook-setup-ngrok)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)

## ✨ Features

### Core Features
- 🔐 **Authentication & Authorization** - JWT-based auth with role-based access (Admin, Employer, Job Seeker, Freelancer)
- 💼 **Job Posting** - Create, manage, and publish job listings
- 💻 **Freelance Gigs** - Post and bid on freelance projects
- 🤖 **AI-Powered Screening** - Automatic candidate scoring using OpenAI
- 💰 **Escrow System** - Secure payment handling with Chapa/Telebirr
- 🔔 **Notifications** - In-app, Email, and Telegram notifications
- 📊 **Analytics Dashboard** - Real-time metrics and insights
- 🔍 **Advanced Search** - Full-text search with OpenSearch
- 📱 **Telegram Integration** - Instant notifications via Telegram bot
- 📎 **File Upload** - S3-compatible storage with presigned URLs

### User Roles
| Role | Access |
|------|--------|
| **Admin** | Full platform management, user moderation, analytics |
| **Employer** | Post jobs, manage applications, hire freelancers |
| **Job Seeker** | Apply to jobs, track applications, build profile |
| **Freelancer** | Bid on gigs, manage contracts, receive payments |

## 🛠️ Tech Stack

### Backend
- **Framework**: NestJS
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Search**: OpenSearch
- **Queue**: BullMQ (Redis)
- **AI**: OpenAI API
- **Storage**: AWS S3 / Cloudflare R2
- **Payment**: Chapa / Telebirr
- **Notifications**: Nodemailer, Telegraf (Telegram)

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **State**: React Context API
- **HTTP**: Fetch API

### DevOps
- **Container**: Docker & Docker Compose
- **CI/CD**: GitHub Actions
- **Hosting**: Vercel (Frontend), Railway/AWS (Backend)

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis 7+
- Docker & Docker Compose (optional)
- OpenSearch 2.x
- OpenAI API Key
- Chapa/Tebebirr Account (for payments)
- Telegram Bot Token (for notifications)

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/beleqet-job-platform.git
cd beleqet-job-platform
