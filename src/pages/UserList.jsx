import { useState, useEffect } from "react";
import { apiCall } from "../shared/api.js";
import DataGrid from "../shared/DataGrid.jsx";

const COLUMNS = [
  { key: "UserID",   label: "ID" },
  { key: "Username", label: "Username" },
  { key: "Name",     label: "Full Name" },
  {
    key: "IsNotActive", label: "Status",
    render: (v) => <span className={`dg-badge ${v ? "inactive" : "active"}`}>{v ? "Inactive" : "Active"}</span>,
  },
];

export default function UserList({ user }) {
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal]     = useState(null);
  const [form, setForm]       = useState({});
  const [saving, setSaving]   = useState(false);
  const [toast, setToast]     = useState("");

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const d = await apiCall("Get Users");
      setRows(d.List0 || []);
    } catch { showToast("Failed to load"); }
    setLoading(false);
  }

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(""), 2000); }
  function openAdd()       { setForm({ Username: "", Name: "", Password: "", IsNotActive: 0 }); setModal("add"); }
  function openEdit(row)   { setForm({ ...row, Password: "" }); setModal("edit"); }
  function openView(row)   { setForm({ ...row }); setModal("view"); }

  async function handleDelete(selectedRows) {
    if (!confirm(`Delete ${selectedRows.length} user(s)?`)) return;
    for (const row of selectedRows) {
      try { await apiCall("Delete User", { UserID: row.UserID }); }
      catch { showToast("Delete failed"); return; }
    }
    showToast("Deleted"); load();
  }

  async function handleSave() {
    setSaving(true);
    try {
      const op = modal === "add" ? "Add User" : "Edit User";
      const d = await apiCall(op, form);
      if (d.State === 0) { showToast(modal === "add" ? "User added" : "User updated"); setModal(null); load(); }
      else showToast(d.Message || "Error");
    } catch { showToast("Save failed"); }
    setSaving(false);
  }

  return (
    <>
      <DataGrid
        title="Users"
        subtitle="Manage system users"
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
            <div style={{padding:"7px 16px",background:"var(--soft)",borderBottom:"1px solid var(--border)",fontSize:12,color:"var(--muted)",display:"flex",gap:6,alignItems:"center"}}>
              <span style={{cursor:"pointer",fontWeight:900}} onClick={()=>setModal(null)}>Users</span>
              <span>›</span>
              <span style={{color:"var(--text)",fontWeight:900}}>{modal==="add"?"New User":modal==="edit"?`Edit — ${form.Username||"…"}`:`View — ${form.Username||"…"}`}</span>
            </div>
            <div className="dg-modal-head">
              <h3>{modal === "add" ? "Add User" : modal === "edit" ? "Edit User" : "View User"}</h3>
              <button className="dg-btn" onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="dg-modal-body" style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="dg-form-field">
                <label>Username</label>
                <input value={form.Username || ""} readOnly={modal === "view"}
                  onChange={e => setForm(f => ({ ...f, Username: e.target.value }))} />
              </div>
              <div className="dg-form-field">
                <label>Full Name</label>
                <input value={form.Name || ""} readOnly={modal === "view"}
                  onChange={e => setForm(f => ({ ...f, Name: e.target.value }))} />
              </div>
              {modal !== "view" && (
                <div className="dg-form-field">
                  <label>Password {modal === "edit" && "(leave blank to keep)"}</label>
                  <input type="password" value={form.Password || ""}
                    onChange={e => setForm(f => ({ ...f, Password: e.target.value }))} />
                </div>
              )}
              <div className="dg-form-field">
                <label>Status</label>
                <select value={form.IsNotActive ?? 0} disabled={modal === "view"}
                  onChange={e => setForm(f => ({ ...f, IsNotActive: Number(e.target.value) }))}>
                  <option value={0}>Active</option>
                  <option value={1}>Inactive</option>
                </select>
              </div>
            </div>
            {modal !== "view" && (
              <div className="dg-modal-foot">
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
