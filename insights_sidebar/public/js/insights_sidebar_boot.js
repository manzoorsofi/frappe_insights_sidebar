/**
 * insights_sidebar/public/js/insights_sidebar_boot.js
 *
 * Loaded on every Frappe Desk page via the `app_include_js` hook.
 *
 * Responsibilities:
 *  1. Read the sidebar items injected into bootinfo by the Python hook.
 *  2. Inject them into the Frappe sidebar after the Desk has rendered.
 *  3. Handle "active" highlighting when navigating to a dashboard route.
 *  4. Listen for realtime `insights_sidebar_removed` events and remove
 *     stale sidebar items without requiring a full page reload.
 *  5. Register a custom Frappe router for the `insights-dashboard/*` pattern.
 */

(function () {
    "use strict";

    // ── Constants ──────────────────────────────────────────────────────────────
    const SIDEBAR_GROUP_LABEL = __("Insights Dashboards");
    const ROUTE_PREFIX = "insights-dashboard";
    const PAGE_NAME = "insights-dashboard-viewer";
    const ITEM_CLASS = "insights-sidebar-item";

    // ── 1. Wait for Frappe Desk to finish booting ─────────────────────────────
    $(document).on("startup", function () {
        _register_router();
        _inject_sidebar_items();
        _register_realtime_listener();
    });

    // ── 2. Re-highlight the active item on every route change ─────────────────
    $(document).on("page-change", function () {
        _update_active_state();
    });

    // ── Router ────────────────────────────────────────────────────────────────
    /**
     * Register a Frappe router so that URLs like
     *   /app/insights-dashboard/my-dashboard
     * are handled by our viewer page without a full browser reload.
     */
    function _register_router() {
        frappe.router.on(ROUTE_PREFIX + "/:label", function (label) {
            frappe.route_options = { dashboard: label };
            frappe.set_route(PAGE_NAME);
        });
    }

    // ── Sidebar Injection ─────────────────────────────────────────────────────
    function _inject_sidebar_items() {
        const items = (frappe.boot && frappe.boot.insights_sidebar_items) || [];
        if (!items.length) return;

        // Frappe v15 sidebar: .desk-sidebar .sidebar-menu
        // We wait a tick to ensure the sidebar DOM is ready.
        frappe.after_ajax(function () {
            _render_sidebar_items(items);
        });
    }

    function _render_sidebar_items(items) {
        // Remove any previously rendered items (idempotent re-render)
        $(`.${ITEM_CLASS}`).remove();

        const $sidebar = $(".desk-sidebar .sidebar-menu, .standard-sidebar-section").first();
        if (!$sidebar.length) {
            // Sidebar not yet ready – retry after a short delay
            setTimeout(() => _render_sidebar_items(items), 300);
            return;
        }

        // Build a group section
        const $group = $(`
            <div class="${ITEM_CLASS} insights-sidebar-group">
                <div class="sidebar-group-label standard-sidebar-label">
                    <span>${frappe.utils.escape_html(SIDEBAR_GROUP_LABEL)}</span>
                </div>
                <ul class="list-unstyled insights-sidebar-list"></ul>
            </div>
        `);

        const $list = $group.find(".insights-sidebar-list");

        items.forEach(function (item) {
            const $li = _make_sidebar_item(item);
            $list.append($li);
        });

        $sidebar.append($group);
        _update_active_state();
    }

    function _make_sidebar_item(item) {
        const scrubbed = frappe.scrub(item.label);
        const $li = $(`
            <li class="${ITEM_CLASS} insights-sidebar-link" data-label="${frappe.utils.escape_html(item.label)}" data-scrubbed="${scrubbed}">
                <a class="item-anchor sidebar-item-container" href="/app/${ROUTE_PREFIX}/${scrubbed}">
                    <span class="sidebar-item-icon">
                        ${frappe.utils.icon("dashboard", "sm")}
                    </span>
                    <span class="sidebar-item-label">${frappe.utils.escape_html(item.label)}</span>
                </a>
            </li>
        `);

        $li.find("a").on("click", function (e) {
            e.preventDefault();
            _navigate_to_dashboard(item);
        });

        return $li;
    }

    function _navigate_to_dashboard(item) {
        const scrubbed = frappe.scrub(item.label);

        // Use frappe.set_route to navigate in-place (no full page reload)
        frappe.route_options = { dashboard: item.dashboard };
        frappe.set_route(PAGE_NAME);

        // Push a clean URL into the browser history
        window.history.pushState(
            { route: `${ROUTE_PREFIX}/${scrubbed}` },
            "",
            `/app/${ROUTE_PREFIX}/${scrubbed}`
        );

        _update_active_state(scrubbed);
    }

    function _update_active_state(activeScrubbed) {
        if (!activeScrubbed) {
            // Infer from current URL
            const hash = window.location.pathname; // /app/insights-dashboard/my-dash
            const match = hash.match(/insights-dashboard\/(.+)/);
            activeScrubbed = match ? match[1] : null;
        }

        $(`.${ITEM_CLASS}[data-scrubbed]`).each(function () {
            const $item = $(this);
            const isActive = $item.attr("data-scrubbed") === activeScrubbed;
            $item.find("a")
                .toggleClass("active selected", isActive)
                .attr("aria-current", isActive ? "page" : null);
        });
    }

    // ── Realtime: remove deleted items without reload ─────────────────────────
    function _register_realtime_listener() {
        frappe.realtime.on("insights_sidebar_removed", function (data) {
            // data.config_name is the label (name field = label due to autoname)
            const scrubbed = frappe.scrub(data.config_name || "");

            // Remove from DOM immediately
            $(`.${ITEM_CLASS}[data-scrubbed="${scrubbed}"]`).fadeOut(300, function () {
                $(this).remove();
                // If the group is now empty, remove it too
                const $list = $(".insights-sidebar-list");
                if ($list.length && !$list.children().length) {
                    $(".insights-sidebar-group").remove();
                }
            });

            // Refresh the full list from server to stay in sync
            frappe.call({
                method: "insights_sidebar.api.sidebar.get_sidebar_items",
                callback(r) {
                    _render_sidebar_items(r.message || []);
                },
            });
        });
    }

})();
