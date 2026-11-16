import React from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Briefcase, Building2, Clock, ExternalLink, Layers, Tag, Code2, type LucideIcon } from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Avatar,
  Badge,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbPage,
  Button,
  buttonVariants,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  linkVariants,
} from "@odessa-separator/ui";
import { useQuery } from "@tanstack/react-query";
import { getApps, launchApp } from "../services/apps.service";
import { businessUnitService } from "../services/businessUnit.service";
import { departmentService } from "../services/department.service";
import { IExternalApp, categoryLabels } from "../types/app.types";
import { BusinessUnit } from "../types/businessUnit.types";
import LoadingSpinner from "../components/LoadingSpinner";
import { useAuth } from "../hooks/useAuth";
import NoticeModal from "../components/NoticeModal";
import BreadcrumbRouterLink from "../components/BreadcrumbRouterLink";

const ApplicationDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const { data: apps = [], isLoading } = useQuery({ queryKey: ["apps"], queryFn: getApps });
  const { data: businessUnits = [] } = useQuery({ queryKey: ["businessUnits"], queryFn: () => businessUnitService.getActiveBusinessUnits() });

  const app = (apps as IExternalApp[]).find((a) => a._id === id);
  const buId = app ? (typeof app.businessUnitId === "string" ? app.businessUnitId : app.businessUnitId._id) : null;
  const bu = buId ? (businessUnits as BusinessUnit[]).find((b) => b._id === buId) : null;
  const buName = bu?.name || (app && typeof app.businessUnitId === "object" ? app.businessUnitId.name : "");

  const deptId = app ? (typeof app.departmentId === "string" ? app.departmentId : app.departmentId?._id) : null;

  const { data: departments = [] } = useQuery({
    queryKey: ["departments", buId],
    queryFn: () => departmentService.getDepartmentsByBusinessUnit(buId!),
    enabled: !!buId,
  });

  const deptName = deptId
    ? departments.find((d) => d._id === deptId)?.name || (typeof app?.departmentId === "object" ? app.departmentId.name : "")
    : "";

  const [isLaunching, setIsLaunching] = React.useState(false);
  const [launchError, setLaunchError] = React.useState<string | null>(null);
  const [isSsoNoticeOpen, setIsSsoNoticeOpen] = React.useState(false);

  const handleLaunch = async () => {
    if (!app) return;
    if (app.comingSoon) return;
    if (app.ssoEndpoint && !user?.microsoftId) {
      setIsSsoNoticeOpen(true);
      return;
    }
    setIsLaunching(true);
    setLaunchError(null);
    try {
      const res = await launchApp(app._id);
      if (res.launchUrl) window.open(res.launchUrl, "_blank", "noopener,noreferrer");
    } catch {
      setLaunchError("Failed to launch application. Please try again.");
    } finally {
      setIsLaunching(false);
    }
  };

  const pageClasses = "mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8";

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!app) {
    return (
      <div className={pageClasses}>
        <Alert variant="danger">
          <AlertTitle>Application not found.</AlertTitle>
          <AlertDescription>
            <Link to="/dashboard" className={linkVariants()}>
              Return to Dashboard
            </Link>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const infoItems: { icon: LucideIcon; key: string; val: string }[] = [
    { icon: Layers, key: "Application Name", val: app.name },
    { icon: Code2, key: "Version", val: "4.2.0" },
    { icon: Tag, key: "Category", val: categoryLabels[app.category] },
    { icon: Building2, key: "Business Unit", val: buName || "—" },
    ...(deptName ? [{ icon: Briefcase, key: "Department", val: deptName }] : []),
    {
      icon: Clock,
      key: "Last Updated",
      val: new Date(app.updatedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    },
  ];

  return (
    <div className={pageClasses}>
      <Breadcrumb aria-label="Breadcrumb">
        <BreadcrumbItem>
          <BreadcrumbRouterLink to="/dashboard">Dashboard</BreadcrumbRouterLink>
        </BreadcrumbItem>
        {buId && (
          <BreadcrumbItem>
            <BreadcrumbRouterLink to={`/business-unit/${buId}`}>
              {buName}
            </BreadcrumbRouterLink>
          </BreadcrumbItem>
        )}
        <BreadcrumbItem last>
          <BreadcrumbPage>{app.name}</BreadcrumbPage>
        </BreadcrumbItem>
      </Breadcrumb>

      <Card>
        <CardContent className="flex flex-col gap-5 p-5 sm:flex-row sm:items-start sm:gap-6 sm:p-7">
          <Avatar name={app.name} src={app.iconUrl} size="lg" decorative />

          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="accent">{categoryLabels[app.category]}</Badge>
              <Badge variant={app.comingSoon ? "neutral" : "success"}>
                {app.comingSoon ? "Coming Soon" : "Online"}
              </Badge>
              <Badge variant="neutral">v4.2.0</Badge>
            </div>
            <h1 className="text-2xl font-bold text-text">{app.name}</h1>
            <p className="max-w-prose text-text-muted">{app.description}</p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                variant="accent"
                onClick={handleLaunch}
                disabled={isLaunching || app.comingSoon}
              >
                {isLaunching ? (
                  "Launching…"
                ) : (
                  <>
                    <ExternalLink size={16} aria-hidden="true" />
                    {app.comingSoon ? "Coming Soon" : "Launch Application"}
                  </>
                )}
              </Button>
              {buId && (
                <Link
                  to={`/business-unit/${buId}`}
                  className={buttonVariants({ variant: "outline" })}
                >
                  <ArrowLeft size={16} aria-hidden="true" />
                  Back to {buName}
                </Link>
              )}
            </div>
            {launchError && (
              <Alert variant="danger">
                <AlertDescription>{launchError}</AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle as="h2">Application Info</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            {infoItems.map(({ icon: Icon, key, val }) => (
              <div key={key} className="flex items-start gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-control bg-surface-muted text-text">
                  <Icon size={16} aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <dt className="text-xs text-text-muted">{key}</dt>
                  <dd className="break-words font-semibold text-text">{val}</dd>
                </div>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      {deptName && (
        <Card>
          <CardHeader>
            <CardTitle as="h2">Assigned Departments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-3 rounded-control bg-surface-muted p-3">
              <div className="min-w-0">
                <p className="font-medium text-text">{deptName}</p>
                <p className="text-xs text-text-muted">{buName}</p>
              </div>
              <Badge variant="success">Active</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      <NoticeModal
        isOpen={isSsoNoticeOpen}
        title="Microsoft SSO Required"
        message="This application requires Microsoft SSO. Please sign in with Microsoft to access."
        onClose={() => setIsSsoNoticeOpen(false)}
      />
    </div>
  );
};

export default ApplicationDetails;
