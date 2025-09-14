# Events Management

<cite>
**Referenced Files in This Document**   
- [Events.tsx](file://src/pages/Events.tsx)
- [CreateEventDialog.tsx](file://src/components/Events/CreateEventDialog.tsx)
- [TeamCreationDialog.tsx](file://src/components/Events/TeamCreationDialog.tsx)
- [EventDetailsDialog.tsx](file://src/components/Events/EventDetailsDialog.tsx)
- [20250908005627_511ef022-3222-4458-b7de-e0063ed13e63.sql](file://supabase/migrations/20250908005627_511ef022-3222-4458-b7de-e0063ed13e63.sql)
- [types.ts](file://src/integrations/supabase/types.ts)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Conclusion](#conclusion)

## Introduction
The Events Management system enables users to discover, create, register for, and manage college events. It supports both individual and team-based events with comprehensive registration workflows. The system is built on a Supabase backend with React frontend components, featuring role-based access control and real-time data synchronization. Key functionality includes event listing, creation, registration management, team formation, and attendance tracking.

## Project Structure

```mermaid
graph TD
subgraph "Pages"
Events[Events.tsx]
end
subgraph "Components"
EventsFolder[Events/]
UI[ui/]
end
subgraph "Integrations"
Supabase[Supabase/]
end
Events --> EventsFolder
Events --> Supabase
EventsFolder --> CreateEventDialog[CreateEventDialog.tsx]
EventsFolder --> TeamCreationDialog[TeamCreationDialog.tsx]
EventsFolder --> EventDetailsDialog[EventDetailsDialog.tsx]
Supabase --> client[client.ts]
Supabase --> types[types.ts]
style Events fill:#4C82AF,stroke:#333
style EventsFolder fill:#6AA84F,stroke:#333
style Supabase fill:#A64CA6,stroke:#333
```

**Diagram sources**
- [Events.tsx](file://src/pages/Events.tsx)
- [CreateEventDialog.tsx](file://src/components/Events/CreateEventDialog.tsx)
- [supabase](file://src/integrations/supabase)

**Section sources**
- [Events.tsx](file://src/pages/Events.tsx)
- [components](file://src/components)

## Core Components

The Events Management system consists of several key components that work together to provide a complete event lifecycle management solution. The main page component (Events.tsx) orchestrates the display and interaction with events, while dialog components handle specific user actions like event creation and registration. The system leverages Supabase for data persistence and authentication, with a well-defined data model that supports complex relationships between events, users, teams, and registrations.

**Section sources**
- [Events.tsx](file://src/pages/Events.tsx)
- [CreateEventDialog.tsx](file://src/components/Events/CreateEventDialog.tsx)
- [TeamCreationDialog.tsx](file://src/components/Events/TeamCreationDialog.tsx)

## Architecture Overview

```mermaid
graph TD
A[Events Page] --> B[Event Listing]
A --> C[Event Creation]
A --> D[Event Registration]
A --> E[Attendance Management]
B --> F[Fetch Events from Supabase]
B --> G[Display Event Cards]
C --> H[CreateEventDialog]
C --> I[Validate Form Data]
C --> J[Submit to Supabase]
D --> K[Individual Registration]
D --> L[Team Registration]
L --> M[TeamCreationDialog]
F --> N[events Table]
J --> N
K --> O[registrations Table]
L --> P[teams Table]
L --> Q[team_members Table]
style A fill:#4C82AF,stroke:#333
style C fill:#6AA84F,stroke:#333
style D fill:#6AA84F,stroke:#333
style N fill:#A64CA6,stroke:#333
style O fill:#A64CA6,stroke:#333
style P fill:#A64CA6,stroke:#333
style Q fill:#A64CA6,stroke:#333
```

**Diagram sources**
- [Events.tsx](file://src/pages/Events.tsx)
- [CreateEventDialog.tsx](file://src/components/Events/CreateEventDialog.tsx)
- [20250908005627_511ef022-3222-4458-b7de-e0063ed13e63.sql](file://supabase/migrations/20250908005627_511ef022-3222-4458-b7de-e0063ed13e63.sql)

## Detailed Component Analysis

### Event Listing and Display

The Events.tsx component is responsible for fetching and displaying all available events in a card-based layout. It uses Supabase to retrieve event data along with related club information and registration counts. The component implements real-time updates through React's useEffect hook, ensuring the event list stays current. Each event card displays key information including title, location, time, capacity status, and action buttons for registration and details viewing.

```mermaid
sequenceDiagram
participant User
participant EventsPage
participant Supabase
User->>EventsPage : Navigate to Events page
EventsPage->>Supabase : SELECT events with clubs and registrations
Supabase-->>EventsPage : Return event data
EventsPage->>EventsPage : Format dates and calculate availability
EventsPage->>User : Display event cards
User->>EventsPage : Click Register on team event
EventsPage->>EventsPage : Set selected event
EventsPage->>EventsPage : Open TeamCreationDialog
```

**Diagram sources**
- [Events.tsx](file://src/pages/Events.tsx#L1-L353)

**Section sources**
- [Events.tsx](file://src/pages/Events.tsx#L1-L353)

### CreateEventDialog Implementation

The CreateEventDialog component provides a form interface for club administrators to create new events. The dialog validates user permissions by checking if the current user has club_admin role and fetches the clubs they administer. The form includes fields for event title, description, location, start and end times, capacity, and a toggle for team events. Client-side validation ensures date integrity and required fields are completed before submission to Supabase.

```mermaid
flowchart TD
Start([Dialog Open]) --> CheckRole["Check User Role"]
CheckRole --> RoleValid{"Role is club_admin?"}
RoleValid --> |No| ShowError["Display 'Need club admin' message"]
RoleValid --> |Yes| FetchClubs["Fetch User's Clubs"]
FetchClubs --> DisplayForm["Display Event Form"]
DisplayForm --> ValidateInput["Validate Form Fields"]
ValidateInput --> InputValid{"All Fields Valid?"}
InputValid --> |No| HighlightErrors["Highlight Invalid Fields"]
InputValid --> |Yes| SubmitToSupabase["Submit to Supabase"]
SubmitToSupabase --> Success["Show Success Toast"]
Success --> ResetForm["Reset Form and Close Dialog"]
SubmitToSupabase --> Failure["Show Error Toast"]
Failure --> StayOpen["Keep Dialog Open"]
HighlightErrors --> DisplayForm
StayOpen --> DisplayForm
```

**Diagram sources**
- [CreateEventDialog.tsx](file://src/components/Events/CreateEventDialog.tsx#L1-L262)

**Section sources**
- [CreateEventDialog.tsx](file://src/components/Events/CreateEventDialog.tsx#L1-L262)

### TeamCreationDialog Implementation

The TeamCreationDialog component handles the creation of teams for team-based events. When a user registers for a team event, this dialog allows them to create a new team with a specified name, becoming the team leader. The component first creates the team record in the teams table, then automatically adds the creator as a team member in the team_members table. After successful creation, users can invite additional members through the TeamInviteDialog component.

```mermaid
sequenceDiagram
participant User
participant TeamDialog
participant Supabase
User->>TeamDialog : Open Team Creation Dialog
TeamDialog->>Supabase : INSERT into teams table
Supabase-->>TeamDialog : Return team ID
TeamDialog->>Supabase : INSERT leader into team_members
Supabase-->>TeamDialog : Confirmation
TeamDialog->>User : Show success message
TeamDialog->>User : Offer to invite members
```

**Diagram sources**
- [TeamCreationDialog.tsx](file://src/components/Events/TeamCreationDialog.tsx#L1-L165)

**Section sources**
- [TeamCreationDialog.tsx](file://src/components/Events/TeamCreationDialog.tsx#L1-L165)

### Event Details and Registration Flow

The EventDetailsDialog component provides comprehensive information about a specific event and handles individual registration. The dialog displays event details including description, date/time, location, and capacity status. It implements business logic to determine registration eligibility based on event capacity and user registration status. For individual events, users can register directly through this dialog, which creates a record in the registrations table.

```mermaid
flowchart TD
A[Open EventDetailsDialog] --> B{Is Registered?}
B --> |Yes| C[Show "Already Registered"]
B --> |No| D{Is Event Full?}
D --> |Yes| E[Show "Event Full"]
D --> |No| F[Show Register Button]
F --> G[User Clicks Register]
G --> H[Call Supabase INSERT]
H --> I{Success?}
I --> |Yes| J[Show Success Toast]
I --> |No| K[Show Error Toast]
J --> L[Close Dialog and Refresh]
K --> M[Keep Dialog Open]
```

**Diagram sources**
- [EventDetailsDialog.tsx](file://src/components/Events/EventDetailsDialog.tsx#L1-L183)

**Section sources**
- [EventDetailsDialog.tsx](file://src/components/Events/EventDetailsDialog.tsx#L1-L183)

## Dependency Analysis

```mermaid
erDiagram
EVENTS ||--o{ REGISTRATIONS : "has"
EVENTS ||--o{ TEAMS : "has"
EVENTS ||--|| CLUBS : "belongs to"
TEAMS ||--o{ TEAM_MEMBERS : "contains"
TEAMS ||--|| PROFILES : "led by"
REGISTRATIONS ||--|| PROFILES : "by"
REGISTRATIONS }o--|| TEAMS : "via"
CLUBS ||--o{ CLUB_MEMBERS : "has"
CLUBS ||--|| PROFILES : "created by"
EVENTS {
uuid id PK
uuid club_id FK
string title
text description
string location
timestamp start_time
timestamp end_time
integer capacity
boolean is_team_event
string qr_code UK
timestamp created_at
timestamp updated_at
}
REGISTRATIONS {
uuid id PK
uuid event_id FK
uuid profile_id FK
uuid team_id FK
timestamp registered_at
}
TEAMS {
uuid id PK
uuid event_id FK
string name
uuid leader_id FK
timestamp created_at
}
TEAM_MEMBERS {
uuid id PK
uuid team_id FK
uuid profile_id FK
timestamp joined_at
}
CLUBS {
uuid id PK
string name
text description
uuid created_by FK
boolean approved
timestamp created_at
timestamp updated_at
}
PROFILES {
uuid user_id PK
string name
string usn
string branch
user_role role
timestamp created_at
timestamp updated_at
}
```

**Diagram sources**
- [20250908005627_511ef022-3222-4458-b7de-e0063ed13e63.sql](file://supabase/migrations/20250908005627_511ef022-3222-4458-b7de-e0063ed13e63.sql)
- [types.ts](file://src/integrations/supabase/types.ts)

**Section sources**
- [20250908005627_511ef022-3222-4458-b7de-e0063ed13e63.sql](file://supabase/migrations/20250908005627_511ef022-3222-4458-b7de-e0063ed13e63.sql)
- [types.ts](file://src/integrations/supabase/types.ts)

## Performance Considerations

The Events Management system implements several performance optimizations to ensure responsive user experiences. The Events.tsx component uses efficient data fetching patterns with Supabase, retrieving only necessary fields and related data in a single query. Client-side state management minimizes unnecessary re-renders through proper useState and useEffect usage. Form validation is performed client-side to reduce server round trips, while toast notifications provide immediate user feedback without blocking the UI. The system also implements proper loading states to maintain perceived performance during data operations.

## Troubleshooting Guide

Common issues in the Events Management system typically relate to permission errors, validation failures, and data consistency. For event creation, ensure the user has club_admin role and is a member of at least one club. Registration issues may occur when events are full or when duplicate registrations are attempted (prevented by the UNIQUE constraint on event_id and profile_id). Team creation requires careful handling of transactional integrity - both team and team_member records must be created successfully. Database constraints and RLS policies should be verified when encountering unexpected permission denials.

**Section sources**
- [CreateEventDialog.tsx](file://src/components/Events/CreateEventDialog.tsx#L1-L262)
- [EventDetailsDialog.tsx](file://src/components/Events/EventDetailsDialog.tsx#L1-L183)
- [20250908005627_511ef022-3222-4458-b7de-e0063ed13e63.sql](file://supabase/migrations/20250908005627_511ef022-3222-4458-b7de-e0063ed13e63.sql)

## Conclusion

The Events Management system provides a comprehensive solution for college event lifecycle management, from creation to attendance tracking. Its well-structured component architecture and robust data model support both individual and team-based events with proper role-based access control. The integration with Supabase ensures data consistency and security through RLS policies and database constraints. Future enhancements could include waitlist functionality for full events, recurring event patterns, and improved team management features like member removal and leadership transfer.