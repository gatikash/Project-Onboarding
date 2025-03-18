# Onboarding Portal

## Overview
This is a web-based onboarding portal application designed to help organizations manage their employee onboarding process. The application features role-based access control, with different functionalities available to managers and regular users.


## Features

### Authentication & Authorization
- 🔐 Secure login system
- 👥 Role-based access (Manager and User roles)
- 🛡️ Protected routes based on user roles

### Dashboard
- 📊 Personalized view based on user role
- ⚡ Quick access to all main features
- 🏠 Intuitive navigation with home button

### Project Management (Managers Only)
- ✨ Create and manage projects
- 📝 Edit project details
- 🗑️ Delete projects with associated resources
- 📈 View project statistics
- 📅 Track project timelines

### Resource Management
- 📁 Support for multiple file types:
  - Documents (PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX)
  - Videos (MP4, MOV, AVI, MKV, WEBM)
  - URL links
- 📥 Download functionality
- 🔍 Project-based resource organization
- ⏰ Resource creation tracking

### Task Management
- ✅ Project-specific tasks
- 📋 Task status tracking
- 👤 Task assignment system

## Tech Stack

### Frontend
- ⚛️ React.js
- 🎨 Material-UI
- 🛣️ React Router
- 🔄 Axios

### Backend
- 📦 Node.js
- 🚀 Express.js
- 💾 SQL Server
- 📤 Multer (file handling)

## Getting Started

### Prerequisites
- Node.js
- SQL Server
- npm or yarn

### Installation

1. Clone the repository
```bash
git https://github.com/gatikash/Project-Onboarding
```

2. Install frontend dependencies
```bash
cd onboarding-frontend
npm install
```

3. Install backend dependencies
```bash
cd onboarding-backend
npm install
```

4. Configure the database
- Create a SQL Server database
- Update the connection settings in the backend configuration

5. Start the backend server
```bash
cd onboarding-backend
npm start
```

6. Start the frontend application
```bash
cd onboarding-frontend
npm start
```

## Environment Variables

Create a `.env` file in the backend directory with the following variables:
```env
DB_SERVER=your_server_name
DB_NAME=your_database_name
DB_USER=your_username
DB_PASSWORD=your_password
PORT=3001
```

## Security Features
- 🔒 Protected API endpoints
- ✔️ File upload validation
- 📁 Secure file storage
- 🛡️ Role-based access control
- 🔍 Input validation and sanitization

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License
[MIT](https://choosealicense.com/licenses/mit/)
