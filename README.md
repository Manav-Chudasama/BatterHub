# BatterHub

![BatterHub Logo](https://placeholder-for-batterhub-logo.png)

## 🎓 For Students, By Students

BatterHub is a skill-sharing and resource exchange platform specifically designed for student communities. It enables students to trade skills, services, and resources with each other through a unique barter system, fostering collaborative learning and community building.

## ✨ Features

### 🔄 Skill & Resource Trading

- Create listings for skills you can offer
- Browse available skills and resources from other students
- Send, receive, and negotiate trade requests
- Complete trades and leave reviews

### 👥 Community Goals

- Create and contribute to community-driven goals
- Track goal progress in real-time
- Verify contributions from community members
- Foster collaborative problem-solving

### 💬 Messaging System

- Real-time chat with other users
- Send text, images, videos, and documents
- Track message read status
- Organize conversations by trade requests

### 👤 User Profiles

- Showcase your skills and interests
- Build reputation through completed trades and reviews
- Track your trade history and contributions
- Customize notification preferences

### 📱 Responsive Design

- Fully responsive interface that works on all devices
- Dark and light theme support
- Intuitive navigation and user-friendly experience

## 🛠️ Technologies Used

### Frontend

- **Next.js 15** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **TailwindCSS 4** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **Socket.io Client** - Real-time communication

### Backend

- **Next.js API Routes** - Serverless backend
- **MongoDB** - Database (with Mongoose ODM)
- **Clerk** - Authentication and user management
- **Socket.io** - Real-time communication
- **Cloudinary** - Media storage and management

### Infrastructure

- **Vercel** - Deployment platform
- **MongoDB Atlas** - Cloud database hosting

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- npm or yarn
- MongoDB instance (local or Atlas)
- Clerk account for authentication
- Cloudinary account for media uploads

### Environment Setup

1. Clone the repository:

```bash
https://github.com/Manav-Chudasama/BatterHub.git
cd batterhub
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Set up environment variables:
   Copy `.env.local.example` to `.env.local` and fill in your credentials:

```
# Authentication - Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Database - MongoDB
MONGODB_URI=

# Media Storage - Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Socket.IO Configuration
SOCKET_SERVER_URL=http://localhost:3000
```

4. Start the development server:

```bash
npm run dev
# or
yarn dev
```

The application will be available at `http://localhost:3000`

## 📂 Project Structure

```
batterhub/
├── public/              # Static assets
├── src/
│   ├── app/             # Next.js App Router pages
│   │   ├── api/         # API routes
│   │   ├── dashboard/   # Protected dashboard pages
│   │   └── ...          # Other pages
│   ├── components/      # Reusable UI components
│   ├── contexts/        # React contexts (auth, socket, etc.)
│   ├── lib/             # Utility functions
│   ├── models/          # MongoDB models
│   ├── types/           # TypeScript type definitions
│   └── middleware.ts    # Next.js middleware for auth
├── next.config.ts       # Next.js configuration
├── server.js            # Custom server for Socket.io
└── ...
```

## 🧑‍💻 Contributing

We welcome contributions to BatterHub! Please follow these steps:

1. Fork the repository
2. Create a new branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Commit your changes (`git commit -m 'Add some amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgements

- [Clerk](https://clerk.dev/) for authentication
- [MongoDB](https://www.mongodb.com/) for database
- [Cloudinary](https://cloudinary.com/) for media management
- [Vercel](https://vercel.com/) for hosting
- [Next.js](https://nextjs.org/) for the framework
- All the students who helped test and provide feedback

---

<p align="center">Made with ❤️ for student communities</p>
