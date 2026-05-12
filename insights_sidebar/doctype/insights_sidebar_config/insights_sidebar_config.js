// insights_sidebar/doctype/insights_sidebar_config/insights_sidebar_config.js

frappe.ui.form.on("Insights Sidebar Config", {
    refresh(frm) {
        if (!frm.is_new()) {
            frm.add_custom_button(__("Preview in Sidebar"), () => {
                frappe.set_route(
                    "insights-dashboard",
                    frappe.scrub(frm.doc.label)
                );
            }, __("Actions"));
        }
    },

    dashboard(frm) {
        // Auto-fill label from dashboard name if label is empty
        if (!frm.doc.label && frm.doc.dashboard) {
            frm.set_value("label", frm.doc.dashboard);
        }
    }
});
