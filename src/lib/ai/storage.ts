const DEEPSEEK_API_KEY_STORAGE = "ewl.deepseek.apiKey.v1";

export function loadLocalDeepSeekApiKey() {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem(DEEPSEEK_API_KEY_STORAGE) ?? "";
}

export function saveLocalDeepSeekApiKey(value: string) {
  if (typeof window === "undefined") {
    return;
  }

  if (!value.trim()) {
    window.localStorage.removeItem(DEEPSEEK_API_KEY_STORAGE);
    return;
  }

  window.localStorage.setItem(DEEPSEEK_API_KEY_STORAGE, value.trim());
}
