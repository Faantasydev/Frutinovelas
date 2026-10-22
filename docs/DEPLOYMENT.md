# Secure Vercel and GitHub Actions setup

The browser talks only to same-origin `/api` functions. The GitHub token and Redis credentials must be stored as **Vercel server environment variables** for Production and Preview as needed. Do not prefix these names with `VITE_`, put them in HTML, or add them to GitHub Actions secrets.

Configure these variables in the Vercel project settings:

| Variable | Purpose |
| --- | --- |
| `STUDIO_PASSWORD` | Password for the private studio; use at least 16 random characters. |
| `SESSION_SECRET` | HMAC signing key for secure, HTTP-only session cookies; use at least 32 random bytes. |
| `GITHUB_ACTIONS_TOKEN` | Fine-grained GitHub token restricted to `Faantasydev/Frutinovelas`, with Actions read and write access. It dispatches workflows and reads run/artifact status. |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL used for persistent limits across serverless instances. |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST token. |
| `FRUTINOVELAS_GITHUB_REF` | Optional workflow branch; defaults to `work`. |

Use the free Upstash Redis tier if it meets the account's current limits. The API fails closed when Redis, session, password, or GitHub configuration is missing. Vercel secrets are required before users can sign in or render.

## Workflow

The browser submits a validated script to `POST /api/jobs`. A same-origin, HTTP-only signed session cookie is required. The server applies Upstash limits (10 login attempts per IP per 15 minutes, 5 renders per session and 15 per IP per hour, 10 status reads per minute, and 10 video requests per minute), caps each script at 60 seconds and 20 scenes, and allows no more than two active renders per session. It dispatches `.github/workflows/render.yml` using the server-only GitHub token.

Each login gets a random session identifier; each render gets a UUID. The workflow title and artifact name contain both identifiers, and status/video endpoints only return jobs associated with the current session. Videos are proxied from GitHub Actions artifacts through the authenticated Vercel function, including byte-range support for playback. Sessions expire after eight hours. Logging out ends access to those session's jobs. GitHub artifact access outside this app still follows the repository's own visibility and permissions; keep the repository private if workflow artifacts must not be accessible to repository readers.

The workflow installs dependencies, checks/tests/builds the app, validates the submitted JSON again, renders the submitted props with Remotion, checks MP4 metadata and decode, and stores a per-job Actions artifact. Artifacts follow the repository's GitHub retention policy.

## Deploy and verify

Push the branch containing the workflow to GitHub; a push runs the verification workflow. Set the Vercel environment variables above and redeploy the Vercel project. Sign in, edit the scenes, click **Generar video**, then play/download the completed MP4 from **Tus videos**.

The current onboarding container cannot inspect Actions runs through the GitHub API (the network request is blocked with `403`). After configuring the Vercel token, verify the run in the repository's **Actions** page. Never paste the token into chat or the frontend.
