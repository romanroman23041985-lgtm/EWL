import { calculateTargets } from "@/lib/macros";
import type { UserProfile } from "@/lib/types";

export function UserSwitcher({
  users,
  selectedUserId,
  onSelect,
}: {
  users: UserProfile[];
  selectedUserId: string;
  onSelect: (userId: string) => void;
}) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-1">
      {users.map((user) => {
        const active = user.id === selectedUserId;
        const targets = calculateTargets(user);

        return (
          <button
            key={user.id}
            type="button"
            onClick={() => onSelect(user.id)}
            className={`min-w-[176px] rounded-[1.65rem] border px-4 py-4 text-left transition ${
              active
                ? "border-transparent bg-[linear-gradient(160deg,#f37ca5_0%,#ff95b8_100%)] text-white shadow-[0_16px_32px_rgba(243,124,165,0.34)]"
                : "app-card text-slate-700"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-base font-semibold">{user.name}</div>
                <div className={`mt-1 text-xs ${active ? "text-white/80" : "text-slate-500"}`}>
                  {user.weightKg} кг
                </div>
              </div>
              <div
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                  active ? "bg-white/18 text-white" : "bg-white text-slate-600"
                }`}
              >
                {targets.kcal} ккал
              </div>
            </div>
            <div className={`mt-3 text-xs leading-5 ${active ? "text-white/85" : "text-slate-500"}`}>
              Б {targets.protein} • Ж {targets.fat} • У {targets.carbs}
            </div>
          </button>
        );
      })}
    </div>
  );
}
