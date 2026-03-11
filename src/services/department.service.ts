import api from "./api";
import {
  Department,
  CreateDepartmentDTO,
  UpdateDepartmentDTO,
} from "../types/department.types";

export const departmentService = {
  async getAllDepartments(): Promise<Department[]> {
    const response = await api.get("/departments");
    return Array.isArray(response.data) ? response.data : [];
  },

  async getActiveDepartments(): Promise<Department[]> {
    const response = await api.get("/departments/active");
    return Array.isArray(response.data) ? response.data : [];
  },

  async getDepartmentById(id: string): Promise<Department> {
    const response = await api.get(`/departments/${id}`);
    return response.data;
  },

  async getDepartmentsByBusinessUnit(buId: string): Promise<Department[]> {
    const response = await api.get(`/departments/by-business-unit/${buId}`);
    return Array.isArray(response.data) ? response.data : [];
  },

  async createDepartment(data: CreateDepartmentDTO): Promise<Department> {
    const response = await api.post("/departments", data);
    return response.data;
  },

  async updateDepartment(
    id: string,
    data: UpdateDepartmentDTO,
  ): Promise<Department> {
    const response = await api.put(`/departments/${id}`, data);
    return response.data;
  },

  async deleteDepartment(id: string): Promise<void> {
    await api.delete(`/departments/${id}`);
  },
};
