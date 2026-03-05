export interface Department {
  _id: string;
  name: string;
  description: string;
  businessUnitId:
    | {
        _id: string;
        name: string;
      }
    | string;
  isActive: boolean;
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateDepartmentDTO {
  name: string;
  description: string;
  businessUnitId: string;
  isActive?: boolean;
}

export interface UpdateDepartmentDTO {
  name?: string;
  description?: string;
  businessUnitId?: string;
  isActive?: boolean;
}
