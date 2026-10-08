import type { ReactNode } from "react";

export function PageHeader({ title, description, icon, actions, eyebrow }: {
  title: ReactNode; description?: ReactNode; icon?: ReactNode; actions?: ReactNode; eyebrow?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex items-start gap-4">
        {icon && (
          <div className="hidden h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-gradient text-white shadow-[0_10px_24px_-10px_rgb(14_60_173/0.7)] sm:grid [&_svg]:h-5 [&_svg]:w-5">
            {icon}
          </div>
        )}
        <div>
          {eyebrow && <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.16em] text-brand">{eyebrow}</div>}
          <h1 className="font-display text-[28px] leading-tight text-ink sm:text-[32px]">{title}</h1>
          {description && <p className="mt-1 max-w-2xl text-sm text-muted">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
