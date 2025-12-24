import { useMemo, useState } from "react";

type Column<T> = {
  key: keyof T;
  label: string;
  render?: (row: T) => React.ReactNode;
};

type Props<T> = {
  columns: Column<T>[];
  rows: T[];
};

const DataTable = <T extends { row_id: string }>({ columns, rows }: Props<T>) => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filtered = useMemo(() => {
    if (!search) return rows;
    return rows.filter((row) => JSON.stringify(row).toLowerCase().includes(search.toLowerCase()));
  }, [rows, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-3 flex items-center justify-between">
        <input
          className="w-full max-w-sm rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950"
          placeholder="Search results..."
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
        />
        <div className="text-xs text-slate-500">{filtered.length} rows</div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-xs uppercase text-slate-500">
              {columns.map((col) => (
                <th key={String(col.key)} className="pb-2">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row) => (
              <tr key={row.row_id} className="border-t border-slate-100 dark:border-slate-800">
                {columns.map((col) => (
                  <td key={String(col.key)} className="py-2">
                    {col.render ? col.render(row) : String(row[col.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex items-center justify-between text-sm">
        <button
          className="rounded-full px-3 py-1 text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          disabled={page === 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          Previous
        </button>
        <span className="text-xs text-slate-500">
          Page {page} of {totalPages}
        </span>
        <button
          className="rounded-full px-3 py-1 text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          disabled={page === totalPages}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default DataTable;
