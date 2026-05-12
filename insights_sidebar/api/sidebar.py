"""
insights_sidebar.api.sidebar
============================
Server-side helpers consumed by the frontend boot & whitelisted API calls.
"""

import frappe


def get_bootinfo_sidebar_items(bootinfo):
    """
    Called via `extend_bootinfo` hook on every Desk boot.
    Attaches role-filtered sidebar items to the bootinfo dict so the
    JS layer can read them synchronously without an extra XHR.
    """
    from insights_sidebar.doctype.insights_sidebar_config.insights_sidebar_config import (
        get_sidebar_items_for_user,
    )

    # get_sidebar_items_for_user is a whitelisted fn but we call it directly here
    bootinfo.insights_sidebar_items = _get_items_for_user()


def _get_items_for_user():
    """
    Internal (non-whitelisted) version – no session check overhead.
    Returns a list of dicts: {label, dashboard, route}
    """
    from insights_sidebar.doctype.insights_sidebar_config.insights_sidebar_config import (
        _get_all_configs,
    )

    all_configs = _get_all_configs()
    user_roles = set(frappe.get_roles(frappe.session.user))

    visible = []
    for cfg in all_configs:
        allowed_roles = {r["role"] for r in cfg.get("roles", [])}
        if not allowed_roles & user_roles:
            continue
        # Server-side permission guard on the linked Insights Dashboard
        try:
            if not frappe.has_permission(
                "Insights Dashboard", doc=cfg["dashboard"], user=frappe.session.user
            ):
                continue
        except frappe.DoesNotExistError:
            # Dashboard was deleted – skip silently
            continue

        visible.append(
            {
                "label": cfg["label"],
                "dashboard": cfg["dashboard"],
                "route": f"insights-dashboard/{frappe.scrub(cfg['label'])}",
            }
        )

    return visible


@frappe.whitelist()
def get_sidebar_items():
    """
    Public whitelisted endpoint.
    Called by the JS layer after a realtime `insights_sidebar_removed` event
    to refresh the sidebar without a full page reload.
    """
    return _get_items_for_user()
