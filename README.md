# BatterHub

BatterHub is a hyperlocal barter system designed specifically for students to exchange skills and resources within their campus community. The platform facilitates peer-to-peer trading of skills, knowledge, and academic resources.

## 🌟 Features

### Currently Implemented

- **Modern UI/UX**

  - Clean, professional design with dark mode support
  - Smooth animations using Framer Motion
  - Responsive layout for all devices
  - Consistent emerald green accent color scheme

- **Authentication (Clerk)**

  - Modal-based sign-in/sign-up flows
  - Protected routes
  - Persistent sessions
  - Loading states

- **Landing Pages**
  - Home page with hero section and Lottie animations
  - Features page showcasing platform capabilities
  - Pricing page with tiered plans
  - How It Works section with step-by-step guide

### Planned Features

- User Dashboard
- Skill/Resource Listing System
- Matching Algorithm
- Messaging System
- Review & Rating System
- Community Events

## 🛠️ Tech Stack

- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS
- **Authentication**: Clerk
- **Animations**:
  - Framer Motion
  - Lottie
- **Typography**: Geist Font Family
- **Development**:
  - TypeScript
  - ESLint
  - Prettier

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm/yarn/pnpm

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/batterhub.git
cd batterhub
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:
   Create a `.env.local` file in the root directory with the following variables:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_publishable_key
CLERK_SECRET_KEY=your_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

4. Run the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
src/
├── app/                    # Next.js app router pages
├── components/            # Reusable components
│   ├── sections/         # Page sections
│   └── ui/              # UI components
├── lottieFiles/         # Lottie animations
└── middleware.ts        # Auth middleware
```

## 🎨 Design System

- **Colors**:

  - Primary: Black & White
  - Accent: Emerald (600 for light mode, 500 for dark mode)
  - Text: Black/White with varying opacities
  - Borders: Black/White with 8% opacity

- **Typography**:

  - Geist Sans for general text
  - Geist Mono for monospace elements

- **Components**:
  - Consistent rounded corners (rounded-lg)
  - Subtle animations
  - Responsive design patterns
  - Dark mode support

## 🔒 Authentication

Authentication is handled by Clerk with the following features:

- Modal-based sign-in/sign-up
- Protected routes
- Public routes: /, /features, /pricing, /how-it-works
- Protected routes: /dashboard (and future user-specific routes)

## 🛣️ Roadmap

1. **Phase 1** ✅

   - Landing page
   - Authentication
   - Basic UI components

2. **Phase 2** 🚧

   - User dashboard
   - Profile management
   - Skill/resource listing

3. **Phase 3** 📋

   - Matching system
   - Messaging
   - Reviews & ratings

4. **Phase 4** 📋
   - Community features
   - Events system
   - Advanced analytics

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Clerk for authentication
- Framer Motion for animations
- Tailwind CSS for styling
- Vercel for hosting
