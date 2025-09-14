# Component Architecture

<cite>
**Referenced Files in This Document**   
- [App.tsx](file://src/App.tsx)
- [DashboardLayout.tsx](file://src/components/Layout/DashboardLayout.tsx)
- [button.tsx](file://src/components/ui/button.tsx)
- [useAuth.tsx](file://src/hooks/useAuth.tsx)
- [Index.tsx](file://src/pages/Index.tsx)
- [Events.tsx](file://src/pages/Events.tsx)
- [CreateEventDialog.tsx](file://src/components/Events/CreateEventDialog.tsx)
- [EventDetailsDialog.tsx](file://src/components/Events/EventDetailsDialog.tsx)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Conclusion](#conclusion)

## Introduction
This document provides a comprehensive overview of the component architecture of the campus-connect application. The system is built using React with a clear separation between layout components, feature components, and reusable UI primitives. The documentation details the role of key components such as DashboardLayout.tsx in managing navigation and role-based access, explains the integration of ShadCN UI components, and illustrates the component hierarchy from App.tsx through routing to page-level and dialog components. It also covers composition patterns, prop drilling avoidance strategies, styling integration with Tailwind, and performance optimizations.

## Project Structure

```mermaid
graph TD
A[App.tsx] --> B[Routing]
B --> C[Index.tsx]
B --> D[Auth.tsx]
B --> E[Events.tsx]
B --> F[Clubs.tsx]
B --> G[Admin.tsx]
B --> H[NotFound.tsx]
C --> I[DashboardLayout.tsx]
E --> I
F --> I
G --> I
I --> J[Header]
I --> K[Navigation Sidebar]
I --> L[Main Content Area]
M[Components] --> N[Layout]
M --> O[Feature Modules]
M --> P[UI Primitives]
O --> Q[Events]
O --> R[Clubs]
O --> S[Admin]
Q --> T[CreateEventDialog.tsx]
Q --> U[EventDetailsDialog.tsx]
Q --> V[TeamCreationDialog.tsx]
P --> W[ShadCN Components]
```

**Diagram sources**
- [App.tsx](file://src/App.tsx#L1-L38)
- [DashboardLayout.tsx](file://src/components/Layout/DashboardLayout.tsx#L1-L137)

**Section sources**
- [App.tsx](file://src/App.tsx#L1-L38)
- [DashboardLayout.tsx](file://src/components/Layout/DashboardLayout.tsx#L1-L137)

## Core Components

The campus-connect application follows a component-based architecture with three primary categories: layout components, feature components, and reusable UI primitives. Layout components like DashboardLayout.tsx provide structural consistency across pages, while feature components encapsulate specific functionality such as event management and club administration. Reusable UI primitives from ShadCN form the foundation of the visual design system, extended and composed to meet application-specific needs.

**Section sources**
- [DashboardLayout.tsx](file://src/components/Layout/DashboardLayout.tsx#L1-L137)
- [button.tsx](file://src/components/ui/button.tsx#L1-L47)

## Architecture Overview

```mermaid
graph TB
subgraph "Application Shell"
A[App.tsx]
B[QueryClientProvider]
C[AuthProvider]
D[TooltipProvider]
E[Toaster]
F[BrowserRouter]
end
subgraph "Routing Layer"
G[Routes]
H[Route: /]
I[Route: /auth]
J[Route: /events]
K[Route: /clubs]
L[Route: /admin]
end
subgraph "Page Components"
M[Index.tsx]
N[Events.tsx]
O[Clubs.tsx]
P[Admin.tsx]
end
subgraph "Layout Component"
Q[DashboardLayout.tsx]
R[Header]
S[Navigation Sidebar]
T[Main Content Area]
end
subgraph "UI Component Library"
U[ShadCN Components]
V[Extended Components]
W[Composed Components]
end
A --> B & C & D & E & F
F --> G
G --> H & I & J & K & L
H --> M
J --> N
K --> O
L --> P
M & N & O & P --> Q
Q --> R & S & T
U --> V --> W
```

**Diagram sources**
- [App.tsx](file://src/App.tsx#L1-L38)
- [DashboardLayout.tsx](file://src/components/Layout/DashboardLayout.tsx#L1-L137)

## Detailed Component Analysis

### Layout Component Analysis

#### DashboardLayout Analysis
The DashboardLayout component serves as the central layout container for authenticated routes, providing consistent navigation and role-based access control. It integrates authentication state from useAuth to dynamically render navigation options based on user roles, showing administrative features only to college_admin users.

```mermaid
classDiagram
class DashboardLayout {
+children : ReactNode
-user : User | null
-profile : Profile | null
-navigation : Array
-getRoleBadgeVariant(role : string) : string
-getRoleLabel(role : string) : string
+render() : JSX.Element
}
class AuthContext {
+user : User | null
+profile : Profile | null
+signOut() : Promise~void~
+loading : boolean
}
class Button {
+variant : 'default'|'destructive'|'outline'|'secondary'|'ghost'|'link'
+size : 'default'|'sm'|'lg'|'icon'
+asChild? : boolean
}
DashboardLayout --> AuthContext : "uses"
DashboardLayout --> Button : "renders"
DashboardLayout ..> Navigation : "generates"
```

**Diagram sources**
- [DashboardLayout.tsx](file://src/components/Layout/DashboardLayout.tsx#L1-L137)
- [useAuth.tsx](file://src/hooks/useAuth.tsx#L1-L197)

**Section sources**
- [DashboardLayout.tsx](file://src/components/Layout/DashboardLayout.tsx#L1-L137)
- [useAuth.tsx](file://src/hooks/useAuth.tsx#L1-L197)

### Feature Component Analysis

#### Events Module Analysis
The Events module demonstrates a comprehensive feature component implementation with multiple dialog components for creating and viewing event details. The Events.tsx page component manages state for event listings and dialog visibility, while delegating complex interactions to specialized dialog components.

```mermaid
sequenceDiagram
participant EventsPage as Events.tsx
participant CreateDialog as CreateEventDialog
participant DetailsDialog as EventDetailsDialog
participant TeamDialog as TeamCreationDialog
participant Supabase as Supabase API
EventsPage->>Supabase : fetchEvents()
Supabase-->>EventsPage : events data
EventsPage->>EventsPage : render event cards
EventsPage->>CreateDialog : Open on button click
CreateDialog->>Supabase : create event
Supabase-->>CreateDialog : success/failure
CreateDialog-->>EventsPage : onEventCreated callback
EventsPage->>Supabase : refresh events
EventsPage->>DetailsDialog : Open with selected event
DetailsDialog->>Supabase : register for event
Supabase-->>DetailsDialog : registration result
DetailsDialog-->>EventsPage : onRegister callback
EventsPage->>Supabase : refresh events
```

**Diagram sources**
- [Events.tsx](file://src/pages/Events.tsx#L1-L273)
- [CreateEventDialog.tsx](file://src/components/Events/CreateEventDialog.tsx#L1-L262)
- [EventDetailsDialog.tsx](file://src/components/Events/EventDetailsDialog.tsx#L1-L183)

**Section sources**
- [Events.tsx](file://src/pages/Events.tsx#L1-L273)
- [CreateEventDialog.tsx](file://src/components/Events/CreateEventDialog.tsx#L1-L262)
- [EventDetailsDialog.tsx](file://src/components/Events/EventDetailsDialog.tsx#L1-L183)

### UI Component Analysis

#### ShadCN Component Integration
The application leverages ShadCN UI components as foundational building blocks, extending them with application-specific logic and styling. The component library in src/components/ui contains all base components that are imported and composed throughout the application.

```mermaid
flowchart TD
A[ShadCN Base Component] --> B[Extended Component]
B --> C[Composed Component]
C --> D[Application Feature]
subgraph "Example: Button Component"
E[button.tsx] --> F[Variant customization]
F --> G[Theme integration]
G --> H[Event registration button]
H --> I[Events.tsx]
end
subgraph "Example: Dialog Component"
J[dialog.tsx] --> K[Form integration]
K --> L[CreateEventDialog]
L --> M[Events management]
end
```

**Diagram sources**
- [button.tsx](file://src/components/ui/button.tsx#L1-L47)
- [dialog.tsx](file://src/components/ui/dialog.tsx)

**Section sources**
- [button.tsx](file://src/components/ui/button.tsx#L1-L47)
- [Events.tsx](file://src/pages/Events.tsx#L1-L273)

## Dependency Analysis

```mermaid
graph LR
A[App.tsx] --> B[AuthProvider]
A --> C[QueryClientProvider]
A --> D[BrowserRouter]
B --> E[useAuth.tsx]
D --> F[Route Components]
F --> G[Index.tsx]
F --> H[Events.tsx]
F --> I[Clubs.tsx]
F --> J[Admin.tsx]
G & H & I & J --> K[DashboardLayout.tsx]
K --> E
H --> L[CreateEventDialog.tsx]
H --> M[EventDetailsDialog.tsx]
H --> N[TeamCreationDialog.tsx]
L & M & N --> O[ShadCN UI Components]
E --> P[Supabase Client]
style A fill:#f9f,stroke:#333
style E fill:#bbf,stroke:#333
style K fill:#f96,stroke:#333
```

**Diagram sources**
- [App.tsx](file://src/App.tsx#L1-L38)
- [useAuth.tsx](file://src/hooks/useAuth.tsx#L1-L197)
- [DashboardLayout.tsx](file://src/components/Layout/DashboardLayout.tsx#L1-L137)

**Section sources**
- [App.tsx](file://src/App.tsx#L1-L38)
- [useAuth.tsx](file://src/hooks/useAuth.tsx#L1-L197)
- [DashboardLayout.tsx](file://src/components/Layout/DashboardLayout.tsx#L1-L137)

## Performance Considerations

The application implements several performance optimization strategies:

1. **State Management**: Uses React Query for server state management, providing caching, background updates, and request deduplication
2. **Component Memoization**: While not explicitly shown, the architecture supports React.memo for expensive components
3. **Conditional Rendering**: DashboardLayout dynamically renders navigation based on user role, avoiding unnecessary DOM elements
4. **Deferred Loading**: Profile data is fetched after initial render using setTimeout to improve perceived performance
5. **Efficient Data Fetching**: Uses Promise.all for parallel data retrieval in Index.tsx
6. **Lazy Loading**: Could be implemented for dialog components to reduce initial bundle size

The component architecture minimizes prop drilling through context providers (AuthProvider) and direct imports, maintaining clean component interfaces while ensuring necessary data is available where needed.

**Section sources**
- [App.tsx](file://src/App.tsx#L1-L38)
- [useAuth.tsx](file://src/hooks/useAuth.tsx#L1-L197)
- [Index.tsx](file://src/pages/Index.tsx#L1-L276)

## Conclusion

The campus-connect application demonstrates a well-structured component architecture with clear separation of concerns. The layout component (DashboardLayout.tsx) provides consistent navigation and role-based access control across all authenticated routes. Feature components are organized by domain (Events, Clubs, Admin) with dedicated dialog components for complex interactions. The application effectively leverages ShadCN UI components as reusable primitives, extending and composing them for specific use cases. The routing structure starting from App.tsx provides a clear entry point, with proper authentication guarding and error handling. Performance considerations are addressed through efficient state management and data fetching patterns, creating a responsive user experience.