import type { PersistedAppState } from "@/lib/types";

type TransferEnvelope = {
  version: 1;
  createdAt: string;
  state: PersistedAppState;
};

function toBase64(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function fromBase64(value: string) {
  const binary = atob(value);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function buildTransferState(state: PersistedAppState): PersistedAppState {
  return {
    version: state.version,
    themeMode: state.themeMode,
    companion: state.companion,
    selectedUserId: state.selectedUserId,
    profiles: state.profiles,
    products: state.products,
    dayEntries: state.dayEntries,
    mealItems: state.mealItems,
    recentProductsByUser: state.recentProductsByUser,
  };
}

export function encodeTransferKey(state: PersistedAppState) {
  const envelope: TransferEnvelope = {
    version: 1,
    createdAt: new Date().toISOString(),
    state: buildTransferState(state),
  };
  return toBase64(JSON.stringify(envelope));
}

export function decodeTransferKey(value: string): PersistedAppState {
  const cleaned = value.trim();
  const parsed = JSON.parse(fromBase64(cleaned)) as Partial<TransferEnvelope>;

  if (!parsed || parsed.version !== 1 || !parsed.state) {
    throw new Error("Неверный ключ переноса");
  }

  return parsed.state;
}

export function downloadStateBackup(state: PersistedAppState) {
  const payload = JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      state: buildTransferState(state),
    },
    null,
    2,
  );

  const blob = new Blob([payload], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const date = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `ewl-backup-${date}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
