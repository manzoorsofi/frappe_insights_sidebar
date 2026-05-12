frappe.ui.form.on("Insights Sidebar Config", {
    refresh(frm) {
        if (!frm.is_new()) {
            frm.add_custom_button(__("Preview in Sidebar"), () => {
                frappe.set_route("insights-dashboard-viewer", {"dashboard": frm.doc.dashboard});
            }, __("Actions"));
        }
    }
});