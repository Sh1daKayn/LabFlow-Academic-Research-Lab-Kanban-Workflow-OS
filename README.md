# LabFlow

A simple web app for university research labs to track papers, grants, weekly tasks, and student handoffs across semesters.

*Language: **English** | [中文说明](README.zh.md)*

---

## Why we built it

In most labs, a single paper or grant passes through multiple students across Spring, Summer, and Fall semesters, shares survey data with other papers, and moves through advisor reviews and journal revisions. Software tools like Jira use terms made for software teams (like sprints and story points), and spreadsheets get hard to read once a lab has 10+ active projects.

LabFlow keeps daily lab work simple and easy to follow.

---

## Main features

### 1. Clean daily view (`Mine` vs. `Lab Public`)
- **Starts in `Simple View` and `Mine` mode:** When students log in with their account and 4+ character PIN, they only see their own tasks, weekly to-dos, and direct messages.
- **One click to see the whole lab:** Switch to `Lab Public` whenever you want to check what other lab members are working on.
- **12-step screen guide:** The first time someone logs in, a step-by-step guide highlights each area on the screen and explains how to use it. You can open it again anytime by clicking **Guided Tour**.
- **Top focus bar (`My Focus`):** Shows how many weekly to-dos, 1-on-1 requests, and blocked tasks you have right now. Click any pill to jump straight to it.

### 2. Three types of lab work & 6-stage board (`Tasks`)
Each project fits one of three groups:
- **Paper Track** (`PAPER`) — journal articles, conference papers, and target venues (such as *Nature Communications*, *PNAS*, *NeurIPS*, or *Management Science*), with clickable venue homepage badges and batch URL import.
- **Grant / Funded** (`VERTICAL_PROJECT`) — federal, state, or foundation grants (such as NSF, NIH, NSFC, or Horizon Europe).
- **Industry / Outreach** (`HORIZONTAL_PROJECT`) — partner projects and extension work, with fields for the partner organization and due dates.

Inside **Tasks**, move cards across six stages (all stage names can be edited in Settings):
1. **Ideation & Lit Review** (`IDEATION`)
2. **Data & Experiments** (`DATA_EXP`)
3. **Manuscript Drafting** (`DRAFTING`)
4. **Advisor Review** (`PI_REVIEW`)
5. **Submitted & R&R** (`REVISION`)
6. **Accepted & Archived** (`ACCEPTED`)

Every task and project supports **dynamic customizable Resource Links** (Overleaf, GitHub, Dataset, Zotero, Lab Notebook, Pre-registration, Qualtrics, IRB Protocol, HuggingFace, Slides, or custom labels) and a top **Shared Resources & Equipment** strip to reserve shared microscopes, compute servers, analytics enclaves, and seminar rooms.

You can switch between three layouts:
- **Columns:** Drag cards from one stage column to the next, or use the `←` and `→` arrows on each card.
- **By Category:** Groups tasks under Paper Track, Grant / Funded, and Industry / Outreach.
- **Stage Cells:** Shows projects that do not have task cards yet so newly added projects are easy to find.

Need to plan backward from a journal or grant deadline? Use **DDL Planner** to pick a due date, optionally paste or pick a saved venue URL, and auto-create milestones (`T-45`, `T-30`, `T-14`, `T-3`).

### 3. Multi-semester handoffs, `Semester Lineage` & `Outreach & Workshops` (`Projects`)
When a project moves from a Spring student to a Fall student, LabFlow keeps the history in one place:
- **Core Research Question:** Saves the main question the project is trying to answer.
- **Shared Dataset:** Tags common lab datasets or cohorts so you can see every project using the same data.
- **Cross-Term Handoff Timeline:** Lists who led the work in `Spring 2026`, `Summer 2026`, or `Fall 2026`, along with handoff notes.
- **Semester Lineage view:** Sorts columns automatically in academic calendar order (`Spring -> Summer -> Fall` + Year) and draws lines showing how a project continues across terms or splits into new papers. Click or hover over any card to highlight its connected projects.
- **Outreach & Workshops view:** Link any project to configurable translation tracks (e.g. *Seminar & Research Workshop*, *Industry / Clinical Partner*, *Teaching & Course Module*, *Policy Brief & Public Outreach*, *Open-Source / Patent Release*), track delivery readiness & dates, and filter **Tasks** by outreach track.

### 4. Weekly to-dos, advisor sign-off & member workload
- List what you plan to finish this week, link items to a project checklist, and write what "done" looks like.
- Advisors (or peers, if turned on) can leave a note and mark each item **Accepted** or **Needs Revision**.
- Advisors and leads can also assign weekly to-dos to several students at once in `Lab Public` mode.
- **Duplicate-name guard & workload bubbles:** Self-registration detects matching existing names so students can claim their account instead of creating duplicates; admins can merge historical duplicate profiles, and member/standup views show live active project, task, blocker, and pending-review counts.

### 5. Private 1-on-1 requests (`Requests`)
- Instead of posting everything in a group chat, send a **1-on-1 request** directly to one person (for example, asking your advisor to review a draft or asking a labmate about a regression model).
- Each request can be set to **Private** (default: only you and the other person see it) or **Public** (visible to the lab).
- Reply inside the card and mark it **Resolved** once finished.

