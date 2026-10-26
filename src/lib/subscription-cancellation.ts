export interface SubscriptionCancellationOption {
  membershipId: string;
  price: string | null;
  renewalPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  isTrialing: boolean;
}
