import { useState, useEffect } from "react";
import { apiCall } from "../shared/api.js";
import DataGrid from "../shared/DataGrid.jsx";

const COLUMNS = [
  { key: "GroupID",   label: "ID" },
  { key: "GroupName", label: "Group Name" },
];

export default function GroupMaster() {
  const [rows, setRows]     = useState([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal]   = useState(null);
  const [form, setForm]     = useState({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast]   = useState("");

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const d = await apiCall("Get Groups");
      const mapped = (d.List0 || []).map(g => ({
        ...g,
        GroupName: g.GroupName === "Customer Orders" ? "Customer Order" : g.GroupName
      }));
      setRows(mapped);
    } catch { showToast("Failed to load"); }
    setLoading(false);
  }

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(""), 2000); }
  function openAdd()      { setForm({ GroupName: "" }); setModal("add"); }
  function openEdit(row)  { setForm({ ...row }); setModal("edit"); }
  function openView(row)  { setForm({ ...row }); setModal("view"); }

  async function handleDelete(selectedRows) {
    if (!confirm(`Delete ${selectedRows.length} group(s)?`)) return;
    for (const row of selectedRows) {
      try { await apiCall("Delete Group", { GroupID: row.GroupID }); }
      catch { showToast("Delete failed"); return; }
    }
    showToast("Deleted"); load();
  }

  async function handleSave() {
    setSaving(true);
    try {
      const op = modal === "add" ? "Add Group" : "Edit Group";
      const d = await apiCall(op, form);
      if (d.State === 0) { showToast(modal === "add" ? "Group added" : "Group updated"); setModal(null); load(); }
      else showToast(d.Message || "Error");
    } catch { showToast("Save failed"); }
    setSaving(false);
  }

  return (
    <>
      <DataGrid
        title="Groups"
        subtitle="Manage user groups"
        columns={COLUMNS}
        rows={rows}
        loading={loading}
        onAdd={openAdd}
        onEdit={openEdit}
        onView={openView}
        onDelete={handleDelete}
        onRefresh={load}
      />

      {modal && (
        <div className="dg-modal show">
          <div className="dg-modal-box">
            <div className="dg-modal-head">
              <h3>{modal === "add" ? "Add Group" : modal === "edit" ? "Edit Group" : "View Group"}</h3>
              <button className="dg-btn" onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="dg-modal-body" style={{ display:"flex", flexDirection:"column", gap:14 }}>
              {modal !== "add" && (
                <div className="dg-form-field" style={{ marginBottom:14 }}>
                  <label style={{ display:"block", fontSize:12, fontWeight:900, color:"var(--muted)", textTransform:"uppercase", marginBottom:6 }}>Group ID</label>
                  <input style={{ width:"100%", height:44, border:"1px solid var(--border)", borderRadius:13, background:"#f1f5f9", padding:"0 13px", fontSize:14, fontWeight:700 }}
                    value={form.GroupID || ""} readOnly />
                </div>
              )}
              <div style={{ marginBottom:14 }}>
                <label style={{ display:"block", fontSize:12, fontWeight:900, color:"var(--muted)", textTransform:"uppercase", marginBottom:6 }}>Group Name</label>
                <input style={{ width:"100%", height:44, border:"1px solid var(--border)", borderRadius:13, background:"var(--soft)", padding:"0 13px", fontSize:14, fontWeight:700, outline:"none" }}
                  value={form.GroupName || ""} readOnly={modal === "view"}
                  onChange={e => setForm(f => ({ ...f, GroupName: e.target.value }))} />
              </div>
            </div>
            {modal !== "view" && (
              <div style={{ padding:"14px 18px", borderTop:"1px solid var(--border)", display:"flex", justifyContent:"flex-end", gap:8 }}>
                <button className="dg-btn" onClick={() => setModal(null)}>Cancel</button>
                <button className="dg-btn primary" disabled={saving} onClick={handleSave}>
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {toast && <div className="dg-toast show">{toast}</div>}
    </>
  );
}
