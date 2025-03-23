# BatterHub - Skill Trading Platform

BatterHub is a platform where users can exchange their skills and services with others. The platform facilitates peer-to-peer learning and service exchange through a modern, user-friendly interface.

## Features

- User Authentication (via Clerk)
- Listing Management (Create, Edit, Delete, Mark as Traded)
- Trade Request System
- Messaging System
- Profile Management
- Dark Mode Support
- Responsive Design
- MongoDB Integration
- CORS Support for External API Access

## Tech Stack

- Next.js 15
- TypeScript
- Tailwind CSS
- Clerk (Authentication)
- MongoDB (Database)
- Mongoose (ODM)
- Cloudinary (Image Storage)
- Framer Motion (Animations)
- React Icons

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB database (Atlas or local)
- [Clerk](https://clerk.dev/) account for authentication

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

3. Create a `.env.local` file based on the `.env.local.example` file:

   ```bash
   cp .env.local.example .env.local
   ```

4. Update the `.env.local` file with your credentials:

   - MongoDB connection string
   - Clerk API keys

5. Start the development server:
   ```bash
   npm run dev
   ```

## CORS Configuration

The application is configured to allow cross-origin requests to all API endpoints, making it possible for external services to access your API. This is especially important for:

- Clerk webhook integration
- External API clients
- Frontend applications hosted on different domains

CORS is enabled through three layers:

1. **Next.js Configuration**: The `next.config.ts` file includes headers configuration for all API routes.
2. **Middleware**: The `middleware.ts` file adds CORS headers to all API responses and handles OPTIONS preflight requests.
3. **Route-level Headers**: Each API route includes specific CORS headers in its responses.

This triple-layered approach ensures that CORS works correctly in all environments, including development, production, and when deployed to various hosting platforms.

## Setting Up Clerk Webhooks

BatterHub uses Clerk webhooks to synchronize user data with MongoDB. Follow these steps to set up the webhooks:

1. Go to your [Clerk Dashboard](https://dashboard.clerk.dev/).

2. Navigate to the "Webhooks" section.

3. Create a new webhook with the following settings:

   - Endpoint URL: `https://your-domain.com/api/webhooks/clerk` (use your production URL or a tunnel for local development)
   - Events to subscribe to:
     - `user.created`
     - `user.updated`
     - `user.deleted`

4. Copy the "Signing Secret" and add it to your `.env.local` file as `CLERK_WEBHOOK_SECRET`.

5. For local development, you can use a service like [ngrok](https://ngrok.com/) to create a secure tunnel to your localhost.

## Setting Up Cloudinary

BatterHub uses Cloudinary for image uploads, including listing images. Follow these steps to set up Cloudinary:

1. Create a [Cloudinary account](https://cloudinary.com/users/register/free) if you don't have one already.

2. Navigate to your Cloudinary Dashboard and get your Cloud Name, API Key, and API Secret.

3. Add your Cloudinary credentials to your `.env.local` file:

   ```
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   ```

4. Restart your development server to apply the changes.

5. Cloudinary will automatically create folders for your uploaded images based on the structure specified in the code (batterhub/listings/{userId}).

## Database Models

### User Model

The User model represents a user in the BatterHub platform. It includes:

- Authentication details (linked with Clerk)
- Profile information
- Skills and interests
- Reputation and trade history
- Saved listings

When a user signs up through Clerk, a webhook is triggered that creates the user in MongoDB.

## API Routes

### Webhooks

- `POST /api/webhooks/clerk` - Receives Clerk webhook events for user management

### User API

- `GET /api/users` - List all users with filtering and pagination
- `POST /api/users` - Create a new user (primarily used by webhook)
- `GET /api/users/[userId]` - Get a specific user by ID
- `PUT /api/users/[userId]` - Update a specific user
- `DELETE /api/users/[userId]` - Delete a specific user (primarily used by webhook)

#### User Saved Listings

- `GET /api/users/[userId]/saved-listings` - Get user's saved listings
- `POST /api/users/[userId]/saved-listings` - Save a listing for a user
- `DELETE /api/users/[userId]/saved-listings` - Remove a saved listing

#### User Skills & Interests

- `GET /api/users/[userId]/skills` - Get user's skills and interests
- `PUT /api/users/[userId]/skills` - Replace user's skills and interests
- `POST /api/users/[userId]/skills` - Add skills or interests to a user
- `DELETE /api/users/[userId]/skills` - Remove a specific skill or interest

#### User Notifications

- `GET /api/users/[userId]/notifications` - Get user's notifications with filtering
- `POST /api/users/[userId]/notifications` - Create a new notification for a user
- `PUT /api/users/[userId]/notifications/mark-read` - Mark notifications as read
- `DELETE /api/users/[userId]/notifications/[notificationId]` - Delete a specific notification

#### User Preferences

- `GET /api/users/[userId]/preferences` - Get user's preferences
- `PUT /api/users/[userId]/preferences` - Update user's preferences

#### User Location

- `GET /api/users/[userId]/location` - Get user's location data
- `PUT /api/users/[userId]/location` - Update user's location data

### Listings API

- `GET /api/listings` - List all listings with filtering and pagination
- `POST /api/listings` - Create a new listing
- `GET /api/listings/[listingId]` - Get a specific listing by ID
- `PUT /api/listings/[listingId]` - Update a specific listing
- `DELETE /api/listings/[listingId]` - Delete a specific listing (soft delete)
- `GET /api/listings/my` - Get listings for the authenticated user
- `POST /api/listings/upload` - Upload images for a listing to Cloudinary

The Listings API supports various filtering options:

- Search by text query
- Filter by category
- Filter by location
- Proximity search based on coordinates
- Pagination
- Sorting by recency

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

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

## Listing Management Features

BatterHub provides comprehensive listing management features for users to share their skills:

### Creating Listings

- Users can create detailed listings with title, description, category, and trade preferences
- Support for multiple images (up to 5) uploaded to Cloudinary
- Availability options to specify when the user is available for skill exchanges

### Editing Listings

- Full-featured edit page that pre-populates with existing listing data
- Users can modify all listing details including title, description, category, and trade preferences
- Comprehensive image management:
  - View and remove existing images
  - Add new images (maintaining the 5 image limit)
  - Combined image handling (existing + new)

### Listing Status Management

- Users can mark listings as traded when a skill exchange is completed
- Soft delete functionality preserves listing data while removing it from public view
- Status filtering in the my listings dashboard (active/inactive/traded/all)

### My Listings Dashboard

- Comprehensive view of all user listings with status indicators
- Quick actions for edit, mark as traded, and delete
- Search and filter capabilities
- Statistics showing counts by listing status

For more detailed information about the listing edit functionality, see [LISTING_EDIT_README.md](LISTING_EDIT_README.md).
