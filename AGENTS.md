<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
- Auth: Cloud Auth email/password; role (student|teacher) set once at signup via metadata trigger into user_roles. Why: roles must never be user-editable.
- Classroom memberships are only created through the join_classroom DB function (called from a server function). Why: enforces valid code + student role server-side.
- App emails (invites, teacher notifications) go through the Resend connector in src/lib/email.server.ts; auth emails stay on Cloud Auth. Why: Cloud Auth emails can't be routed via Resend.
- Games use a games.index hub and dedicated sibling pages under /app/games, without a content parent layout. Why: game navigation must remain directly addressable without duplicating the shell.
- Physics mission completions use stable physics-playlab-* topic_progress identities and insert-on-conflict-do-nothing, feeding the existing derived XP rather than a second rewards store. Why: replay must not duplicate completion XP.
- AppShell owns the responsive sidebar and a single student floating tutor, using the existing askTutor integration. Why: prevent duplicate navigation and chat widgets.
