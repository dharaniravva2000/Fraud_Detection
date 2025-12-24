import { Link } from "react-router-dom";

const NotFound = () => (
  <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center dark:border-slate-800 dark:bg-slate-900">
    <h1 className="text-2xl font-semibold">Page not found</h1>
    <p className="mt-2 text-sm text-slate-500">Return to overview.</p>
    <Link className="mt-4 inline-block rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white" to="/">
      Go to Overview
    </Link>
  </div>
);

export default NotFound;
