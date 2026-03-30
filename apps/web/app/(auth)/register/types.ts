export type Role = "trainer" | "client" | null;

export interface PromoValidation {
  valid: boolean;
  trainer_name?: string;
  trainer_id?: string;
  promo_code_id?: string;
  error?: string;
  loading: boolean;
}
