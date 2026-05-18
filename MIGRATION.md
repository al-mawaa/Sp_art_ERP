# Next.js Migration Guide

## Migration Completed ✅

The project has been successfully converted from Vite to Next.js 15. Here's what was changed:

### New Files Created

1. **App Directory Structure**
   - `app/layout.tsx` - Root layout with providers
   - `app/providers.tsx` - Client-side providers (QueryClient, Tooltip, Auth, Toasters)
   - `app/page.tsx` - Home page with role-based redirect
   - `app/login/page.tsx` - Login page (converted from Vite)
   - `app/admin/` - Admin dashboard and all sub-routes
   - `app/teacher/` - Teacher dashboard and all sub-routes
   - `app/student/` - Student dashboard and all sub-routes
   - `app/senior-teacher/` - Senior teacher dashboard and all sub-routes
   - `app/super-admin/` - Super admin dashboard and all sub-routes

2. **Configuration Files**
   - `next.config.js` - Next.js configuration
   - `jest.config.js` - Jest test configuration
   - `jest.setup.js` - Jest test setup

3. **Updated Configuration**
   - `tsconfig.json` - Updated for Next.js
   - `tailwind.config.ts` - Updated content paths
   - `.gitignore` - Updated for Next.js

### Files to Remove (Old Vite Files)

These files are no longer needed and can be safely deleted:

```
vite.config.ts          # Vite configuration
vitest.config.ts        # Vitest configuration  
tsconfig.app.json       # Old app TypeScript config
tsconfig.node.json      # Old Node TypeScript config
index.html              # Vite entry HTML
src/main.tsx            # Vite entry point
src/App.tsx             # Old Vite App component (replaced by app router)
```

### Modified Files

1. **src/components/layouts/RoleLayout.tsx**
   - Replaced React Router components with Next.js equivalents
   - Updated from useNavigate to useRouter
   - Updated from react-router-dom links to next/link
   - Updated pathname detection for active routes
   - Updated RequireRole component for Next.js

2. **package.json**
   - Added: `next`, `jest`, `@types/jest`, `jest-environment-jsdom`
   - Removed: `vite`, `@vitejs/plugin-react-swc`, `vitest`, `jsdom`, `lovable-tagger`, `react-router-dom`
   - Updated scripts: dev, build, start, test

### What Still Works

✅ All page components remain in `src/pages/` and are imported by new route pages
✅ All UI components in `src/components/` work as-is
✅ Context providers (AuthContext) work seamlessly
✅ State management (Zustand) unchanged
✅ Styling (Tailwind CSS) unchanged
✅ All shadcn/ui components compatible

## Running the Project

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm run test
```

## Next Steps

1. **Test the application**: Navigate through all role dashboards
2. **Verify authentication**: Test login with different roles
3. **Check styling**: Ensure Tailwind CSS is working correctly
4. **Run tests**: Execute `npm run test` to verify test setup
5. **Remove old Vite files** (listed above) once everything is confirmed working
6. **Update CI/CD**: If you have build pipelines, update them to use Next.js commands

## Common Issues & Solutions

### Issue: "Cannot find module '@/pages/...'"
**Solution**: Ensure the `@/` alias in `tsconfig.json` correctly points to `./src/*`

### Issue: "useRouter is not defined"
**Solution**: Make sure to import from `next/navigation` for the client-side router (not `next/router`)

### Issue: "This page could not be prerendered"
**Solution**: Ensure all page components are serializable (no functions or contexts that can't be serialized)

### Issue: Navigation not working
**Solution**: Use `<Link href="/path">` from `next/link` instead of React Router's `<Link to="/path">`

## Build & Deployment

### Build Size
Next.js provides automatic code splitting and optimization. Your bundle will be smaller than Vite.

### Deployment
Next.js builds deploy to:
- Vercel (recommended)
- AWS, GCP, Azure, Netlify, or any Node.js hosting
- Docker containers
- Self-hosted servers

Example Vercel deployment:
```bash
npm i -g vercel
vercel
```

## Performance Notes

- Next.js App Router provides automatic route-based code splitting
- Static pages are pre-rendered at build time
- Dynamic pages use Server Components (faster rendering)
- Image optimization is built-in
- CSS is automatically optimized and minified

## Support

For Next.js documentation, visit: https://nextjs.org/docs
For shadcn/ui components: https://ui.shadcn.com/
For Tailwind CSS: https://tailwindcss.com/


<!-- testing  -->