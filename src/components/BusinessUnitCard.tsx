import React from "react";
import { useNavigate } from "react-router-dom";
import { Building2 } from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@odessa-separator/ui";
import { BusinessUnit } from "../types/businessUnit.types";

interface BusinessUnitCardProps {
  businessUnit: BusinessUnit;
}

const BusinessUnitCard: React.FC<BusinessUnitCardProps> = ({
  businessUnit,
}) => {
  const navigate = useNavigate();
  const [logoFailed, setLogoFailed] = React.useState(false);

  const handleClick = () => {
    navigate(`/business-unit/${businessUnit._id}`);
  };

  const showLogo = Boolean(businessUnit.logoUrl) && !logoFailed;

  return (
    // Pointer convenience only: the "View Details" button is the keyboard and
    // screen-reader target, and its click bubbles up to this handler.
    <Card
      onClick={handleClick}
      className="flex h-full cursor-pointer flex-col"
    >
      <CardHeader className="items-center">
        <div className="flex size-20 items-center justify-center overflow-hidden rounded-control bg-surface-muted text-text sm:size-24">
          {showLogo ? (
            <img
              src={businessUnit.logoUrl}
              alt={`${businessUnit.name} logo`}
              className="size-full object-contain p-2"
              width="96"
              height="96"
              loading="lazy"
              onError={() => setLogoFailed(true)}
            />
          ) : (
            <Building2 size={44} aria-hidden="true" />
          )}
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-2 text-center">
        <CardTitle className="line-clamp-2">{businessUnit.name}</CardTitle>
        <CardDescription className="line-clamp-3">
          {businessUnit.description}
        </CardDescription>
      </CardContent>

      <CardFooter>
        <Button className="w-full" arrow>
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
};

export default BusinessUnitCard;
