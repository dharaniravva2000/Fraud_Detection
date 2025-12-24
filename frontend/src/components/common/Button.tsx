import { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

export const Button = ({ variant = "primary", className = "", ...props }: Props) => {
  const base = "inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition";
  const styles = {
    primary: "bg-brand-600 text-white hover:bg-brand-700",
    secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200",
    ghost: "text-slate-600 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800",
  };
  return <button className={`${base} ${styles[variant]} ${className}`} {...props} />;
};
