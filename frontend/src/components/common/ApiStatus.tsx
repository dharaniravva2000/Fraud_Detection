import { useHealth } from "../../api/hooks";

const ApiStatus = () => {
  const { data, isError } = useHealth();
  const ok = data?.status === "ok" && !isError;

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className={`h-2 w-2 rounded-full ${ok ? "bg-emerald-500" : "bg-red-500"}`} />
      <span className="text-slate-500 dark:text-slate-300">API {ok ? "Online" : "Offline"}</span>
    </div>
  );
};

export default ApiStatus;
