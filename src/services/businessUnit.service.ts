import api from "./api";
import {
  BusinessUnit,
  CreateBusinessUnitDTO,
  UpdateBusinessUnitDTO,
} from "../types/businessUnit.types";

export const businessUnitService = {
  async getAllBusinessUnits(): Promise<BusinessUnit[]> {
    const response = await api.get("/business-units");
    return response.data;
  },

  async getActiveBusinessUnits(): Promise<BusinessUnit[]> {
    const response = await api.get("/business-units/active");
    return response.data;
  },

  async getBusinessUnitById(id: string): Promise<BusinessUnit> {
    const response = await api.get(`/business-units/${id}`);
    return response.data;
  },

  async createBusinessUnit(data: CreateBusinessUnitDTO): Promise<BusinessUnit> {
    const response = await api.post("/business-units", data);
    return response.data;
  },

  async updateBusinessUnit(
    id: string,
    data: UpdateBusinessUnitDTO,
  ): Promise<BusinessUnit> {
    const response = await api.put(`/business-units/${id}`, data);
    return response.data;
  },

  async deleteBusinessUnit(id: string): Promise<void> {
    await api.delete(`/business-units/${id}`);
  },
};
