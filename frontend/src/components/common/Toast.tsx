const Toast = ({ message }: { message: string }) => (
  <div className="rounded-xl bg-emerald-500/15 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
    {message}
  </div>
);

export default Toast;
