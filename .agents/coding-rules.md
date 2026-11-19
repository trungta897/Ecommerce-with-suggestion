---
description: "coding rule"
globs: "*.tsx, *ts, *.js"
---

# coding-rules

- When modifying source code, only fix what was asked — do not delete existing, working code that you consider unnecessary.
- All comments and messages in the source code must be in English.

You are an expert developer in Next.js 14 App Router, TypeScript, React, MySQL, NestJS, Tailwind CSS, Shadcn UI, and modern full-stack development. Your goal is to generate optimized, best-practice code that is maintainable, scalable, and performant.

## Key Principles

    •	Use Next.js App Router (src/app/) structure for routing and layouts.
    •	Prefer React Server Components (RSC) for performance; use use client only when necessary.
    •	Keep the API layer clean by using traditional API routes (src/app/api/) for mutations but Server Actions are acceptable if needed.
    •	Implement JWT Authentication with Access Token + Refresh Token rotation (handled by NestJS backend).
    •	Use Zustand for client-side state management, ensuring minimal useState and useEffect.
    •	Follow TypeORM best practices for database access and MySQL query optimization.
    •	Ensure accessibility (a11y) and performance optimizations for UI components.

## Next.js & RSC Best Practices

    •	Prefer Server Components (async components) for rendering whenever possible.
    •	Use use client only when necessary (e.g., for Zustand stores, interactive components).
    •	Fetch data using API calls to NestJS backend in Server Components instead of using useEffect.
    •	Optimize API routes (src/app/api/) by using POST, GET, PATCH, DELETE conventions.
    •	Use middleware (middleware.ts) for authentication and protected routes.

## Project Structure

- Use the Next.js App Router (`src/app/` directory) for routing and server actions.
- Organize files as:

```
/frontend
  /src
    /app
      /api           // Proxy routes if needed
      /(auth)        // Auth pages (login, register)
      /(main)        // Main app pages
      /admin         // Admin pages
    /components
      /ui            // Shadcn UI components
    /lib
      /api-client.ts // Axios/fetch wrapper for NestJS backend
      /auth.ts       // JWT token helpers (store/refresh)
      /utils.ts      // Helper functions
    /hooks           // Custom React hooks
    /store
      /userStore.ts  // Zustand store for user state
      /cartStore.ts  // Zustand store for cart
    /types           // TypeScript interfaces
    /styles
      globals.css    // Tailwind styles
    layout.tsx
    page.tsx
    middleware.ts    // Protect routes globally (check JWT)
```

- Keep server and client logic separate: **Favor server components unless interactivity is required.**

## TypeScript & JavaScript Guidelines

- Use TypeScript for all code. Prefer interfaces over types for object shapes.
- Avoid enums; use literal types or maps instead.
- Use function components (`function ComponentName() {}`), not `const Component = () => {}` for better stack traces.

## Data Fetching & API Handling

- Use **React Server Components (RSC)** and Server Actions (`use server`) for data fetching.
- Avoid `useEffect` for fetching; use `axios()` inside server components.
- Use dynamic imports for non-critical client components.
- Implement error boundaries (`error.tsx`) to gracefully handle API failures.
- All data comes from NestJS backend via REST API — do not access database directly from frontend.

## Authentication (JWT — NestJS Backend)

    •	JWT Authentication is handled entirely by the NestJS backend.
    •	Frontend stores Access Token in memory/cookie and Refresh Token in HttpOnly cookie.
    •	Use middleware.ts to check token validity and redirect unauthenticated users.
    •	Role-based access control: Guest, User, Admin.

## Database (MySQL & TypeORM — Backend only)

    •	Use TypeORM as the ORM for database access in NestJS backend.
    •	Define MySQL entities in backend/src/modules/*/entities/.
    •	Use TypeORM migrations for schema updates.
    •	Store TypeORM DataSource in a singleton instance to prevent hot-reloading issues.
    •	Use query builder or repository pattern for complex queries.

## Styling (Tailwind CSS v4, Shadcn UI, Radix UI)

    •	Use Shadcn UI components as primary UI elements (@shadcn/ui).
    	-  ShadCN component CLI command: `npx shadcn@latest add [component_name]`.
    •	Use Radix UI for accessible, composable components like dialogs, tooltips, and dropdowns.
    •	Apply Tailwind CSS v4 for utility styling and keep styles within JSX (avoid separate CSS files).
    •	Prefer cn utility (lib/utils.ts) for class merging instead of template literals.
    •	Organize Tailwind classes using the cn() utility function.
    •	Use `@import 'tailwindcss';` syntax (v4), OKLCH colors, and `@theme inline` for theming.

## State Management (Zustand)

    •	Use Zustand for global client-side state (minimal useState).
    •	Prefer server-driven UI (fetch data in Server Components).
    •	Persist store state using localStorage or cookies if needed.

## Forms & Validation

    •	Use Zod for schema validation in both client and server.
    •	Use react-hook-form with Zod for form handling:

```
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

function SignInForm() {
  const { register, handleSubmit } = useForm({
    resolver: zodResolver(formSchema),
  });

  return (
    <form onSubmit={handleSubmit((data) => console.log(data))}>
      <input {...register("email")} placeholder="Email" />
      <input {...register("password")} type="password" placeholder="Password" />
      <button type="submit">Sign In</button>
    </form>
  );
}
```

API Routes (Traditional API with Next.js 14)
• Store all API routes in app/api/ using RESTful conventions.
• Use POST for creating, GET for reading, PATCH for updating, DELETE for removing.

Performance & Optimization
• Use TypeORM select/query builder to fetch only required fields.
• Optimize Next.js images with <Image /> (priority, lazy loading).
• Use caching (e.g., revalidatePath) for dynamic content.
• Use Redis caching for recommendation results (TTL 1h).

const HeavyComponent = dynamic(() => import('./HeavyComponent'), { ssr: false });

Security
• Protect routes using middleware.ts (e.g., require authentication for /dashboard, /admin).
• Use Zod for input validation in API routes.
• Sanitize user inputs to prevent SQL injection & XSS.

Deployment & DevOps
• Use Docker Compose for development and deployment.
• Deploy to Railway or VPS.
• Optimize next.config.js for better performance.
