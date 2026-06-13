import { useState, useEffect } from "react";
import { apiCall } from "../shared/api.js";
import DataGrid from "../shared/DataGrid.jsx";
import PageMasterDetails from "./PageMasterDetails.jsx";

const COLUMNS = [
  { key: "PageID",       label: "ID" },
  { key: "PageName",     label: "Page Name" },
  { key: "Icon",         label: "Icon" },
  { key: "PageType",     label: "Type", render: v => <span style={{ padding:"4px 9px", borderRadius:999, fontSize:11, fontWeight:900, background: v==="grid"?"#dbeafe":"#ffedd5", color: v==="grid"?"#2563eb":"#ea580c" }}>{v||"grid"}</span> },
  { key: "DatabaseName", label: "Database" },
  { key: "SchemaName",   label: "Schema" },
  { key: "TableName",    label: "Table" },
];

export default function PageMaster() {
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(false);
  const [detail, setDetail]   = useState(null); // null | { mode, row }
  const [toast, setToast]     = useState("");

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try { const d = await apiCall("Get Pages"); setRows(d.List0 || []); }
    catch { showToast("Failed to load pages"); }
    setLoading(false);
  }

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(""), 2200); }

  async function handleDelete(selectedRows) {
    if (!confirm(`Delete ${selectedRows.length} page(s)?`)) return;
    for (const row of selectedRows) {
      try { await apiCall("Delete Page", { PageID: row.PageID }); }
      catch { showToast("Delete failed"); return; }
    }
    showToast("Deleted"); load();
  }

  function handleSaved() {
    setDetail(null);
    load();
  }

  if (detail) return (
    <PageMasterDetails
      mode={detail.mode}
      row={detail.row}
      onBack={() => setDetail(null)}
      onSaved={handleSaved}
    />
  );

  return (
    <>
      <DataGrid
        title="Pages"
        subtitle="Manage ERP pages"
        columns={COLUMNS}
        rows={rows}
        loading={loading}
        onAdd={() => setDetail({ mode:"add", row:null })}
        onEdit={row => setDetail({ mode:"edit", row })}
        onView={row => setDetail({ mode:"view", row })}
        onDelete={handleDelete}
        onRefresh={load}
      />
      {toast && <div className="dg-toast show">{toast}</div>}
    </>
  );
}
