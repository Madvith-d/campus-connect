# Campus Connect - College Event Check-in and Attendance Management System

A comprehensive, fully responsive web application designed to streamline event management, student participation, and attendance tracking within a college environment. The system facilitates seamless interaction between students, club administrators, and college administrators through role-based access control and automated QR code-based attendance logging.

## ✨ Latest Updates

### 🎯 **Complete Responsive Design Overhaul**
- **Mobile-First Approach**: Optimized for all screen sizes from mobile to desktop
- **Analytics Page Enhancement**: Fully responsive analytics with mobile-friendly data presentation
- **Progressive Disclosure**: Smart content hiding/showing based on screen size
- **Touch-Friendly Interface**: 44px minimum touch targets for mobile devices
- **Flexible Grid Layouts**: Adaptive layouts that work on any device

### 🚀 **Deployment Ready**
- **Vercel Configuration**: Added `vercel.json` for proper SPA routing
- **No More 404 Errors**: Handles page refreshes and direct URL access
- **Performance Optimized**: Proper caching headers for static assets
- **SEO Friendly**: Proper routing support for search engines

### 🎨 **Enhanced User Experience**
- **Responsive Components**: All dialogs, cards, and forms adapt to screen size
- **Smart Button Labels**: Context-aware text that changes based on screen size
- **Improved Typography**: Responsive text sizing across all breakpoints
- **Better Navigation**: Mobile-friendly navigation with collapsible menu

## 🚀 Features

### ✅ Implemented Features

#### 📱 QR Code System
- **Secure QR Code Generation**: Time-based QR codes with cryptographic validation
- **Camera-based QR Scanner**: Real-time QR code scanning with camera access
- **Multiple Check-in Methods**: Self-scan, staff-scan, and manual attendance logging
- **Security Validation**: Hash verification and time window validation

#### 🎯 Event Management
- **Event Creation**: Club admins can create and manage events
- **Real-time Attendance Dashboard**: Live attendance tracking for organizers
- **Capacity Management**: Registration limits with real-time availability
- **Team Events**: Support for both individual and team-based participation

#### 👥 Team Management
- **Team Creation**: Students can form teams for team events
- **Team Invitations**: Invite system for adding team members
- **Team Leadership**: Team leader management and permissions

#### 🔐 User Management
- **Role-based Access Control**: Student, Club Admin, College Admin roles
- **College Admin Setup**: Environment-based admin configuration
- **User Role Management**: Admin interface for role assignment

#### 📊 Analytics & Reports
- **Attendance Statistics**: Real-time attendance rates and metrics
- **Export Functionality**: CSV export for attendance data
- **Event Analytics**: Participation insights and reporting

#### 🔔 Notifications
- **Toast Notifications**: In-app notification system
- **Browser Push Notifications**: Native browser notification support
- **Event Reminders**: Automated reminder notifications

#### 📱 Progressive Web App (PWA)
- **Offline Support**: Service worker for offline functionality
- **App Installation**: Install as native app on mobile/desktop
- **Background Sync**: Offline data synchronization
- **Mobile Optimized**: Touch-friendly responsive design
- **Fully Responsive**: Seamless experience across all devices

## 🛠️ Technology Stack

### Frontend
- **React 18.3.1** with TypeScript 5.8.3
- **Vite 5.4.19** for build tooling
- **Tailwind CSS 3.4.17** for responsive styling
- **shadcn/ui** components built on Radix UI
- **React Router DOM 6.30.1** for routing
- **React Hook Form** with Zod validation
- **Tanstack React Query** for state management
- **Mobile-First Responsive Design** with breakpoint optimization

### Backend Integration
- **Supabase** for authentication and database
- **PostgreSQL** database with row-level security
- **Real-time subscriptions** for live updates

### Additional Libraries
- **QR Code Generation**: qrcode, react-qr-code
- **QR Code Scanning**: html5-qrcode
- **Security**: crypto-js for hash validation
- **Date Handling**: date-fns
- **Icons**: Lucide React
- **Notifications**: Sonner

## 🏗️ Project Structure

