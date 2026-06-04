import React from "react";
import {
  CarFront,
  CheckCircle2,
  CalendarClock,
  DollarSign,
  TrendingUp,
  Clock,
  Undo2,
} from "lucide-react";
import { StatCard } from "./stat-card";

export function SectionCarRental() {
  return (
    <div className="flex flex-col gap-10 w-full animate-in fade-in-50 duration-500">
      {/* Fleet Performance Section */}
      <section className="space-y-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Fleet Performance
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Real-time metrics of your active vehicles
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            title="Total Vehicles"
            value="120"
            description="Active fleet size"
            icon={<CarFront className="h-4 w-4" />}
          />
          <StatCard
            title="Available"
            value="45"
            description="Ready for booking"
            icon={<CheckCircle2 className="h-4 w-4" />}
          />
          <StatCard
            title="Booked"
            value="75"
            description="Currently in use or reserved"
            icon={<CalendarClock className="h-4 w-4" />}
          />
        </div>
      </section>

      {/* Financial Overview Section */}
      <section className="space-y-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Financial Overview
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Revenue and payment statistics
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Revenue"
            value="$124,500"
            description="Life-to-date earnings"
            icon={<DollarSign className="h-4 w-4" />}
          />
          <StatCard
            title="Monthly Revenue"
            value="$14,200"
            description="Current month up to date"
            icon={<TrendingUp className="h-4 w-4" />}
          />
          <StatCard
            title="Pending Payments"
            value="$2,150"
            description="Unsettled transactions"
            icon={<Clock className="h-4 w-4" />}
          />
          <StatCard
            title="Refunds"
            value="$850"
            description="Processed this month"
            icon={<Undo2 className="h-4 w-4" />}
          />
        </div>
      </section>
    </div>
  );
}
