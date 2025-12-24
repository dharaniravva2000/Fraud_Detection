import { useRef, useState } from "react";

type Props = {
  label: string;
  file: File | null;
  onFile: (file: File | null) => void;
};

const UploadDropzone = ({ label, file, onFile }: Props) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    const dropped = event.dataTransfer.files[0];
    if (dropped && dropped.name.endsWith(".csv")) {
      onFile(dropped);
    }
  };

  return (
    <div
      className={`rounded-2xl border-2 border-dashed p-4 text-center transition ${
        dragging ? "border-brand-500 bg-brand-50" : "border-slate-200 dark:border-slate-700"
      }`}
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={(event) => onFile(event.target.files?.[0] || null)}
      />
      <p className="text-sm font-semibold">{label}</p>
      <p className="mt-1 text-xs text-slate-500">Drag & drop CSV or click to browse</p>
      {file ? (
        <div className="mt-2 text-xs text-slate-600">Selected: {file.name}</div>
      ) : (
        <div className="mt-2 text-xs text-slate-400">No file selected</div>
      )}
      <button
        className="mt-3 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
        onClick={() => inputRef.current?.click()}
      >
        Choose file
      </button>
    </div>
  );
};

export default UploadDropzone;
