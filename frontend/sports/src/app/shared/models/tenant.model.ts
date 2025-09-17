export interface TenantSummary {
  id: number;
  name: string;
  slug: string;
  logo_url: string | null;
  theme_primary: string | null;
  theme_secondary: string | null;
  address: string | null;
  contact_email: string | null;
  is_active?: boolean;
}

export interface OwnerSummary {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
}

export interface TenantDetail extends TenantSummary {
  owners?: OwnerSummary[];
  owners_count?: number;
}
