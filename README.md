# Job Hunt Tracker

A local web UI for tracking job applications. All data is stored in `tracker.csv` — no database, no cloud.

## Requirements

- [Node.js](https://nodejs.org/) (any recent version)

## Usage

```bash
node server.js
```

Then open **http://localhost:3737** in your browser. Keep the terminal open while using the tracker.

## Features

- Add, edit, and delete applications
- **Bulk add** multiple roles at the same company in one step
- Track the full application lifecycle (referral requested → applied → phone screen → technical → onsite → offer)
- Referral tracking (contact name + relationship)
- Sortable columns, search, and filters by status and work mode
- Pipeline stats at a glance
- Decision deadlines highlighted when ≤ 3 days away
- Job posting URLs linked directly from the role column

## Data

Everything is saved to `tracker.csv`. You can open it directly in Excel or Google Sheets at any time — the UI and the file stay in sync.

### Columns

| Column | Description |
|---|---|
| Company | Company name |
| Role | Job title |
| Job URL | Link to the job posting |
| Location | City or region |
| Work Mode | Remote / Hybrid / Onsite |
| Date Applied | Date you submitted the application |
| Referral Contact | Name of the person who referred you |
| Status | Current stage: Referral Requested, Applied, Phone Screen, Technical, Onsite, Offer, Rejected, Withdrawn, Ghosted |
| Date Phone Screen | Date of phone screen |
| Date Technical Screen | Date of technical interview |
| Date Onsite / Final Round | Date of onsite or final round |
| Date Offer | Date offer was received |
| Date Decision | Deadline to accept or decline |
| Offer Amount | Base salary or total comp |
| Decision | Accepted / Declined / Pending |
| Rejection Stage | Where in the funnel the rejection happened |
| Notes | Recruiter name, interview notes, follow-ups, etc. |
