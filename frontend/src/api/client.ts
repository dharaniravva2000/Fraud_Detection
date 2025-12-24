const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

type RequestOptions = {
  method?: string;
  headers?: Record<string, string>;
  body?: BodyInit | null;
};

export const apiFetch = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    body: options.body || null,
  });

  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || "Request failed");
  }

  return res.json() as Promise<T>;
};

type UploadArgs = {
  path: string;
  formData: FormData;
  onProgress?: (progress: number) => void;
};

export const apiUpload = <T>({ path, formData, onProgress }: UploadArgs): Promise<T> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_BASE_URL}${path}`);
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(new Error(xhr.responseText || "Upload failed"));
      }
    };
    xhr.onerror = () => reject(new Error("Network error"));
    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          onProgress(Math.round((event.loaded / event.total) * 100));
        }
      };
    }
    xhr.send(formData);
  });
};
