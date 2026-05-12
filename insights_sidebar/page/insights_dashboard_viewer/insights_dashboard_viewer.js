/**
 * insights_sidebar/page/insights_dashboard_viewer/insights_dashboard_viewer.js
 *
 * This is the Frappe Page that renders the Insights Dashboard inside an
 * <iframe> so the Frappe Desk sidebar stays visible and no new tab opens.
 *
 * Route pattern:  insights-dashboard-viewer?dashboard=<name>
 * OR via our custom router: insights-dashboard/<scrubbed_label>
 */

frappe.pages["insights-dashboard-viewer"].on_page_load = function (wrapper) {
    const page = frappe.ui.make_app_page({
        parent: wrapper,
        title: __("Insights Dashboard"),
        single_column: true,
    });

    // Store page reference on wrapper so on_page_show can access it
    wrapper._insights_page = page;

    // Build the iframe once
    const $container = $(`
        <div class="insights-iframe-wrapper" style="
            position: relative;
            width: 100%;
            height: calc(100vh - var(--navbar-height, 60px) - var(--page-head-height, 0px) - 16px);
            overflow: hidden;
            border-radius: var(--border-radius-lg, 6px);
            background: var(--bg-color);
        ">
            <div class="insights-iframe-loading" style="
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100%;
                color: var(--text-muted);
            ">
                <span>${__("Loading dashboard…")}</span>
            </div>
            <iframe
                id="insights-dashboard-frame"
                frameborder="0"
                style="
                    width: 100%;
                    height: 100%;
                    border: none;
                    display: none;
                    background: transparent;
                "
                allow="fullscreen"
            ></iframe>
        </div>
    `).appendTo(page.main);

    wrapper._$container = $container;
};

frappe.pages["insights-dashboard-viewer"].on_page_show = function (wrapper) {
    const page = wrapper._insights_page;
    const $container = wrapper._$container;

    // Read query-string params (Frappe puts them in frappe.route_options)
    const opts = frappe.route_options || {};
    const dashboardName = opts.dashboard || frappe.get_route()[1] || "";

    if (!dashboardName) {
        page.set_title(__("No Dashboard Selected"));
        $container.find(".insights-iframe-loading").text(__("No dashboard specified."));
        return;
    }

    // Validate server-side that the user can see this dashboard before loading
    frappe.call({
        method: "insights_sidebar.api.sidebar.get_sidebar_items",
        callback(r) {
            const items = r.message || [];
            const match = items.find(
                (i) =>
                    frappe.scrub(i.label) === frappe.scrub(dashboardName) ||
                    i.dashboard === dashboardName
            );

            if (!match) {
                frappe.throw(__("You do not have permission to view this dashboard."));
                return;
            }

            _load_dashboard(page, $container, match.dashboard, match.label);
        },
    });
};

function _load_dashboard(page, $container, dashboardName, label) {
    page.set_title(label || dashboardName);

    const $loading = $container.find(".insights-iframe-loading");
    const $frame = $container.find("#insights-dashboard-frame");

    // Build the Insights dashboard URL.
    // Frappe Insights uses the route: /insights/dashboard/<name>
    // Adjust this URL if your Insights app uses a different path.
    const dashboardUrl = `/insights/dashboard/${encodeURIComponent(dashboardName)}`;

    $loading.show();
    $frame.hide();

    $frame
        .attr("src", dashboardUrl)
        .off("load")
        .on("load", function () {
            $loading.hide();
            $frame.fadeIn(200);
        })
        .on("error", function () {
            $loading.text(__("Failed to load dashboard."));
        });
}
