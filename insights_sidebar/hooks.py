from . import __version__ as app_version

app_name = "insights_sidebar"
app_title = "Insights Sidebar"
app_publisher = "Your Name"
app_description = "Dynamically inject Insights Dashboards into the Frappe sidebar based on user roles"
app_email = "your@email.com"
app_license = "MIT"
app_version = app_version

# ─── DocTypes ────────────────────────────────────────────────────────────────
# No extra fixtures needed; DocTypes are installed via JSON

# ─── Website ─────────────────────────────────────────────────────────────────
app_include_css = ["/assets/insights_sidebar/css/insights_sidebar.css"]
app_include_js = ["/assets/insights_sidebar/js/insights_sidebar_boot.js"]

# ─── Desk (web app) includes ──────────────────────────────────────────────────
# These load on every Desk page
# app_include_css already covers desk too when listed above

# ─── Boot Session ────────────────────────────────────────────────────────────
# Extend the boot session so the sidebar JS can read config without an XHR
extend_bootinfo = "insights_sidebar.api.sidebar.get_bootinfo_sidebar_items"

# ─── Doc Events ──────────────────────────────────────────────────────────────
doc_events = {
    "Insights Sidebar Config": {
        "on_trash": "insights_sidebar.doctype.insights_sidebar_config.insights_sidebar_config.on_trash",
        "after_delete": "insights_sidebar.doctype.insights_sidebar_config.insights_sidebar_config.after_delete",
        "on_update": "insights_sidebar.doctype.insights_sidebar_config.insights_sidebar_config.on_update",
        "after_insert": "insights_sidebar.doctype.insights_sidebar_config.insights_sidebar_config.after_insert",
    }
}

# ─── Permissions ─────────────────────────────────────────────────────────────
# Standard Frappe permission checks apply; no override needed

# ─── Jinja ───────────────────────────────────────────────────────────────────
jinja = {
    "methods": [],
    "filters": [],
}
