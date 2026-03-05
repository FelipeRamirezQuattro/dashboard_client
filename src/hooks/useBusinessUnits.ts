import { useQuery } from "@tanstack/react-query";
import { businessUnitService } from "../services/businessUnit.service";

export const useBusinessUnits = () => {
  return useQuery({
    queryKey: ["businessUnits"],
    queryFn: () => businessUnitService.getActiveBusinessUnits(),
  });
};

export const useBusinessUnit = (id: string) => {
  return useQuery({
    queryKey: ["businessUnit", id],
    queryFn: () => businessUnitService.getBusinessUnitById(id),
    enabled: !!id,
  });
};
