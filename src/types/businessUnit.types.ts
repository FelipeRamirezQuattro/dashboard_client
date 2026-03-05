export interface BusinessUnit {
  _id: string;
  name: string;
  description: string;
  logoUrl?: string;
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

export interface CreateBusinessUnitDTO {
  name: string;
  description: string;
  logoUrl?: string;
  isActive?: boolean;
}

export interface UpdateBusinessUnitDTO {
  name?: string;
  description?: string;
  logoUrl?: string;
  isActive?: boolean;
}
