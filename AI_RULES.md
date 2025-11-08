# AI Development Rules for OnlyFocus

## Tech Stack Overview

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: React Query (TanStack Query) for server state, React hooks for local state
- **Routing**: React Router v6
- **UI Components**: shadcn/ui library with Radix UI primitives
- **Backend**: Supabase (PostgreSQL database, authentication, real-time subscriptions)
- **Real-time Communication**: Supabase Realtime + WebRTC for video
- **Notifications**: Sonner for toast notifications

## Library Usage Rules

### Database Operations
- **Always use**: `@/integrations/supabase/client` for all Supabase operations
- **Never use**: Direct Supabase imports or other database libraries
- **Required**: Properly type all database queries using generated types

### UI Components
- **Primary choice**: shadcn/ui components for all UI elements
- **Custom components**: Create in `src/components/` with Tailwind styling
- **Icons**: Use `lucide-react` exclusively for icons
- **Forms**: Use `react-hook-form` with `zod` validation

### State Management
- **Server state**: Use `@tanstack/react-query` for all data fetching
- **Local state**: Use React `useState` and `useReducer` hooks
- **Global state**: Only for authentication/user context, use React Context

### Real-time Features
- **Chat/Presence**: Use Supabase Realtime subscriptions
- **Video/Audio**: Use WebRTC with Supabase for signaling
- **Notifications**: Use Sonner for all toast messages

### Routing and Navigation
- **Routing library**: React Router v6
- **Route protection**: Handle in components with localStorage checks
- **Navigation**: Use `useNavigate` hook exclusively

### Styling and Animations
- **Styling**: Tailwind CSS classes only
- **Animations**: Use Tailwind's built-in animations or CSS keyframes
- **Responsive design**: Mobile-first approach with Tailwind breakpoints

### Error Handling
- **Notifications**: Use Sonner toast notifications for user-facing messages
- **Error boundaries**: Implement at page level for unhandled errors
- **Logging**: Use `console.error` for debugging, but handle user errors gracefully

### Data Validation
- **Form validation**: Zod schemas with react-hook-form
- **API response validation**: TypeScript types and runtime checks where needed
- **Environment variables**: Use Vite's `import.meta.env` with proper typing

## Code Quality Standards

### File Structure
- **Pages**: `src/pages/` directory with PascalCase naming
- **Components**: `src/components/` directory with clear, descriptive names
- **Utilities**: `src/utils/` for helper functions
- **Hooks**: `src/hooks/` for custom React hooks
- **Types**: Inline for simple cases, separate files for complex types

### Naming Conventions
- **Components**: PascalCase (`UserProfile.tsx`)
- **Functions**: camelCase (`getUserData()`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRY_ATTEMPTS`)
- **Variables**: camelCase (`userData`)
- **Files**: PascalCase for components, camelCase for utilities

### TypeScript Guidelines
- **Strict typing**: Enable all strict TypeScript options
- **No implicit any**: Always specify types for function parameters and return values
- **Type definitions**: Prefer interfaces over types for object shapes
- **Generic types**: Use appropriately for reusable components and hooks