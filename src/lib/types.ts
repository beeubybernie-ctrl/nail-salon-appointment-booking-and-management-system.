export interface ServiceOption {
  id: string;
  name: string;
  price: number;
  duration: number;
  isPerNail: boolean;
}

export interface CategoryOption {
  categoryName: string;
  services: ServiceOption[];
}
