import { useState, useEffect } from "react";
import { apiCall } from "../shared/api.js";
import DataGrid from "../shared/DataGrid.jsx";
import FilterMasterDetails from "./FilterMasterDetails.jsx";

const COLUMNS = [
  { key: "FilterID",     label: "ID", numeric: true },
  { key: "FilterName",   label: "Filter Name" },
  { key: "DatabaseName", label: "Database" },
  { key: "SchemaName",   label: "Schema" },
  { key: "TableName",    label: "Table" },
  { key: "FieldCount",   label: "Fields",   numeric: true, render: v => <span style={{ padding:"3px 9px", borderRadius:999, fontSize:11, fontWeight:900, background:"#dbeafe", color:"#2563eb" }}>{v ?? 0}</span> },
  { key: "OrderByCount", label: "Order By", numeric: true },
];

export default function FilterMaster() {
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(false);
  const [detail, setDetail]   = useState(null); // null | { mode, row }
  const [toast, setToast]     = useState("");

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try { const d = await apiCall("Get Filters"); setRows(d.List0 || []); }
    catch { showToast("Failed to load filters"); }
    setLoading(false);
  }

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(""), 2200); }

  async function handleDelete(selectedRows) {
    if (!confirm(`Delete ${selectedRows.length} filter(s)?`)) return;
    for (const row of selectedRows) {
      try { await apiCall("Delete Filter", { FilterID: row.FilterID }); }
      catch { showToast("Delete failed"); return; }
    }
    showToast("Deleted"); load();
  }

  function handleSaved() { setDetail(null); load(); }

  if (detail) return (
    <FilterMasterDetails
      mode={detail.mode}
      row={detail.row}
      onBack={() => setDetail(null)}
      onSaved={handleSaved}
    />
  );

  return (
    <>
      <DataGrid
        title="Filters"
        subtitle="Manage ERP page filters"
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
