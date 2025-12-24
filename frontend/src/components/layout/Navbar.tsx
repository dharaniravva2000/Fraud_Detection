import { NavLink } from "react-router-dom";
import { routes } from "../../routes";
import ApiStatus from "../common/ApiStatus";
import { Button } from "../common/Button";

const Navbar = () => {
  const toggleTheme = () => {
    const root = document.documentElement;
    const isDark = root.classList.contains("dark");
    if (isDark) {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    } else {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 backdrop-blur dark:border-slate-800/70 dark:bg-slate-950/80">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <div className="rounded-full bg-brand-600 px-3 py-1 text-sm font-semibold text-white">
            FraudShield
          </div>
          <nav className="hidden gap-2 md:flex">
            {routes.map((route) => (
              <NavLink
                key={route.path}
                to={route.path}
                className={({ isActive }) =>
                  `rounded-full px-3 py-1 text-sm font-medium transition ${
                    isActive
                      ? "bg-brand-600 text-white"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`
                }
              >
                {route.label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <ApiStatus />
          <Button variant="secondary" onClick={toggleTheme}>
            Toggle theme
          </Button>
        </div>
      </div>
      <div className="flex gap-2 overflow-x-auto border-t border-slate-200/60 px-4 py-2 md:hidden dark:border-slate-800/60">
        {routes.map((route) => (
          <NavLink
            key={route.path}
            to={route.path}
            className={({ isActive }) =>
              `whitespace-nowrap rounded-full px-3 py-1 text-sm font-medium transition ${
                isActive
                  ? "bg-brand-600 text-white"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              }`
            }
          >
            {route.label}
          </NavLink>
        ))}
      </div>
    </header>
  );
};

export default Navbar;
