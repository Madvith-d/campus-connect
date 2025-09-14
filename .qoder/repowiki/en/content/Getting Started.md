# Getting Started

<cite>
**Referenced Files in This Document**   
- [README.md](file://README.md)
- [package.json](file://package.json)
- [supabase/config.toml](file://supabase/config.toml)
- [src/integrations/supabase/client.ts](file://src/integrations/supabase/client.ts)
- [vite.config.ts](file://vite.config.ts)
- [supabase/migrations/20250908005627_511ef022-3222-4458-b7de-e0063ed13e63.sql](file://supabase/migrations/20250908005627_511ef022-3222-4458-b7de-e0063ed13e63.sql)
- [supabase/migrations/20250909010718_5336955c-8e01-4c24-9b07-3f5a1082d666.sql](file://supabase/migrations/20250909010718_5336955c-8e01-4c24-9b07-3f5a1082d666.sql)
- [supabase/migrations/20250909010744_baf630ed-00b1-48e7-add2-b4e5703f0a84.sql](file://supabase/migrations/20250909010744_baf630ed-00b1-48e7-add2-b4e5703f0a84.sql)
</cite>

## Table of Contents
1. [Cloning the Repository](#cloning-the-repository)
2. [Installing Dependencies](#installing-dependencies)
3. [Configuring Environment Variables](#configuring-environment-variables)
4. [Setting Up Local Supabase Instance](#setting-up-local-supabase-instance)
5. [Applying Migrations and Seeding Data](#applying-migrations-and-seeding-data)
6. [Starting the Development Server](#starting-the-development-server)
7. [Troubleshooting Common Issues](#troubleshooting-common-issues)

## Cloning the Repository

To begin setting up the campus-connect development environment, first clone the repository using Git. Open your terminal and run:

```sh
git clone <YOUR_GIT_URL>
cd campus-connect
```

Replace `<YOUR_GIT_URL>` with the actual Git URL of your repository. This creates a local copy of the project with the complete file structure including source code, configuration files, and Supabase migration scripts.

**Section sources**
- [README.md](file://README.md#L15-L20)

## Installing Dependencies

After cloning, navigate to the project root directory and install all required dependencies using npm:

```sh
npm install
```

This command reads the `package.json` file and installs all listed dependencies, including React, TypeScript, Vite, Tailwind CSS, shadcn-ui components, and Supabase client libraries. The installation includes both runtime dependencies and development tools needed for building and linting the application.

Expected output includes:
```
added 1000+ packages in Xs
```

Ensure Node.js (v18+) and npm are installed on your system before running this command.

**Section sources**
- [package.json](file://package.json#L1-L85)
- [README.md](file://README.md#L25-L30)

## Configuring Environment Variables

The campus-connect application uses Supabase for backend services. While the Supabase URL and publishable key are pre-configured in the codebase, you should understand their usage:

The file `src/integrations/supabase/client.ts` contains:
- `SUPABASE_URL`: Points to `https://ltthgdnsbqgukkicitxe.supabase.co`
- `SUPABASE_PUBLISHABLE_KEY`: Authentication token for public access

These values are hardcoded for development convenience but should be moved to environment variables in production. To customize, create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Then update the client file to use `import.meta.env.VITE_SUPABASE_URL` and `import.meta.env.VITE_SUPABASE_ANON_KEY`.

**Section sources**
- [src/integrations/supabase/client.ts](file://src/integrations/supabase/client.ts#L4-L7)

## Setting Up Local Supabase Instance

To run a local Supabase instance for development:

1. Install the Supabase CLI:
```sh
npm install -g supabase
```

2. Link your project:
```sh
supabase login
supabase link --project-ref ltthgdnsbqgukkicitxe
```

3. Start the local instance:
```sh
supabase start
```

This command launches PostgreSQL, Auth, Storage, and other Supabase services locally. The `supabase/config.toml` file contains the project ID `ltthgdnsbqgukkicitxe`, which links to the remote project configuration.

Upon successful startup, you'll see output showing:
- API URL
- Database credentials
- Studio (dashboard) URL

Access the Supabase Studio at the provided URL to manage data, users, and settings.

**Section sources**
- [supabase/config.toml](file://supabase/config.toml#L1)
- [src/integrations/supabase/client.ts](file://src/integrations/supabase/client.ts#L4)

## Applying Migrations and Seeding Data

The project includes database migrations in the `supabase/migrations/` directory. These SQL files define the database schema and are applied in chronological order.

To apply migrations to your local database:

```sh
supabase db push
```

This command synchronizes your local database schema with the migration files. You should see output confirming each migration was applied successfully.

To seed initial data:
1. Use Supabase Studio to manually insert records into tables
2. Or create a seed script in `supabase/seed.sql` and run:
```sh
supabase db run --file supabase/seed.sql
```

The existing migrations establish core tables for users, clubs, events, and roles with proper relationships and constraints.

**Section sources**
- [supabase/migrations/20250908005627_511ef022-3222-4458-b7de-e0063ed13e63.sql](file://supabase/migrations/20250908005627_511ef022-3222-4458-b7de-e0063ed13e63.sql)
- [supabase/migrations/20250909010718_5336955c-8e01-4c24-9b07-3f5a1082d666.sql](file://supabase/migrations/20250909010718_5336955c-8e01-4c24-9b07-3f5a1082d666.sql)
- [supabase/migrations/20250909010744_baf630ed-00b1-48e7-add2-b4e5703f0a84.sql](file://supabase/migrations/20250909010744_baf630ed-00b1-48e7-add2-b4e5703f0a84.sql)

## Starting the Development Server

Once dependencies are installed and Supabase is running, start the development server:

```sh
npm run dev
```

This command launches the Vite development server configured to run on port 8080 (as defined in `vite.config.ts`). You'll see output similar to:

```
vite v5.4.19 dev server running at:
> Local: http://localhost:8080/
> Network: http://[your-ip]:8080/
```

The application supports hot module replacement (HMR), meaning code changes are instantly reflected in the browser without full reload. Navigate to `http://localhost:8080` to access the campus-connect application.

The server automatically reloads when you modify any source file in the `src/` directory.

**Section sources**
- [vite.config.ts](file://vite.config.ts#L6-L10)
- [package.json](file://package.json#L6-L8)

## Troubleshooting Common Issues

### Missing Environment Variables
If you encounter connection errors, ensure Supabase credentials are correct. If using custom environment variables, verify the `.env` file exists and contains valid values.

### Database Connection Errors
- Ensure `supabase start` completed successfully
- Check that Docker is running (required for Supabase local instance)
- Run `supabase status` to verify all services are healthy
- If migrations fail, try `supabase db reset` to restart the database

### Authentication Misconfigurations
- Verify the `SUPABASE_PUBLISHABLE_KEY` has not expired
- Check Supabase dashboard for enabled authentication methods
- Ensure email/password authentication is enabled in Supabase Auth settings
- Clear localStorage in browser if experiencing auth state issues

### Development Server Not Starting
- Ensure port 8080 is available or modify `vite.config.ts`
- Delete `node_modules` and `package-lock.json`, then rerun `npm install`
- Check Node.js version compatibility (requires v18+)

### Migration Application Failures
- Ensure `supabase CLI` is authenticated
- Verify migration files have correct syntax
- Check for circular dependencies in table relationships
- Use `supabase db diff` to generate new migration files

**Section sources**
- [README.md](file://README.md#L25-L30)
- [package.json](file://package.json#L6-L8)
- [vite.config.ts](file://vite.config.ts#L6-L10)
- [src/integrations/supabase/client.ts](file://src/integrations/supabase/client.ts#L4-L7)