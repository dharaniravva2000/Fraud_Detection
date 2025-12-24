const KEY = "default_model";

export const setDefaultModel = (model: string) => localStorage.setItem(KEY, model);
export const getDefaultModel = () => localStorage.getItem(KEY) || "xgb";