### 6. Weekly lab meeting screen (`Meeting`)
- Open **Meeting** for a clean projector view in light or dark mode with no slide deck needed.
- Shows three columns side by side: **Completed Recently**, **Active & In Progress**, and **Critical Blockers**.
- Includes a meeting timer and lets you download or copy a Markdown summary.

### 7. Optional alerts (Teams, Slack, browser popups, email)
All notifications can be turned on or off depending on what your lab uses:
- **Microsoft Teams / Slack:** Post cards to a channel when someone flags a blocker, moves a task to `PI_REVIEW`, or posts a public request. Settings includes a step-by-step guide for setting up a Teams Incoming Webhook.
- **Browser popups:** Turn on desktop alerts under your account menu to get a popup in Windows or macOS when someone sends you a 1-on-1 request or assigns a weekly to-do (checks every 12 seconds while the tab is open).
- **Weekly & 48-hour email summary:** Call `/api/notifications/digest` on a schedule (via cron, GitHub Actions, or Vercel Cron) to email advisors and leads a summary before lab meetings or 48 hours before deadlines (using Resend or standard SMTP / Gmail via `nodemailer`).

### 8. Lab roles & permissions
No email verification server is needed to get started. Admins unlock extra settings with an admin password (default: `admin888`, which you can change):
- **Advisor / PI (`ADMIN_PI`):** Full access to all settings, member roles/merges, admin password, and data backups/resets.
- **Lab Manager / SysAdmin (`SYS_ADMIN`):** Student coordinator role that helps add members, manage venues/outreach tracks/stages/shared resources, and run data imports.
- **Project Lead (`PROJECT_LEAD`):** Manages tasks across projects they lead.
- **Lab Member / Student (`STUDENT_RA`):** Edits their own assigned tasks, posts requests, and checks off weekly to-dos.
- **Guest (`AUDITOR_GUEST`):** Read-only access to public lab items.

### 9. Appearance, themes & fonts
- Ships in crisp high-contrast **Light Mode** by default with full **Dark Mode** parity (`Obsidian`), selectable accent presets including **Obsidian & Gold**, Indigo, Blue, Emerald, Crimson, and custom hex color pickers.
- Pairs **12 English & 12 Chinese** academic fonts (Times New Roman, Georgia, Garamond, PingFang, Songti, Kaiti, LXGW WenKai, YouYuan, etc.) with custom local font entry.

---

## How to run it

### Run on your own computer

