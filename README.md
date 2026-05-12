# Insights Sidebar — Frappe Custom App

A Frappe v15 custom app that dynamically injects **Insights Dashboard** links
into the Frappe Desk sidebar, filtered by user role, rendered in-place via an
`<iframe>` — no new tab, no full page reload.


## Demo

https://github.com/manzoorsofi/frappe_insights_sidebar/raw/main/insights_sidebar/public/assests/frappe_insights_sidebar.mp4

---

## Features

| Feature | Detail |
|---|---|
| **Role-based visibility** | Each sidebar item is shown only to users who hold at least one configured role |
| **In-place viewer** | Dashboards open inside an `<iframe>` within the Desk; the sidebar stays visible |
| **No hardcoding** | Dashboard IDs and role names are configured through a DocType — not in code |
| **Cached** | Sidebar config is cached for 1 hour; cache is busted on any create/update/delete |
| **Realtime cleanup** | Deleting a config record immediately removes the sidebar item for all connected users via Frappe Realtime |
| **Security** | `frappe.has_permission` is checked server-side before the iframe URL is served |

---

## Prerequisites

- Frappe Framework **v15**
- **Frappe Insights** app installed (`frappe/insights`) — the app that provides the `Insights Dashboard` DocType and the `/insights/dashboard/<name>` URL

---

## Installation

```bash
# 1. Navigate to your bench directory
cd ~/frappe-bench

# 2. Get the app
bench get-app /path/to/insights_sidebar
# OR after pushing to GitHub:
# bench get-app https://github.com/manzoorsofi/insights_sidebar

# 3. Install on your site
bench --site your-site.local install-app insights_sidebar

# 4. Run migrations
bench --site your-site.local migrate

# 5. Build assets
bench build --app insights_sidebar

# 6. Restart
bench restart
```

---

## Configuring a New Sidebar Link

1. Log in as **System Manager**.
2. Go to **Search → Insights Sidebar Config** (or navigate to
   `your-site.local/app/insights-sidebar-config`).
3. Click **New**.
4. Fill in:
   - **Label** — the text shown in the sidebar (e.g. `Sales Overview`)
   - **Dashboard** — link to an existing *Insights Dashboard* document
   - **Roles** — add one or more roles (e.g. `Sales User`, `Sales Manager`)
5. **Save**.

The sidebar will reflect the new item on the next page load (or immediately
for users who are already on the Desk if you refresh).

---

## Verifying Role-Based Visibility

1. Create a config with Role = `Sales User`.
2. Log in as a user **with** the `Sales User` role → the item appears in the sidebar.
3. Log in as a user **without** the role → the item is absent.
4. The server re-validates permissions before rendering the iframe, so
   direct URL access is also blocked.

---

## How Deletion Works

1. Open the **Insights Sidebar Config** record.
2. **Menu → Delete**.
3. The `on_trash` controller:
   - Busts the server-side cache.
   - Fires a Frappe Realtime event (`insights_sidebar_removed`).
4. All connected Desk sessions receive the event and **immediately fade out**
   the sidebar item — no reload required.

---

## Architecture Overview

```
hooks.py
  ├── app_include_js  →  public/js/insights_sidebar_boot.js   (sidebar injection)
  ├── app_include_css →  public/css/insights_sidebar.css      (native styling)
  ├── extend_bootinfo →  api/sidebar.get_bootinfo_sidebar_items (attach items to boot)
  └── doc_events      →  doctype/.../insights_sidebar_config.py (cache + realtime)

DocTypes
  ├── Insights Sidebar Config        (parent — Label, Dashboard, Roles table)
  └── Insights Sidebar Config Role   (child — Role link field)

Page
  └── insights-dashboard-viewer      (iframe renderer, registered at /app/insights-dashboard-viewer)
```

---

## Customising the Dashboard URL

By default the iframe loads:

```
/insights/dashboard/<dashboard-name>
```

If your Insights installation uses a different URL scheme, edit the
`dashboardUrl` variable in:

```
insights_sidebar/page/insights_dashboard_viewer/insights_dashboard_viewer.js
```

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| Sidebar items not showing | Run `bench build --app insights_sidebar` and hard-refresh the browser |
| Items showing for wrong roles | Clear Redis cache: `bench --site your-site.local clear-cache` |
| iframe shows 403 | Ensure the Insights Dashboard is shared with (or readable by) the user's role |

