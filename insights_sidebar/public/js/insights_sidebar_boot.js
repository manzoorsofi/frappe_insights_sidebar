(function () {
    "use strict";

    $(document).on("startup", function () {
        _inject_sidebar_items();
        _register_realtime_listener();
    });

    function _inject_sidebar_items() {
        const items = (frappe.boot && frappe.boot.insights_sidebar_items) || [];
        if (!items.length) return;
        // Keep retrying until sidebar is ready
        _try_render(items, 0);
    }

    function _try_render(items, attempts) {
        if (attempts > 20) return; // give up after 10 seconds

        // Frappe v15 sidebar selectors
        const $sidebar = $(
            ".desk-sidebar .sidebar-menu," +
            ".standard-sidebar-section," +
            ".sidebar-items," +
            "[class*='sidebar'] ul"
        ).first();

        if (!$sidebar.length) {
            setTimeout(() => _try_render(items, attempts + 1), 500);
            return;
        }

        _render_items(items, $sidebar);
    }

    function _render_items(items, $sidebar) {
        $(".insights-sidebar-group").remove();

        const $group = $(`
            <div class="insights-sidebar-group desk-sidebar-item standard-sidebar-item">
                <div class="standard-sidebar-label">
                    <span>Insights Dashboards</span>
                </div>
                <ul class="list-unstyled insights-sidebar-list"></ul>
            </div>
        `);

        items.forEach(function (item) {
            const scrubbed = frappe.scrub(item.label);
            const $li = $(`
                <li class="insights-sidebar-link" data-scrubbed="${scrubbed}">
                    <a class="item-anchor sidebar-item-container" href="#" 
                       style="display:flex;align-items:center;padding:6px 12px;border-radius:4px;color:var(--text-color);text-decoration:none;font-size:var(--text-sm);">
                        <span class="sidebar-item-label">${frappe.utils.escape_html(item.label)}</span>
                    </a>
                </li>
            `);

            $li.find("a").on("click", function (e) {
                e.preventDefault();
                $(".insights-sidebar-link a").removeClass("active");
                $(this).addClass("active");
                frappe.route_options = { dashboard: item.dashboard };
                frappe.set_route("insights-dashboard-viewer");
            });

            $group.find(".insights-sidebar-list").append($li);
        });

        $sidebar.append($group);
        console.log("[Insights Sidebar] Injected", items.length, "item(s) into sidebar");
    }

    function _register_realtime_listener() {
        frappe.realtime.on("insights_sidebar_removed", function (data) {
            const scrubbed = frappe.scrub(data.config_name || "");
            $(`[data-scrubbed="${scrubbed}"]`).fadeOut(300, function () {
                $(this).remove();
            });
            frappe.call({
                method: "insights_sidebar.api.sidebar.get_sidebar_items",
                callback(r) {
                    const $sidebar = $(".desk-sidebar .sidebar-menu, .standard-sidebar-section").first();
                    if ($sidebar.length) _render_items(r.message || [], $sidebar);
                }
            });
        });
    }

})();
