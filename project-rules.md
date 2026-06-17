# Project Rules & Code Style
**Author:** Tanveer (Truqorun)  
**Version:** 1.0.0  
**Applies to:** All Next.js projects

This file defines coding standards, architectural decisions, and workflow rules for all projects. Follow these rules strictly unless explicitly instructed otherwise for a specific project.

---

## 1. Packages & APIs

- Always use the **latest stable version** of every package. No outdated packages, deprecated APIs, or legacy patterns.
- Before installing any package, verify the current version on npm.
- Use **Context7 MCP** to fetch up-to-date, version-specific documentation before implementing anything library-related.
- If a package or API has changed since your training data, fetch current docs — do not assume.

---

## 2. Modularisation & File Length

- Every file must stay **under 400 lines**. If a file exceeds this, split it into logical modules immediately.
- One responsibility per file — components, hooks, stores, utilities and types each live in their own files.
- Never put business logic inside a component file. Extract to hooks or utilities.
- If a module is getting large, ask whether it should be split before proceeding.

---

## 3. TypeScript

- **Strict mode always.** `tsconfig.json` must have `"strict": true` — non-negotiable.
- No `any` types. Use `unknown` with type narrowing if the type is genuinely unknown.
- All props, function parameters, return types, and state must be explicitly typed.
- Use `type` for object shapes and unions. Use `interface` only when extending is needed.
- Keep all types in the `types/` directory, colocated by domain (e.g. `types/auth.ts`, `types/product.ts`).

---

## 4. Project Structure

Follow Next.js App Router standard structure with type-first organisation:

```
app/                        # Next.js App Router — routes only
  (auth)/                   # Route groups as needed
  layout.tsx
  page.tsx
components/
  layout/                   # Navbar, Footer, Sidebar, PageWrapper
  ui/                       # shadcn generated components (do not edit directly)
  [feature]/                # Feature-specific components (e.g. components/dashboard/)
hooks/                      # Custom React hooks — one hook per file
lib/                        # Utilities, helpers, API clients, constants
  utils.ts                  # shadcn utils (cn function)
store/                      # Zustand stores — one file per feature domain
  useAuthStore.ts
  useCartStore.ts
types/                      # TypeScript types and interfaces — one file per domain
public/                     # Static assets
styles/
  globals.css               # Global CSS — Tailwind base + custom global styles
```

---

## 5. Import Aliases

- Always use `@/` path aliases. Never use relative imports like `../../components`.
- Correct: `import { Button } from '@/components/layout/Button'`
- Wrong: `import { Button } from '../../../components/layout/Button'`
- Ensure `tsconfig.json` has `"paths": { "@/*": ["./*"] }` configured.

---

## 6. Styling — Tailwind + CSS

