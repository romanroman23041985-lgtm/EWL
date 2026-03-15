import { getProductInitial } from "@/lib/products";

export function ProductAvatar({
  icon,
  name,
  size = "md",
}: {
  icon?: string;
  name: string;
  size?: "sm" | "md";
}) {
  const sizeClass = size === "sm" ? "h-9 w-9 text-sm" : "h-11 w-11 text-base";

  if (icon?.trim()) {
    return (
      <div className={`flex ${sizeClass} items-center justify-center rounded-full bg-white text-xl shadow-sm`}>
        {icon}
      </div>
    );
  }

  return (
    <div
      className={`flex ${sizeClass} items-center justify-center rounded-full bg-[linear-gradient(160deg,#ecfaf4,#ffe8f0)] font-semibold text-slate-700`}
    >
      {getProductInitial(name)}
    </div>
  );
}
