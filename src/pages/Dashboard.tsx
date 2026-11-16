import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  CardGrid,
  EmptyState,
  SectionHeader,
  StatBand,
  StatBandItem,
} from "@odessa-separator/ui";
import { Building2 } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useBusinessUnits } from "../hooks/useBusinessUnits";
import { getApps } from "../services/apps.service";
import { IExternalApp } from "../types/app.types";
import { BusinessUnit } from "../types/businessUnit.types";
import { BusinessUnitCardSkeleton } from "../components/SkeletonLoader";
import BusinessUnitCard from "../components/BusinessUnitCard";

const gridClasses = "sm:grid-cols-2 lg:grid-cols-3";

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { data: businessUnits, isLoading, error } = useBusinessUnits();

  const { data: apps = [] } = useQuery({ queryKey: ["apps"], queryFn: getApps });

  const { activeAppCount, appCountByBU } = React.useMemo(() => {
    const counts: Record<string, number> = {};
    let total = 0;
    (apps as IExternalApp[]).forEach((app) => {
      if (!app.isActive) return;
      total += 1;
      const buId =
        typeof app.businessUnitId === "string"
          ? app.businessUnitId
          : app.businessUnitId._id;
      counts[buId] = (counts[buId] || 0) + 1;
    });
    return { activeAppCount: total, appCountByBU: counts };
  }, [apps]);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-6 sm:px-6 sm:py-8">
      <SectionHeader
        as="h1"
        title={`Welcome back, ${user?.firstName ?? ""}!`}
        description="Monitor and manage your industrial separator operations"
      />

      {!isLoading && !error && businessUnits && (
        <StatBand role="group" aria-label="Overview">
          <StatBandItem label="Business Units" value={businessUnits.length} />
          <StatBandItem label="Active Applications" value={activeAppCount} />
        </StatBand>
      )}

      <section aria-labelledby="business-units-heading" className="space-y-4">
        <SectionHeader
          as="h2"
          id="business-units-heading"
          title="Business Units"
        />

        {isLoading ? (
          <CardGrid className={gridClasses}>
            {[...Array(3)].map((_, i) => (
              <BusinessUnitCardSkeleton key={i} />
            ))}
          </CardGrid>
        ) : error ? (
          <Alert variant="danger">
            <AlertTitle>Failed to load business units</AlertTitle>
            <AlertDescription>Please try again.</AlertDescription>
          </Alert>
        ) : !businessUnits || businessUnits.length === 0 ? (
          <EmptyState
            icon={<Building2 size={40} />}
            title="No business units available"
            titleAs="h3"
          />
        ) : (
          <CardGrid className={gridClasses}>
            {(businessUnits as BusinessUnit[]).map((bu) => (
              <BusinessUnitCard
                key={bu._id}
                businessUnit={bu}
                appCount={appCountByBU[bu._id] || 0}
                status="Active"
              />
            ))}
          </CardGrid>
        )}
      </section>
    </div>
  );
};

export default Dashboard;
