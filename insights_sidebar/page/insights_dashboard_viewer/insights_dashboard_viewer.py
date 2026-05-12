import frappe


def get_context(context):
    """
    Called when the page is rendered server-side.
    Not strictly needed for a JS-driven page but good practice.
    """
    context.no_cache = 1
