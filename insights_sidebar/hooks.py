from . import __version__ as app_version

app_name = "insights_sidebar"
app_title = "Insights Sidebar"
app_publisher = "Your Name"
app_description = "Dynamically inject Insights Dashboards into the Frappe sidebar based on user roles"
app_email = "your@email.com"
app_license = "MIT"

app_include_css = ["/assets/insights_sidebar/css/insights_sidebar.css"]
app_include_js = ["/assets/insights_sidebar/js/insights_sidebar_boot.js"]

extend_bootinfo = "insights_sidebar.api.sidebar.get_bootinfo_sidebar_items"