- **Tailwind CSS** is the default for all styling. Use utility classes directly in JSX.
- **CSS Modules** and **global CSS** are also available and expected — use them whenever Tailwind alone becomes verbose, repetitive, or insufficient for complex animations, pseudo-elements, or scalable component styles.
- There is no rule about which to use where — use the right tool for the job.
- **Never use inline `style={{}}` props** unless absolutely necessary (e.g. dynamic values that can't be expressed in Tailwind).
- Tailwind config must be extended with the project's brand colors, typography, and spacing before any UI work begins.

---

## 7. Asking Before Assuming

- **Never assume design values.** If a project has no brand colors defined, do not generate random colors. Ask the user first. If the user has no preference, then generate a suggestion and confirm before applying.
- **Ask once per technical decision.** If the user confirms a technical approach (e.g. using Zustand, a specific auth strategy, a folder pattern), do not ask again for the same decision in that project. Apply consistently.
- **Ask before major structural decisions** — e.g. "Should I use a sidebar or top navigation for this project?"
- When in doubt about scope, ask. A short clarifying question is always better than a wrong assumption.

---

## 8. State Management — Zustand

- **Ask once per project** whether Zustand should be used. Once confirmed, use it without asking again.
- One store per feature domain. Never one large global store.
  - `store/useAuthStore.ts` — authentication state
  - `store/useUIStore.ts` — UI state (modals, sidebars, toasts)
  - `store/use[Feature]Store.ts` — feature-specific state
- Keep store files under 400 lines. Split by slices if needed.
- Use `immer` middleware for complex nested state updates.
- Persist only what is necessary using `persist` middleware.

```typescript
// store/useAuthStore.ts — example structure
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthStore } from '@/types/auth'

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      setUser: (user) => set({ user }),
      clearUser: () => set({ user: null }),
    }),
    { name: 'auth-store' }
  )
)
```

---

## 9. Forms

- **Simple forms** (login, contact, search, newsletter): use `useRef` for uncontrolled inputs. No `useState` per field.
- **Complex forms** (multi-step, conditional fields, dynamic validation): use `react-hook-form` with `zod` for schema validation.
- Never mix controlled and uncontrolled inputs in the same form.
- Always validate on the client before any API call. Always validate on the server too.

```typescript
// Simple form — useRef pattern
const emailRef = useRef<HTMLInputElement>(null)
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault()
  const email = emailRef.current?.value
}

// Complex form — react-hook-form + zod pattern
const schema = z.object({ email: z.string().email() })
const { register, handleSubmit } = useForm<z.infer<typeof schema>>({
  resolver: zodResolver(schema)
})
```

---

## 10. Error Handling

- **Always use try-catch** for async operations, API calls, and anything that can throw.
- Never let errors fail silently. Always log or surface the error meaningfully.
- Use **`error.tsx`** (Next.js App Router) for route-level error boundaries — one per route segment that needs it.
- Use **React Error Boundary components** (`error-boundary.tsx`) to wrap complex, data-dependent, or third-party components so one failure doesn't crash the page.
- Provide user-friendly fallback UI in every error boundary — never show raw error messages to the user.

```typescript
// Async error handling pattern
const fetchData = async () => {
  try {
    const response = await fetch('/api/data')
    if (!response.ok) throw new Error(`HTTP error: ${response.status}`)
    return await response.json()
  } catch (error) {
    // Log for debugging
    console.error('[fetchData]', error)
    // Surface to user via toast or error state
    throw error
  }
}
```

---

## 11. Required Components Per Project

Every project must have these base components before any feature work begins. All built with shadcn + Tailwind, stored in `components/layout/`.

### Navigation
- Ask the user first: **"Should this project use a top navbar or sidebar navigation?"**
- Build the confirmed variant — do not build both.
- Must include: logo/brand, nav links, mobile responsive behaviour, active link state, auth state (logged in/out UI if applicable).

### Footer
- Brand name, relevant links, copyright.
- Responsive layout.

### Button
Bootstrap-inspired variants, built on top of shadcn Button:

| Variant | Description |
|---------|-------------|
| `primary` | Main CTA — brand color filled |
| `secondary` | Secondary action — muted filled |
| `success` | Confirm/save actions — green |
| `danger` | Destructive actions — red |
| `warning` | Caution actions — amber |
| `info` | Informational — blue |
| `ghost` | No background, hover only |
| `link` | Looks like a text link |

Each variant also has an `outline` version (transparent background, colored border + text).

Additional props: `size` (sm, md, lg), `loading` (shows spinner, disables button), `fullWidth`, `leftIcon`, `rightIcon`.

```typescript
// components/layout/Button.tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'ghost' | 'link'
  outline?: boolean
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  fullWidth?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}
```

---

## 12. Component Quality of Life (QoL)

When building any data-display or interactive component, implement all expected QoL features upfront — do not build a bare minimum version that needs to be extended immediately.

| Component | Expected QoL additions |
|-----------|----------------------|
| Table | Pagination, search, column filters, click-to-sort, row selection, empty state, loading skeleton |
| List | Search, filter, empty state, loading skeleton |
| Form | Inline validation, loading state on submit, success/error feedback, disabled state during submission |
| Modal/Dialog | Close on backdrop click, close on Escape key, focus trap, loading state |
| Dropdown/Select | Search/filter within options if >10 items, clear selection, loading state |
| Image | Loading skeleton, error fallback, lazy loading |
| Card | Loading skeleton variant |
| Input | Clear button if applicable, character count if applicable, show/hide for password |

If additional QoL features are planned but not immediately scoped, add a `// TODO:` comment noting what's missing.

---

## 13. Code Comments & Cleanliness

- Comment **complex logic, non-obvious decisions, and custom hooks** — not obvious code.
- Use JSDoc for exported functions and hooks:
```typescript
/**
 * Fetches paginated product list with optional filters.
 * @param page - Current page number (1-indexed)
 * @param filters - Optional filter object
 * @returns Paginated product response
 */
```
- Remove all `console.log` debug statements before considering any task complete.
- No commented-out dead code — delete it. Version control exists for a reason.
- No TODO comments left unresolved across more than one session unless explicitly noted as deferred.

---

## 14. Build & Error Discipline

- After every **medium to major change** (new feature, refactor, new dependency, structural change): run `npm run build` and fix all errors before moving on.
- TypeScript errors are not warnings — they are blockers. Fix them immediately.
- ESLint errors are blockers. Warnings are addressed before task completion.
- Never ship a PR or consider a task done with a failing build.

---

## 15. Custom Hooks

- Every reusable piece of stateful logic must be extracted into a custom hook in `hooks/`.
- Hook files are named `use[Name].ts` — e.g. `useDebounce.ts`, `useLocalStorage.ts`.
- Each hook file contains exactly one hook.
- Hooks must return typed objects, not arrays (except for simple two-value returns like `useState`).

```typescript
// Good — named return
const { data, isLoading, error, refetch } = useProducts()

// Acceptable for simple cases
const [isOpen, setIsOpen] = useState(false)
```

---

## 16. API & Data Fetching

- Use **Next.js Server Actions** or **Route Handlers** (`app/api/`) for all data mutations.
- For client-side data fetching, use **SWR** or **TanStack Query** — not bare `useEffect` + `fetch`.
- Never expose API keys or secrets in client components. Server-only logic stays in Server Components or Route Handlers.
- Always handle loading, error, and empty states for every data fetch — never assume success.

---

## Checklist — New Project Setup

Before writing any feature code, confirm all of the following:

- [ ] `create-next-app` with TypeScript, Tailwind, App Router, `@/` alias
- [ ] `tsconfig.json` — strict mode confirmed
- [ ] shadcn initialised (`npx shadcn@latest init`)
- [ ] Brand colors confirmed with user and added to `tailwind.config.ts`
- [ ] Navigation style confirmed with user (top or sidebar)
- [ ] Zustand preference confirmed with user
- [ ] Base components built: Navbar/Sidebar, Footer, Button
- [ ] Folder structure matches Section 4
- [ ] MCP servers active: Context7, Next.js DevTools, Firebase (if applicable), shadcn, Vercel (if applicable), web search
- [ ] `.env.local` created with all required environment variables
- [ ] First `npm run build` passes clean
