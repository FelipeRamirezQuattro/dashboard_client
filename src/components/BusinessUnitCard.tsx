import React from "react";
import { useNavigate } from "react-router-dom";
import { BusinessUnit } from "../types/businessUnit.types";

interface BusinessUnitCardProps {
  businessUnit: BusinessUnit;
}

const BusinessUnitCard: React.FC<BusinessUnitCardProps> = ({
  businessUnit,
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/business-unit/${businessUnit._id}`);
  };

  return (
    <div
      onClick={handleClick}
      className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer group"
    >
      {/* Logo Section */}
      <div className="flex justify-center mb-4">
        {businessUnit.logoUrl ? (
          <div className="h-24 w-24 rounded-xl overflow-hidden bg-slate-50 flex items-center justify-center group-hover:scale-105 transition-transform">
            <img
              src={businessUnit.logoUrl}
              alt={`${businessUnit.name} logo`}
              className="h-full w-full object-contain p-2"
              onError={(e) => {
                // Fallback if image fails to load
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
                target.parentElement!.innerHTML = `
                  <span class="material-symbols-outlined text-5xl text-slate-400">
                    business
                  </span>
                `;
              }}
            />
          </div>
        ) : (
          <div className="h-24 w-24 rounded-xl bg-osi-primary/10 flex items-center justify-center text-osi-primary group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-5xl">business</span>
          </div>
        )}
      </div>

      {/* Business Unit Name */}
      <h3 className="text-xl font-bold text-slate-900 mb-2 text-center">
        {businessUnit.name}
      </h3>

      {/* Description */}
      <p className="text-sm text-slate-500 line-clamp-3 mb-6 text-center flex-grow">
        {businessUnit.description}
      </p>

      {/* View Button */}
      <div className="mt-auto">
        <button className="w-full bg-osi-primary hover:bg-osi-primary/90 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors">
          <span>View Details</span>
          <span className="material-symbols-outlined text-sm">
            arrow_forward
          </span>
        </button>
      </div>
    </div>
  );
};

export default BusinessUnitCard;
