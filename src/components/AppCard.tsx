import React from "react";
import { IExternalApp, categoryLabels } from "../types/app.types";
import { useLaunchApp } from "../hooks/useApps";
import { useAuth } from "../hooks/useAuth";

interface AppCardProps {
  app: IExternalApp;
}

const categoryIconsAndColors: Record<
  string,
  { icon: string; bgColor: string; iconColor: string }
> = {
  gas: {
    icon: "settings_input_component",
    bgColor: "bg-orange-100",
    iconColor: "text-orange-600",
  },
  chemical: {
    icon: "science",
    bgColor: "bg-emerald-100",
    iconColor: "text-emerald-600",
  },
  sand: {
    icon: "analytics",
    bgColor: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  pumps: {
    icon: "water_pump",
    bgColor: "bg-amber-100",
    iconColor: "text-amber-600",
  },
  admin: {
    icon: "shield",
    bgColor: "bg-red-100",
    iconColor: "text-red-600",
  },
  other: {
    icon: "map",
    bgColor: "bg-purple-100",
    iconColor: "text-purple-600",
  },
};

const AppCard: React.FC<AppCardProps> = ({ app }) => {
  const { mutate: launchApp, isPending, error } = useLaunchApp();
  const { user } = useAuth();

  const handleLaunch = () => {
    // Check if app is coming soon
    if (app.comingSoon) {
      return;
    }

    // Check if SSO is required and user doesn't have Microsoft linked
    if (app.ssoEndpoint && !user?.microsoftId) {
      alert(
        "This application requires Microsoft SSO. Please sign in with Microsoft to access.",
      );
      return;
    }

    launchApp(app._id);
  };

  const categoryStyle =
    categoryIconsAndColors[app.category] || categoryIconsAndColors.other;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 sm:p-6 flex flex-col hover:shadow-xl transition-all hover:-translate-y-1 touch-manipulation">
      <div className="flex justify-between items-start mb-3 sm:mb-4">
        <div
          className={`h-12 w-12 sm:h-14 sm:w-14 rounded-xl ${categoryStyle.bgColor} flex items-center justify-center ${categoryStyle.iconColor} flex-shrink-0`}
        >
          <span
            className="material-symbols-outlined text-2xl sm:text-3xl"
            aria-hidden="true"
          >
            {categoryStyle.icon}
          </span>
        </div>
        {app.ssoEndpoint && (
          <span className="bg-osi-secondary/10 text-osi-secondary text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-1.5 sm:px-2 py-1 rounded-full flex items-center gap-1">
            <span
              className="material-symbols-outlined text-xs"
              aria-hidden="true"
            >
              verified_user
            </span>{" "}
            <span className="hidden xs:inline">SSO Enabled</span>
            <span className="xs:hidden">SSO</span>
          </span>
        )}
      </div>

      <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1 line-clamp-2">
        {app.name}
      </h3>

      <span className="inline-flex items-center rounded-md bg-slate-50 px-2 py-1 text-xs font-medium text-osi-secondary ring-1 ring-inset ring-slate-500/10 mb-3 w-fit">
        {categoryLabels[app.category]}
      </span>

      <p className="text-sm text-slate-500 line-clamp-2 sm:line-clamp-3 mb-4 sm:mb-6 flex-grow">
        {app.description}
      </p>

      <div className="mt-auto">
        <button
          onClick={handleLaunch}
          disabled={isPending || app.comingSoon}
          className="w-full bg-osi-primary hover:bg-osi-primary/90 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {app.comingSoon ? (
            <>
              <span>Coming Soon</span>
              <span className="material-symbols-outlined text-sm">
                schedule
              </span>
            </>
          ) : isPending ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Launching...</span>
            </>
          ) : (
            <>
              <span>Launch</span>
              <span className="material-symbols-outlined text-sm">
                rocket_launch
              </span>
            </>
          )}
        </button>

        {/* Error Message */}
        {error && (
          <p className="text-red-600 text-sm mt-2">
            {(error as any).response?.data?.message || "Failed to launch app"}
          </p>
        )}
      </div>
    </div>
  );
};

export default AppCard;