```
src/
├── components/
│   ├── Admin/
│   │   ├── AdminSetupDialog.tsx      # College admin setup
│   │   └── UserRoleDialog.tsx        # User role management
│   ├── Clubs/
│   │   ├── CreateClubDialog.tsx      # Club creation
│   │   └── JoinRequestsDialog.tsx    # Membership requests
│   ├── Events/
│   │   ├── AttendanceCheckIn.tsx     # Check-in interface
│   │   ├── AttendanceDashboard.tsx   # Real-time dashboard
│   │   ├── CreateEventDialog.tsx     # Event creation
│   │   ├── EventDetailsDialog.tsx    # Event information
│   │   └── TeamCreationDialog.tsx    # Team formation
│   ├── Layout/
│   │   └── DashboardLayout.tsx       # Main layout
│   ├── QR/
│   │   ├── QRDisplay.tsx            # QR code display
│   │   └── QRScanner.tsx            # QR code scanner
│   ├── Teams/
│   │   └── TeamInviteDialog.tsx     # Team invitations
│   └── ui/                          # Reusable UI components
├── hooks/
│   ├── useAuth.tsx                  # Authentication hook
│   ├── use-mobile.tsx               # Mobile detection
│   └── use-toast.ts                 # Toast notifications
├── lib/
│   ├── attendance-utils.ts          # Attendance management
│   ├── config.ts                    # Environment configuration
│   ├── notifications.ts             # Notification system
│   ├── pwa.ts                       # PWA utilities
│   ├── qr-utils.ts                  # QR code utilities
│   └── utils.ts                     # General utilities
├── pages/
│   ├── Admin.tsx                    # Admin panel
│   ├── Auth.tsx                     # Authentication
│   ├── Clubs.tsx                    # Club management
│   ├── Events.tsx                   # Event listing
│   ├── Index.tsx                    # Dashboard
│   └── NotFound.tsx                 # 404 page
└── integrations/supabase/
    ├── client.ts                    # Supabase client
    └ types.ts                      # Database types
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-git-url>
   cd campus-connect
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   # Supabase Configuration
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   
   # College Admin Configuration
   VITE_COLLEGE_ADMIN_EMAIL=admin@college.edu
   VITE_COLLEGE_NAME=Your College Name
   VITE_COLLEGE_CODE=COLLEGE001
   
   # QR Code Security
   VITE_QR_SECRET_KEY=your-qr-secret-key-here
   
   # Feature Flags
   VITE_ENABLE_TEAM_EVENTS=true
   VITE_ENABLE_NOTIFICATIONS=true
   VITE_ENABLE_ANALYTICS=true
   ```

