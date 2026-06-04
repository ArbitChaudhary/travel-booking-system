import React from "react";

export function StatCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: string | number;
  description?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950/50 dark:hover:border-slate-700">
      {/* Decorative gradient background that subtlely reveals on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-slate-100/50 opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:to-slate-800/20" />

      <div className="relative flex flex-row items-center justify-between pb-2">
        <h3 className="font-semibold text-xs tracking-wide text-slate-500 uppercase dark:text-slate-400">
          {title}
        </h3>
        {icon && (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100/80 text-slate-700 transition-colors group-hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:group-hover:bg-slate-800">
            {icon}
          </div>
        )}
      </div>
      <div className="relative flex flex-col gap-0.5">
        <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          {value}
        </div>
        {description && (
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
