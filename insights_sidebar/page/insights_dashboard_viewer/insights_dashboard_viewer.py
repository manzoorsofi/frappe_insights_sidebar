import frappe

def get_context(context):
    context.no_cache = 1
EOF

cat > insights_sidebar/page/insights_dashboard_viewer/insights_dashboard_viewer.js << 'EOF'
frappe.pages["insights-dashboard-viewer"].on_page_load = function(wrapper) {
    const page = frappe.ui.make_app_page({
        parent: wrapper,
        title: __("Insights Dashboard"),
        single_column: true,
    });
    wrapper._insights_page = page;

    $(`<div class="insights-iframe-wrapper" style="width:100%;height:calc(100vh - 120px);">
        <div class="insights-loading" style="padding:40px;text-align:center;color:var(--text-muted);">
            ${__("Loading dashboard…")}
        </div>
        <iframe id="insights-frame" frameborder="0"
            style="width:100%;height:100%;border:none;display:none;">
        </iframe>
    </div>`).appendTo(page.main);
};

frappe.pages["insights-dashboard-viewer"].on_page_show = function(wrapper) {
    const page = wrapper._insights_page;
    const opts = frappe.route_options || {};
    const dashboard = opts.dashboard || "";

    if (!dashboard) {
        page.set_title(__("No Dashboard Selected"));
        return;
    }

    page.set_title(dashboard);

    const url = dashboard.startsWith("/") ? dashboard : `/insights/dashboard/${encodeURIComponent(dashboard)}`;
    const $loading = wrapper.find(".insights-loading");
    const $frame = wrapper.find("#insights-frame");

    $loading.show();
    $frame.hide().attr("src", url).off("load").on("load", function() {
        $loading.hide();
        $frame.fadeIn(200);
    });
};