4. **Database Setup**
   
   The database schema is automatically created via Supabase migrations. Make sure to run:
   ```bash
   # If using Supabase CLI
   supabase db reset
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

6. **Build for Production**
   ```bash
   npm run build
   ```

## 📱 PWA Installation

Campus Connect is a Progressive Web App that can be installed on mobile devices and desktops:

### Mobile Installation
1. Open the app in your mobile browser (Chrome, Safari, Firefox)
2. Look for "Add to Home Screen" option in the browser menu
3. Follow the installation prompts
4. The app will appear on your home screen like a native app

### Desktop Installation
1. Open the app in Chrome/Edge
2. Click the install icon in the address bar
3. Click "Install" in the popup
4. The app will be available in your applications folder

### PWA Features
- **Offline Support**: Works without internet connection
- **Native App Feel**: Full-screen experience without browser UI
- **Push Notifications**: Get notified about events and updates
- **Background Sync**: Data syncs when connection is restored
- **Responsive Design**: Adapts to any screen size automatically

## 🔐 User Roles & Permissions

### Student
- Register for events
- Join clubs (with approval)
- Check-in to events via QR scan
- Create and manage teams
- View attendance history

### Club Admin
- Create and manage events
- Approve club membership requests
- Access attendance dashboard
- Generate event QR codes
- Manual attendance logging
- Team management

### College Admin
- Manage all clubs and events
- User role assignment
- System configuration
- Analytics and reporting
- Bulk operations

## 🎯 QR Code System

### Security Features
- **Time-based Validation**: QR codes are valid only during event time windows
- **Cryptographic Hashing**: SHA-256 hash validation prevents forgery
- **Unique Event Codes**: Each event generates a unique QR code
- **Single-use Prevention**: Duplicate scans are prevented

### Usage
1. **Event Organizers**: Generate QR codes from the attendance dashboard
2. **Students**: Scan QR codes using the in-app scanner or quick check-in
3. **Manual Entry**: Club admins can manually log attendance for students

## 📊 Analytics & Reporting

### Available Metrics
- Real-time attendance rates
- Event participation statistics
- Club engagement analytics
- Registration vs attendance comparison
- Historical trend analysis

### Export Options
- CSV download for attendance data
- Event-specific reports
- Club performance summaries

## 🔧 Configuration

### Environment Variables
See `.env.example` for all available configuration options.

### Feature Flags
- `VITE_ENABLE_TEAM_EVENTS`: Enable/disable team event functionality
- `VITE_ENABLE_NOTIFICATIONS`: Toggle notification system
- `VITE_ENABLE_ANALYTICS`: Enable/disable analytics features

## 🚀 Deployment

### Vercel (Recommended)
1. **Connect your repository** to Vercel
2. **Set environment variables** in Vercel dashboard
3. **Deploy automatically** - Vercel will detect the `vercel.json` configuration
4. **Build command**: `npm run build` (auto-detected)
5. **Output directory**: `dist` (auto-detected)

The included `vercel.json` ensures:
- ✅ **No 404 errors** on page refresh
- ✅ **Proper SPA routing** for all pages
- ✅ **Optimized caching** for static assets
- ✅ **SEO-friendly** routing

### Netlify
1. Connect your repository to Netlify
2. Set environment variables
3. Deploy with build command: `npm run build`
4. Add `_redirects` file in `public/` folder:
   ```
   /*    /index.html   200
   ```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "preview"]
```

### Manual Deployment
1. Build the project: `npm run build`
2. Deploy the `dist` folder to your web server
3. Configure environment variables on your hosting platform

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Contact: support@college.edu
- Documentation: [Project Wiki]

## 🔮 Roadmap

### Upcoming Features
- **Email Notification System**: Automated email reminders and updates
- **Advanced Analytics Dashboard**: Enhanced reporting and insights
- **Mobile App (React Native)**: Native mobile application
- **Integration with College LMS**: Connect with learning management systems
- **Multi-language Support**: Internationalization for global campuses
- **Calendar Integration**: Sync with Google Calendar, Outlook, etc.
- **Automated Event Reminders**: Smart notification scheduling
- **Bulk Operations**: Mass event creation and management
- **API Documentation**: Comprehensive API for third-party integrations

### Recent Achievements ✅
- **Complete Responsive Design**: Mobile-first approach implemented
- **Vercel Deployment Ready**: Proper SPA routing configuration
- **Performance Optimization**: Enhanced caching and loading times
- **Analytics Enhancement**: Mobile-friendly analytics interface
- **Touch-Friendly UI**: Optimized for mobile interactions

---

## 📱 **Mobile-First Responsive Design**

Campus Connect is built with a **mobile-first approach**, ensuring optimal performance and user experience across all devices:

### 📱 **Mobile Devices (320px - 768px)**
- **Touch-Optimized Interface**: 44px minimum touch targets
- **Collapsible Navigation**: Hamburger menu for space efficiency
- **Stacked Layouts**: Single-column layouts for better readability
- **Simplified Controls**: Essential actions prominently displayed
- **Progressive Disclosure**: Non-essential information hidden by default

### 📱 **Tablets (768px - 1024px)**
- **Two-Column Layouts**: Optimal use of screen real estate
- **Larger Touch Targets**: Enhanced interaction areas
- **Balanced Typography**: Medium-sized text for comfortable reading
- **Flexible Grids**: Adaptive card layouts

### 🖥️ **Desktop (1024px+)**
- **Multi-Column Layouts**: Maximum information density
- **Hover Interactions**: Enhanced with hover effects
- **Sidebar Navigation**: Persistent navigation for quick access
- **Full Feature Set**: All features visible and accessible

### 🎯 **Responsive Features**
- **Analytics Dashboard**: Mobile-friendly data tables with progressive disclosure
- **Event Cards**: Adaptive layouts that work on any screen size
- **QR Code Scanner**: Optimized camera interface for mobile devices
- **Form Inputs**: Touch-friendly form controls with proper spacing
- **Dialog Components**: Full-screen on mobile, centered on desktop

---

**Built with ❤️ for educational institutions**

### 🛠️ **Tech Stack**
- **Frontend**: React 18.3.1 + TypeScript 5.8.3
- **Styling**: Tailwind CSS 3.4.17 (Mobile-First)
- **Components**: shadcn/ui + Radix UI
- **Build Tool**: Vite 5.4.19
- **Backend**: Supabase (PostgreSQL + Auth)
- **PWA**: Service Worker + Offline Support
- **Deployment**: Vercel (with proper SPA routing)

### 🚀 **Quick Deploy**

**Option 1: Vercel (Recommended)**
```bash
# Connect your GitHub repo to Vercel
# Set environment variables
# Deploy automatically with included vercel.json
```

**Option 2: Lovable Platform**
1. Open [Lovable](https://lovable.dev/projects/b137b720-daa3-4e3f-9621-a97b2c05d985)
2. Click Share → Publish
3. Configure custom domain if needed

### 🌐 **Custom Domain Setup**
To connect a custom domain:
1. Navigate to Project → Settings → Domains
2. Click "Connect Domain"
3. Follow the DNS configuration steps

Read more: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
