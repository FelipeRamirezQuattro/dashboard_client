import React from "react";
import {
  Clock,
  FlaskConical,
  Gauge,
  Map as MapIcon,
  Rocket,
  Settings2,
  ShieldCheck,
  Waves,
  type LucideIcon,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Spinner,
} from "@odessa-separator/ui";
import { IExternalApp, categoryLabels } from "../types/app.types";
import { useLaunchApp } from "../hooks/useApps";
import { useAuth } from "../hooks/useAuth";
import NoticeModal from "./NoticeModal";

interface AppCardProps {
  app: IExternalApp;
}

const categoryIcons: Record<string, LucideIcon> = {
  gas: Settings2,
  chemical: FlaskConical,
  sand: Gauge,
  pumps: Waves,
  admin: ShieldCheck,
  other: MapIcon,
};

const getErrorMessage = (error: unknown): string => {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as { response?: { data?: { message?: unknown } } })
      .response;
    const message = response?.data?.message;
    if (typeof message === "string" && message) return message;
  }
  return "Failed to launch app";
};

const AppCard: React.FC<AppCardProps> = ({ app }) => {
  const { mutate: launchApp, isPending, error } = useLaunchApp();
  const { user } = useAuth();
  const [isSsoNoticeOpen, setIsSsoNoticeOpen] = React.useState(false);

  const handleLaunch = () => {
    // Check if app is coming soon
    if (app.comingSoon) {
      return;
    }

    // Check if SSO is required and user doesn't have Microsoft linked
    if (app.ssoEndpoint && !user?.microsoftId) {
      setIsSsoNoticeOpen(true);
      return;
    }

    launchApp(app._id);
  };

  const CategoryIcon = categoryIcons[app.category] || categoryIcons.other;

  return (
    <>
      <Card className="flex h-full flex-col">
        <CardHeader className="flex-row items-start justify-between gap-2">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-control bg-surface-muted text-text sm:size-14">
            <CategoryIcon size={26} aria-hidden="true" />
          </div>
          {app.ssoEndpoint && <Badge variant="info">SSO Enabled</Badge>}
        </CardHeader>

        <CardContent className="flex flex-1 flex-col gap-2">
          <CardTitle className="line-clamp-2">{app.name}</CardTitle>
          <div>
            <Badge variant="neutral">{categoryLabels[app.category]}</Badge>
          </div>
          <CardDescription className="line-clamp-2 sm:line-clamp-3">
            {app.description}
          </CardDescription>
        </CardContent>

        <CardFooter className="flex-col items-stretch gap-2">
          <Button
            onClick={handleLaunch}
            disabled={isPending || app.comingSoon}
            className="w-full"
          >
            {app.comingSoon ? (
              <>
                Coming Soon
                <Clock size={16} aria-hidden="true" />
              </>
            ) : isPending ? (
              <>
                <Spinner size="sm" label="Launching" />
                Launching...
              </>
            ) : (
              <>
                Launch
                <Rocket size={16} aria-hidden="true" />
              </>
            )}
          </Button>
          {error && (
            <p role="alert" className="text-sm text-danger-text">
              {getErrorMessage(error)}
            </p>
          )}
        </CardFooter>
      </Card>
      <NoticeModal
        isOpen={isSsoNoticeOpen}
        title="Microsoft SSO Required"
        message="This application requires Microsoft SSO. Please sign in with Microsoft to access."
        onClose={() => setIsSsoNoticeOpen(false)}
      />
    </>
  );
};

export default AppCard;
