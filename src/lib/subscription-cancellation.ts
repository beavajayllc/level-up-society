export interface SubscriptionCancellationOption {
  membershipId: string;
  price: string;
  renewalPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}
