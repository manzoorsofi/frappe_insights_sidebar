import frappe


def get_bootinfo_sidebar_items(bootinfo):
    bootinfo.insights_sidebar_items = _get_items_for_user()


def _get_items_for_user():
    from insights_sidebar.doctype.insights_sidebar_config.insights_sidebar_config import (
        _get_all_configs,
    )
    all_configs = _get_all_configs()
    user_roles = set(frappe.get_roles(frappe.session.user))

    visible = []
    for cfg in all_configs:
        allowed_roles = {r["role"] for r in cfg.get("roles", [])}
        if allowed_roles & user_roles:
            visible.append({
                "label": cfg["label"],
                "dashboard": cfg["dashboard"],
                "route": f"insights-dashboard/{frappe.scrub(cfg['label'])}",
            })
    return visible


@frappe.whitelist()
def get_sidebar_items():
    return _get_items_for_user()