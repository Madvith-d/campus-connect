# Navigation Components

<cite>
**Referenced Files in This Document**   
- [DashboardLayout.tsx](file://src/components/Layout/DashboardLayout.tsx)
- [Admin.tsx](file://src/pages/Admin.tsx)
- [breadcrumb.tsx](file://src/components/ui/breadcrumb.tsx)
- [navigation-menu.tsx](file://src/components/ui/navigation-menu.tsx)
- [tabs.tsx](file://src/components/ui/tabs.tsx)
- [sidebar.tsx](file://src/components/ui/sidebar.tsx)
- [menubar.tsx](file://src/components/ui/menubar.tsx)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Core Navigation Components](#core-navigation-components)
3. [DashboardLayout Structure](#dashboardlayout-structure)
4. [Role-Based Access and Menubar](#role-based-access-and-menubar)
5. [Breadcrumb Implementation](#breadcrumb-implementation)
6. [Tabs for Feature Module Navigation](#tabs-for-feature-module-navigation)
7. [Pagination and Data Navigation](#pagination-and-data-navigation)
8. [Responsive Design and Mobile Behavior](#responsive-design-and-mobile-behavior)
9. [Accessibility Features](#accessibility-features)
10. [Integration with React Router](#integration-with-react-router)
11. [Conclusion](#conclusion)

## Introduction
This document provides a comprehensive analysis of the navigation components within the Campus Connect application. It details how navigation-menu, tabs, breadcrumb, sidebar, menubar, and pagination elements structure user navigation across the DashboardLayout and feature modules such as Events, Clubs, and Admin. The documentation covers integration with React Router for URL-driven navigation and active state management, role-based access control in navigation elements, responsive design considerations, and accessibility features including ARIA roles and keyboard navigation.

## Core Navigation Components

The application implements a suite of navigation components from the UI library to create a cohesive navigation experience. These components include sidebar for primary navigation, menubar for secondary actions, breadcrumb for location context, tabs for content organization, and navigation-menu for structured menus.

```mermaid
graph TD
A[Navigation Components] --> B[sidebar]
A --> C[menubar]
A --> D[breadcrumb]
A --> E[tabs]
A --> F[navigation-menu]
A --> G[pagination]
B --> H[Primary Navigation]
C --> I[Secondary Actions]
D --> J[Location Context]
E --> K[Content Organization]
F --> L[Structured Menus]
G --> M[Data Navigation]
```

**Diagram sources**
- [sidebar.tsx](file://src/components/ui/sidebar.tsx)
- [menubar.tsx](file://src/components/ui/menubar.tsx)
- [breadcrumb.tsx](file://src/components/ui/breadcrumb.tsx)
- [tabs.tsx](file://src/components/ui/tabs.tsx)
- [navigation-menu.tsx](file://src/components/ui/navigation-menu.tsx)

**Section sources**
- [sidebar.tsx](file://src/components/ui/sidebar.tsx#L1-L638)
- [menubar.tsx](file://src/components/ui/menubar.tsx#L1-L208)

## DashboardLayout Structure

The DashboardLayout component serves as the central navigation container, organizing the sidebar, header, and main content areas. It implements role-based navigation by conditionally rendering menu items based on the user's profile role, providing different navigation options for students, club admins, and college admins.

```mermaid
graph TB
A[DashboardLayout] --> B[Header]
A --> C[Sidebar]
A --> D[Main Content]
B --> E[App Name]
B --> F[User Profile]
B --> G[Sign Out Button]
B --> H[Admin Setup Button]
C --> I[Navigation Links]
I --> J[Dashboard]
I --> K[Events]
I --> L[Clubs]
I --> M[Admin Panel]
I --> N[Users]
D --> O[Welcome Card]
D --> P[Children Content]
```

**Diagram sources**
- [DashboardLayout.tsx](file://src/components/Layout/DashboardLayout.tsx#L1-L164)

**Section sources**
- [DashboardLayout.tsx](file://src/components/Layout/DashboardLayout.tsx#L1-L164)

## Role-Based Access and Menubar

The navigation system implements role-based access control through conditional rendering of menu items in the sidebar. The Admin Panel and Users sections are only visible to college administrators, while club admins and students have access to different subsets of functionality.

```mermaid
graph TD
A[User Role] --> B{Role Type}
B --> C[Student]
B --> D[Club Admin]
B --> E[College Admin]
C --> F[Dashboard]
C --> G[Events]
C --> H[Clubs]
D --> F[Dashboard]
D --> G[Events]
D --> H[Clubs]
E --> F[Dashboard]
E --> G[Events]
E --> H[Clubs]
E --> I[Admin Panel]
E --> J[Users]
style E fill:#f9f,stroke:#333
```

**Diagram sources**
- [DashboardLayout.tsx](file://src/components/Layout/DashboardLayout.tsx#L25-L35)
- [Admin.tsx](file://src/pages/Admin.tsx#L25-L45)

**Section sources**
- [DashboardLayout.tsx](file://src/components/Layout/DashboardLayout.tsx#L20-L45)
- [Admin.tsx](file://src/pages/Admin.tsx#L20-L50)

## Breadcrumb Implementation

The breadcrumb component provides hierarchical navigation context, allowing users to understand their current location within the application and navigate back to parent sections. Implemented using the Breadcrumb, BreadcrumbList, BreadcrumbItem, and BreadcrumbLink components, it follows accessibility best practices with proper ARIA labels.

```mermaid
graph LR
A[Breadcrumb] --> B[BreadcrumbList]
A --> C[BreadcrumbItem]
A --> D[BreadcrumbLink]
A --> E[BreadcrumbPage]
A --> F[BreadcrumbSeparator]
A --> G[BreadcrumbEllipsis]
B --> H[Ordered List]
C --> I[Navigation Item]
D --> J[Interactive Link]
E --> K[Current Page]
F --> L[Separator Icon]
G --> M[Overflow Indicator]
```

**Diagram sources**
- [breadcrumb.tsx](file://src/components/ui/breadcrumb.tsx#L1-L91)

**Section sources**
- [breadcrumb.tsx](file://src/components/ui/breadcrumb.tsx#L1-L91)

## Tabs for Feature Module Navigation

The tabs component provides a way to organize content within feature modules, allowing users to switch between different views without leaving the current page. Implemented with Tabs, TabsList, TabsTrigger, and TabsContent components, it supports keyboard navigation and screen reader accessibility.

```mermaid
graph TD
A[Tabs] --> B[TabsList]
A --> C[TabsTrigger]
A --> D[TabsContent]
B --> E[Tab Container]
C --> F[Tab Button]
D --> G[Tab Panel]
F --> H[Active State]
F --> I[Hover State]
F --> J[Focus State]
style H fill:#0f0,stroke:#333
style I fill:#ff0,stroke:#333
style J fill:#0ff,stroke:#333
```

**Diagram sources**
- [tabs.tsx](file://src/components/ui/tabs.tsx#L1-L54)

**Section sources**
- [tabs.tsx](file://src/components/ui/tabs.tsx#L1-L54)

## Pagination and Data Navigation

While not explicitly shown in the provided code, the pagination component is available in the UI library and would be used for navigating through large datasets in feature modules like Events and Clubs. It provides controls for moving between pages of data with proper accessibility attributes.

```mermaid
graph TD
A[Pagination] --> B[Previous Button]
A --> C[Page Numbers]
A --> D[Next Button]
A --> E[Page Indicators]
B --> F[Disabled State]
B --> G[Enabled State]
D --> H[Disabled State]
D --> I[Enabled State]
C --> J[Current Page]
C --> K[Other Pages]
style J fill:#0f0,stroke:#333
```

**Diagram sources**
- [pagination.tsx](file://src/components/ui/pagination.tsx)

**Section sources**
- [pagination.tsx](file://src/components/ui/pagination.tsx)

## Responsive Design and Mobile Behavior

The navigation components implement responsive design principles to ensure usability across device sizes. The sidebar collapses into a mobile-friendly drawer on smaller screens, and touch targets are appropriately sized for mobile interaction.

```mermaid
graph TD
A[Device Size] --> B{Screen Width}
B --> C[Desktop]
B --> D[Mobile]
C --> E[Expanded Sidebar]
C --> F[Full Navigation]
C --> G[Hover States]
D --> H[Collapsed Sidebar]
D --> I[Mobile Drawer]
D --> J[Touch Targets]
H --> K[Icon-Only Mode]
I --> L[Slide-Out Panel]
J --> M[Minimum 44px Size]
style D fill:#f9f,stroke:#333
```

**Diagram sources**
- [sidebar.tsx](file://src/components/ui/sidebar.tsx#L100-L150)
- [use-mobile.tsx](file://src/hooks/use-mobile.tsx)

**Section sources**
- [sidebar.tsx](file://src/components/ui/sidebar.tsx#L1-L638)
- [use-mobile.tsx](file://src/hooks/use-mobile.tsx)

## Accessibility Features

The navigation components implement comprehensive accessibility features including ARIA roles, keyboard navigation support, and screen reader compatibility. Each component follows WCAG guidelines to ensure accessibility for all users.

```mermaid
graph TD
A[Accessibility Features] --> B[ARIA Roles]
A --> C[Keyboard Navigation]
A --> D[Screen Reader Support]
A --> E[Focus Management]
A --> F[Semantic HTML]
B --> G[aria-label]
B --> H[aria-current]
B --> I[aria-disabled]
C --> J[Tab Navigation]
C --> K[Arrow Keys]
C --> L[Enter/Space]
D --> M[Screen Reader Labels]
D --> N[Announcements]
D --> O[Landmarks]
style A fill:#0f0,stroke:#333
```

**Diagram sources**
- [sidebar.tsx](file://src/components/ui/sidebar.tsx#L200-L250)
- [menubar.tsx](file://src/components/ui/menubar.tsx#L100-L150)
- [breadcrumb.tsx](file://src/components/ui/breadcrumb.tsx#L50-L70)

**Section sources**
- [sidebar.tsx](file://src/components/ui/sidebar.tsx#L1-L638)
- [menubar.tsx](file://src/components/ui/menubar.tsx#L1-L208)
- [breadcrumb.tsx](file://src/components/ui/breadcrumb.tsx#L1-L91)

## Integration with React Router

The navigation components are integrated with React Router for URL-driven navigation and active state management. The useLocation hook is used to determine the current route and highlight the active navigation item in the sidebar.

```mermaid
graph TD
A[React Router] --> B[useLocation]
A --> C[Link Component]
A --> D[Navigation State]
B --> E[Current Pathname]
C --> F[Client-Side Navigation]
D --> G[Active Item Highlight]
E --> H[Compare with Href]
F --> I[No Page Reload]
G --> J[Button Variant Update]
style A fill:#0f0,stroke:#333
```

**Diagram sources**
- [DashboardLayout.tsx](file://src/components/Layout/DashboardLayout.tsx#L10-L15)
- [DashboardLayout.tsx](file://src/components/Layout/DashboardLayout.tsx#L60-L80)

**Section sources**
- [DashboardLayout.tsx](file://src/components/Layout/DashboardLayout.tsx#L1-L164)

## Conclusion
The navigation system in the Campus Connect application provides a comprehensive, accessible, and responsive user interface for navigating between feature modules. By leveraging React Router for URL-driven navigation and implementing role-based access control, the system ensures that users have appropriate access to functionality based on their roles. The use of standardized UI components for sidebar, menubar, breadcrumb, tabs, and other navigation elements creates a consistent user experience across the application. The implementation follows accessibility best practices, ensuring usability for all users regardless of their interaction method.