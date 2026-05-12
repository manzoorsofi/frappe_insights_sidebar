import frappe
from frappe.model.document import Document

CACHE_KEY = "insights_sidebar_configs"


class InsightsSidebarConfig(Document):

    def validate(self):
        if not self.roles:
            frappe.throw(
                frappe._("Please add at least one Role."),
                title=frappe._("Role Required"),
            )

    def after_insert(self):
        _bust_cache()

    def on_update(self):
        _bust_cache()

    def on_trash(self):
        _bust_cache()
        frappe.publish_realtime(
            event="insights_sidebar_removed",
            message={"config_name": self.name},
            after_commit=True,
        )

    def after_delete(self):
        _bust_cache()


def _bust_cache():
    frappe.cache().delete_value(CACHE_KEY)


def _get_all_configs():
    cached = frappe.cache().get_value(CACHE_KEY)
    if cached:
        return cached

    configs = frappe.get_all(
        "Insights Sidebar Config",
        fields=["name", "label", "dashboard"],
    )

    for cfg in configs:
        cfg["roles"] = frappe.get_all(
            "Insights Sidebar Config Role",
            filters={"parent": cfg["name"]},
            fields=["role"],
        )

    frappe.cache().set_value(CACHE_KEY, configs, expires_in_sec=3600)
    return configs