# Supabase Integration Plan for Glass Keep

This document outlines the next steps, architectural considerations, and migration strategy for integrating the Glass Keep project with Supabase as the backend platform.

---

## 1. **Why Supabase?**
- **Managed Postgres**: Reliable, scalable, and familiar database.
- **Auth**: Built-in user management, social logins, JWT-based sessions.
- **Realtime**: Subscriptions for notes, checklists, and collaboration.
- **Storage**: File/image uploads for note attachments and backgrounds.
- **Edge Functions**: Custom business logic, webhooks, and automation.

---

## 2. **Migration Overview**
- **Replace Express/SQLite API** with Supabase REST/RPC endpoints.
- **Replace custom Auth** with Supabase Auth (email/password, social, magic link).
- **Replace local image storage** with Supabase Storage buckets.
- **Replace SSE/Collaboration** with Supabase Realtime subscriptions.

---

## 3. **Step-by-Step Migration**

### 3.1. **Supabase Project Setup**
- Create a new Supabase project.
- Configure database tables for `users`, `notes`, `checklists`, `tags`, `collaborators`, `images`.
- Set up Storage buckets for images/backgrounds.
- Enable Realtime for notes/checklists tables.

### 3.2. **Auth Migration**
- Remove custom AuthContext logic.
- Integrate Supabase Auth client (`@supabase/supabase-js`).
- Update login/register flows to use Supabase Auth methods.
- Migrate user data (if needed) from SQLite to Supabase users table.
- Update session/token handling to use Supabase JWTs.

### 3.3. **Notes & Data Migration**
- Refactor NotesContext and hooks to use Supabase client for CRUD operations.
- Migrate existing notes/checklists/tags data to Supabase tables.
- Update queries to use Supabase's row-level security (RLS) for user isolation.
- Implement Realtime listeners for notes/checklists changes.

### 3.4. **Image & File Storage**
- Refactor image upload logic to use Supabase Storage.
- Update image URLs to use public bucket links.
- Migrate existing images/backgrounds to Supabase Storage.

### 3.5. **Collaboration & Realtime**
- Replace SSE/collaboration logic with Supabase Realtime subscriptions.
- Update UI to respond to realtime changes (notes, checklists, collaborators).
- Test multi-user collaboration and conflict resolution.

### 3.6. **API/Edge Functions (Optional)**
- For advanced business logic, implement Supabase Edge Functions.
- Use for webhooks, custom validation, or integrations.

---

## 4. **Frontend Refactoring**
- Install `@supabase/supabase-js` and configure client in the app.
- Refactor all API calls to use Supabase client methods.
- Update context providers and hooks to use Supabase for data/auth/storage.
- Remove Express server and SQLite dependencies.
- Update environment variables for Supabase URL and anon/public key.

---

## 5. **Testing & Rollout**
- Test all flows: login, register, note CRUD, checklist, tags, images, collaboration.
- Validate security: RLS, auth, file access.
- Migrate production data and images.
- Update documentation and onboarding guides.

---

## 6. **Risks & Considerations**
- **Data Migration**: Plan for one-time migration scripts for users/notes/images.
- **Auth**: Supabase uses JWT; update all session logic.
- **Realtime**: Test for edge cases in multi-user collaboration.
- **Storage**: Validate image upload limits and access rules.
- **Cost**: Supabase free tier is generous, but monitor usage for scale.

---

## 7. **References & Resources**
- [Supabase Docs](https://supabase.com/docs)
- [@supabase/supabase-js](https://github.com/supabase/supabase-js)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Realtime](https://supabase.com/docs/guides/realtime)
- [Storage](https://supabase.com/docs/guides/storage)
- [Edge Functions](https://supabase.com/docs/guides/functions)

---

## 8. **Next Steps Checklist**
- [ ] Create Supabase project and configure tables/storage
- [ ] Integrate Supabase Auth in frontend
- [ ] Refactor NotesContext/hooks for Supabase CRUD
- [ ] Migrate data and images
- [ ] Implement Realtime subscriptions
- [ ] Remove legacy Express/SQLite code
- [ ] Test and document new flows

---

**This plan provides a clear migration path to modernize Glass Keep with Supabase, enabling scalable auth, realtime collaboration, and cloud storage.**
