import React, { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, LayoutGrid } from "lucide-react";
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
  EmptyState,
  linkVariants,
  SectionHeader,
  StatBand,
  StatBandItem,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@odessa-separator/ui";
import { useBusinessUnit } from "../hooks/useBusinessUnits";
import { departmentService } from "../services/department.service";
import { getApps } from "../services/apps.service";
import { useLaunchApp } from "../hooks/useApps";
import { useAuth } from "../hooks/useAuth";
import LoadingSpinner from "../components/LoadingSpinner";
import { IExternalApp, categoryLabels } from "../types/app.types";
import { AppCardSkeleton } from "../components/SkeletonLoader";
import NoticeModal from "../components/NoticeModal";
import BreadcrumbRouterLink from "../components/BreadcrumbRouterLink";

const ALL_DEPARTMENTS = "all";

interface AppListItemProps {
  app: IExternalApp;
}

const AppListItem: React.FC<AppListItemProps> = ({ app }) => {
  const { mutate: launchApp, isPending } = useLaunchApp();
  const { user } = useAuth();
  const [isSsoNoticeOpen, setIsSsoNoticeOpen] = useState(false);

  const handleLaunch = () => {
    if (app.comingSoon) return;
    if (app.ssoEndpoint && !user?.microsoftId) {
      setIsSsoNoticeOpen(true);
      return;
    }
    launchApp(app._id);
  };

  return (
    <>
      <Card className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
        <Avatar name={app.name} src={app.iconUrl} size="lg" decorative />

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="neutral">{categoryLabels[app.category]}</Badge>
            <Badge variant={app.comingSoon ? "neutral" : "success"}>
              {app.comingSoon ? "Coming Soon" : "Online"}
            </Badge>
            <Badge variant="neutral">v4.2.0</Badge>
          </div>
          <h3 className="font-semibold text-text">{app.name}</h3>
          <p className="line-clamp-2 text-sm text-text-muted">
            {app.description}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Link
            to={`/app/${app._id}`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Details
          </Link>
          <Button
            size="sm"
            variant="accent"
            onClick={handleLaunch}
            disabled={isPending || app.comingSoon}
          >
            {isPending ? (
              "Launching…"
            ) : (
              <>
                <ExternalLink size={14} aria-hidden="true" />
                {app.comingSoon ? "Coming Soon" : "Launch"}
              </>
            )}
          </Button>
        </div>
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

const BusinessUnitView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);

  const { data: businessUnit, isLoading: isLoadingBU, error: errorBU } = useBusinessUnit(id!);

  const { data: departments, error: errorDepts } = useQuery({
    queryKey: ["departments", id],
    queryFn: () => departmentService.getDepartmentsByBusinessUnit(id!),
    enabled: !!id,
  });

  const { data: allApps, isLoading: isLoadingApps, error: errorApps } = useQuery({
    queryKey: ["apps"],
    queryFn: getApps,
  });

  const filteredApps = useMemo(() => {
    if (!allApps || !Array.isArray(allApps)) return [];
    let filtered = allApps.filter((app: IExternalApp) => {
      if (!app.businessUnitId) return false;
      const buId = typeof app.businessUnitId === "string" ? app.businessUnitId : app.businessUnitId._id;
      return buId === id && app.isActive;
    });
    if (selectedDepartment) {
      filtered = filtered.filter((app: IExternalApp) => {
        if (!app.departmentId) return false;
        const deptId = typeof app.departmentId === "string" ? app.departmentId : app.departmentId._id;
        return deptId === selectedDepartment;
      });
    }
    return filtered;
  }, [allApps, id, selectedDepartment]);

  const appsByDepartment = useMemo(() => {
    if (!allApps || !Array.isArray(allApps)) return {};
    const grouped: Record<string, number> = {};
    allApps.forEach((app: IExternalApp) => {
      if (!app.businessUnitId || !app.isActive) return;
      const buId = typeof app.businessUnitId === "string" ? app.businessUnitId : app.businessUnitId._id;
      if (buId !== id) return;
      if (!app.departmentId) return;
      const deptId = typeof app.departmentId === "string" ? app.departmentId : app.departmentId._id;
      grouped[deptId] = (grouped[deptId] || 0) + 1;
    });
    return grouped;
  }, [allApps, id]);

  const error = errorBU || errorDepts || errorApps;

  const pageClasses = "mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8";

  if (isLoadingBU) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !businessUnit) {
    return (
      <div className={pageClasses}>
        <Alert variant="danger">
          <AlertTitle>Failed to load business unit details.</AlertTitle>
          <AlertDescription>
            <Link to="/dashboard" className={linkVariants()}>
              Return to Dashboard
            </Link>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const activeTab = selectedDepartment ?? ALL_DEPARTMENTS;
  const hasDepartments =
    Array.isArray(departments) && departments.filter((d) => d != null).length > 0;

  const appList = isLoadingApps ? (
    <div className="space-y-3" aria-busy="true">
      {[...Array(3)].map((_, i) => (
        <AppCardSkeleton key={i} />
      ))}
    </div>
  ) : filteredApps.length === 0 ? (
    <EmptyState
      icon={<LayoutGrid size={40} />}
      title="No applications found"
      titleAs="h3"
    />
  ) : (
    <div className="space-y-3">
      {filteredApps.map((app) => (
        <AppListItem key={app._id} app={app} />
      ))}
    </div>
  );

  return (
    <div className={pageClasses}>
      <Breadcrumb aria-label="Breadcrumb">
        <BreadcrumbItem>
          <BreadcrumbRouterLink to="/dashboard">Dashboard</BreadcrumbRouterLink>
        </BreadcrumbItem>
        <BreadcrumbItem last>
          <BreadcrumbPage>{businessUnit.name}</BreadcrumbPage>
        </BreadcrumbItem>
      </Breadcrumb>

      <SectionHeader
        as="h1"
        title={businessUnit.name}
        description={businessUnit.description}
      />

      <StatBand role="group" aria-label="Application summary">
        <StatBandItem label="Total Apps" value={filteredApps.length} />
        <StatBandItem
          label="Online"
          value={filteredApps.filter((a) => !a.comingSoon).length}
        />
        <StatBandItem
          label="Coming Soon"
          value={filteredApps.filter((a) => a.comingSoon).length}
        />
      </StatBand>

      {hasDepartments ? (
        <Tabs
          value={activeTab}
          onValueChange={(value) =>
            setSelectedDepartment(value === ALL_DEPARTMENTS ? null : value)
          }
        >
          <TabsList aria-label="Filter by department" className="max-w-full overflow-x-auto">
            <TabsTrigger value={ALL_DEPARTMENTS}>All</TabsTrigger>
            {departments!
              .filter((d) => d != null)
              .map((dept) => (
                <TabsTrigger key={dept._id} value={dept._id}>
                  {`${dept.name} (${appsByDepartment[dept._id] || 0})`}
                </TabsTrigger>
              ))}
          </TabsList>
          <TabsContent value={activeTab} className="mt-4">
            {appList}
          </TabsContent>
        </Tabs>
      ) : (
        appList
      )}
    </div>
  );
};

export default BusinessUnitView;
