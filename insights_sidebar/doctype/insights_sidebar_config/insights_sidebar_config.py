import frappe
from frappe.model.document import Document

CACHE_KEY = "insights_sidebar_configs"


class InsightsSidebarConfig(Document):

    def validate(self):
        """Ensure at least one role is specified."""
        if not self.roles:
            frappe.throw(
                frappe._("Please add at least one Role for this sidebar item."),
                title=frappe._("Role Required"),
            )

    def after_insert(self):
        _bust_cache()

    def on_update(self):
        _bust_cache()

    def on_trash(self):
        """
        Called just before the document is deleted.
        Bust the cache so the sidebar item is removed on next page load.
        We also publish a realtime event so already-open desks refresh.
        """
        _bust_cache()
        _notify_clients_remove(self.name)

    def after_delete(self):
        """Belt-and-suspenders: called after the DB row is gone."""
        _bust_cache()


# ── Helpers ──────────────────────────────────────────────────────────────────

def _bust_cache():
    """Invalidate the site-wide sidebar cache."""
    frappe.cache().delete_value(CACHE_KEY)


def _notify_clients_remove(config_name: str):
    """
    Push a realtime event to all connected clients so their JS can
    immediately remove/hide the sidebar item without a full reload.
    """
    frappe.publish_realtime(
        event="insights_sidebar_removed",
        message={"config_name": config_name},
        # Broadcast to every authenticated session on this site
        after_commit=True,
    )


# ── Whitelisted API used by the sidebar JS ────────────────────────────────────

@frappe.whitelist()
def get_sidebar_items_for_user():
    """
    Return sidebar items the current user is allowed to see.
    Results are cached per-site (not per-user) but filtered server-side
    on every call so role changes are honoured immediately.

    Cache stores the full list; filtering is cheap (in-memory list scan).
    """
    all_configs = _get_all_configs()
    user_roles = frappe.get_roles(frappe.session.user)

    visible = []
    for cfg in all_configs:
        allowed_roles = {r["role"] for r in cfg.get("roles", [])}
        if allowed_roles & set(user_roles):
            # Validate the user has 'read' permission on the linked dashboard too
            if frappe.has_permission("Insights Dashboard", doc=cfg["dashboard"], user=frappe.session.user):
                visible.append({
                    "label": cfg["label"],
                    "dashboard": cfg["dashboard"],
                    "route": f"insights-dashboard/{frappe.utils.scrub(cfg['label'])}",
                })

    return visible


def _get_all_configs():
    """
    Fetch all Insights Sidebar Config records from cache or DB.
    Stored as a list of plain dicts – serialisable and cheap.
    """
    cached = frappe.cache().get_value(CACHE_KEY)
    if cached:
        return cached

    configs = frappe.get_all(
        "Insights Sidebar Config",
        fields=["name", "label", "dashboard"],
    )

    # Hydrate roles for each config in bulk
    for cfg in configs:
        cfg["roles"] = frappe.get_all(
            "Insights Sidebar Config Role",
            filters={"parent": cfg["name"]},
            fields=["role"],
        )

    frappe.cache().set_value(CACHE_KEY, configs, expires_in_sec=3600)
    return configs