You need [Node.js](https://nodejs.org/) (18.17 or newer, 20 recommended) and [Git](https://git-scm.com/).

```bash
git clone https://github.com/Sh1daKayn/LabFlow-Academic-Research-Lab-Kanban-Workflow-OS.git
cd LabFlow-Academic-Research-Lab-Kanban-Workflow-OS
npm install
npm run dev
```

- **Windows shortcut:** Double-click [`Start-LabFlow.bat`](Start-LabFlow.bat) or run [`Start-LabFlow.ps1`](Start-LabFlow.ps1).
- Open **`http://localhost:3000`** in Chrome or Edge.
- **Starting your own lab workspace:** LabFlow boots directly with cross-disciplinary starter projects so you can test every feature right away. When ready for your real group, open **Settings -> Data & Backup -> Clean Slate** (or use **AI Smart Importer**) to initialize your own roster, venues, and projects.
- **Use as a desktop app:** In Chrome or Edge, click the **Install** icon in the address bar to pin LabFlow to your desktop or Start menu.

---

## Where your data is saved

If you do not set up a database, LabFlow saves everything directly on the computer running the app in **`.data/labflow-state.json`**.

| How your lab uses it | Best setup | Command |
| :--- | :--- | :--- |
| **On your own laptop** | Default local file storage | `npm run dev` |
| **Shared over office/lab Wi-Fi** | One always-on office PC/Mac | `npm run dev:lan` (or `npm run build && npm run start:lan`) |
| **On a lab server with Docker** | Docker + PostgreSQL 16 | `docker compose up -d --build` |
| **Cloud hosting (Vercel / Railway + Neon / Supabase)** | PostgreSQL database via `DATABASE_URL` | Set `DATABASE_URL` in `.env`, run `npx prisma db push`, then `npm run build && npm start` |

> [!NOTE]
> If you deploy to a serverless host like Vercel, you must connect a PostgreSQL database using `DATABASE_URL`, because `.data/labflow-state.json` cannot be saved on read-only serverless hosts.

### Optional settings (`.env`)

Copy [`.env.example`](.env.example) to `.env` if you want to connect PostgreSQL, change the default admin password, or turn on Teams/Slack/Email alerts:

```bash
cp .env.example .env
```

| Variable | What it does |
| :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string. Leave blank to save to `.data/labflow-state.json`. |
| `LABFLOW_DATA_DIR` | Custom folder path for local JSON storage (default: `./.data`). |
| `LABFLOW_DEFAULT_ADMIN_PASSWORD` | Starting PI admin password (default: `admin888`). |
| `LABFLOW_SESSION_SECRET` | Secret string used to sign admin session cookies. |
| `TEAMS_WEBHOOK_URL` | Microsoft Teams Incoming Webhook URL (can also be pasted in Settings UI). |
| `SLACK_WEBHOOK_URL` | Slack Incoming Webhook URL. |
| `LABFLOW_APP_URL` | Website link included inside notification cards (for example, `http://localhost:3000`). |
| `RESEND_API_KEY` / `SMTP_*` | Email settings for digests via Resend or SMTP (`SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `LABFLOW_MAIL_FROM`). |
| `CRON_SECRET` | Token to protect scheduled `GET /api/notifications/digest` calls. |

### Scheduled email digest endpoints

Preview what the email digest would send without actually sending emails:
```bash
curl "http://localhost:3000/api/notifications/digest?preview=1"
```

Trigger sending the digest from a cron job or GitHub Action:
```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  "https://your-labflow-domain/api/notifications/digest"
```

---

## Testing & updating

Run tests and build checks:

```bash
npm test            # Run Vitest unit & route tests
npx tsc --noEmit    # Check TypeScript types
npm run lint        # Run ESLint
npm run build       # Build for production
```

To update without losing data (do not delete `.data/` or `.env`):
- **Windows / macOS:** Run `git pull origin main` inside your LabFlow folder, then `npm install` and restart `npm run dev`.
- **Linux server:** Run `./update.sh`.
- **Docker:** Use [`docker-compose.ghcr.yml`](docker-compose.ghcr.yml) (built by [`.github/workflows/docker.yml`](.github/workflows/docker.yml)).
- **Push from Windows to Ubuntu:** Run [`deploy-ubuntu.ps1`](deploy-ubuntu.ps1).

---

## Import existing lab docs with ChatGPT / Claude

If your lab already has notes in Word, Google Docs, or PowerPoint, paste this prompt along with your notes into ChatGPT, Claude, or Gemini, then paste the JSON output into **+ New Task `▾` -> AI Smart Importer**:

````markdown
Read the attached lab roster, project notes, paper list, or meeting summary and convert the people, projects, tasks, and computers/equipment into JSON for LabFlow.

Rules:
1. Return ONLY one valid ```json code block and no extra text.
2. Fill in missing fields cleanly (short project tags, stages, priorities, and dates in YYYY-MM-DD format).
3. Use this exact format:

```json
{
  "members": [
    {
      "nameEn": "Dr. Alex Morgan",
      "role": "PI | POSTDOC | SENIOR_PHD | PHD_CANDIDATE | RA | VISITING_SCHOLAR",
      "accessRole": "ADMIN_PI | SYS_ADMIN | PROJECT_LEAD | STUDENT_RA | AUDITOR_GUEST",
      "titleEn": "Associate Professor",
      "email": "amorgan@university.edu"
    }
  ],
  "projects": [
    {
      "title": "Digital Servitization & Producer Subscription Dynamics",
      "workCategory": "PAPER | VERTICAL_PROJECT | HORIZONTAL_PROJECT",
      "targetVenue": "INFORMS Management Science / Nature Communications",
      "tag": "Mgt Sci",
      "abstract": "Short description of the project.",
      "leadAuthorName": "Daniel Vance"
    }
  ],
  "tasks": [
    {
      "title": "Finish robustness checks and Table 3 formatting",
      "description": "Verify clustered standard errors and clean up appendix notes.",
      "stage": "IDEATION | DATA_EXP | DRAFTING | PI_REVIEW | REVISION | ACCEPTED",
      "projectName": "Digital Servitization & Producer Subscription Dynamics",
      "leadAuthorName": "Daniel Vance",
      "priority": "LOW | MEDIUM | HIGH | URGENT",
      "visibility": "PUBLIC | TEAM_ONLY | PI_ONLY",
      "deadline": "2026-11-15",
      "progress": 65
    }
  ],
  "resources": [
    {
      "nameEn": "Shared Compute Server / Confocal Microscope",
      "type": "GPU | SERVER | CLUSTER | EQUIPMENT",
      "specs": "Room B204 · Shared Lab Booking / Multi-GPU Node"
    }
  ]
}
```

Valid `stage` values:
- IDEATION: Reading papers, planning, scoping
- DATA_EXP: Data cleaning, survey prep, running models
- DRAFTING: Writing the draft, charts, tables
- PI_REVIEW: Waiting on advisor feedback
- REVISION: Submitted or working on R&R
- ACCEPTED: Accepted or completed
````

---

## Tech stack

- [Next.js 14](https://nextjs.org/) (App Router, React 18) & [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [`@hello-pangea/dnd`](https://github.com/hello-pangea/dnd) for drag-and-drop cards
- [Prisma](https://www.prisma.io/) (optional PostgreSQL support) & local JSON storage (`.data/labflow-state.json`)
- [`nodemailer`](https://nodemailer.com/) for email digests + Microsoft Teams / Slack webhooks
- [Vitest](https://vitest.dev/) for tests

## License

[MIT](LICENSE)
