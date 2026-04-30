import { useState, useEffect, useCallback } from "react";
import {
  getOrCreateUserId,
  authenticateUser,
  loadPaywallData,
  handlePurchase,
  handlePurchaseAddon,
  refreshCustomerStatus,
  getSubscriptionDetails,
  getManagementURL,
  ENTITLEMENTS,
  type EntitlementKey,
} from "../services/revenueCat";

export interface SubscriptionState {
  isPro: boolean;
  activeEntitlements: string[];
  packages: any[];
  isPurchasing: boolean;
  isLoading: boolean;
  planName: string;
  expirationDate: string | null;
  willRenew: boolean;
  managementURL: string | null;
  customerInfo: any;
}

export function useSubscription(): SubscriptionState & {
  purchase: () => Promise<boolean>;
  purchaseAddon: (offeringId?: string) => Promise<boolean>;
  refresh: () => Promise<void>;
  openManagement: () => Promise<void>;
  hasEntitlement: (key: string) => boolean;
} {
  const [state, setState] = useState<SubscriptionState>({
    isPro: false,
    activeEntitlements: [],
    packages: [],
    isPurchasing: false,
    isLoading: true,
    planName: "Pulse (Free)",
    expirationDate: null,
    willRenew: false,
    managementURL: null,
    customerInfo: null,
  });

  // Initialize RevenueCat on mount
  useEffect(() => {
    const initRC = async () => {
      try {
        const userId = getOrCreateUserId();
        await authenticateUser(userId);

        const { isPro, activeEntitlements, customerInfo } = await refreshCustomerStatus();
        const pkgs = await loadPaywallData();
        const details = await getSubscriptionDetails();

        setState((prev) => ({
          ...prev,
          isPro,
          activeEntitlements,
          packages: pkgs,
          isLoading: false,
          planName: details.planName,
          expirationDate: details.expirationDate,
          willRenew: details.willRenew,
          managementURL: details.managementURL,
          customerInfo,
        }));
      } catch (err) {
        console.error("RC Init Error", err);
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    };
    initRC();
  }, []);

  const refresh = useCallback(async () => {
    const { isPro, activeEntitlements, customerInfo } = await refreshCustomerStatus();
    const details = await getSubscriptionDetails();
    setState((prev) => ({
      ...prev,
      isPro,
      activeEntitlements,
      planName: details.planName,
      expirationDate: details.expirationDate,
      willRenew: details.willRenew,
      managementURL: details.managementURL,
      customerInfo,
    }));
  }, []);

  const purchase = useCallback(async (): Promise<boolean> => {
    setState((prev) => ({ ...prev, isPurchasing: true }));
    try {
      const success = await handlePurchase();
      await refresh();
      return success;
    } catch (e) {
      console.error("Purchase error", e);
      return false;
    } finally {
      setState((prev) => ({ ...prev, isPurchasing: false }));
    }
  }, [refresh]);

  const purchaseAddon = useCallback(
    async (offeringId?: string): Promise<boolean> => {
      setState((prev) => ({ ...prev, isPurchasing: true }));
      try {
        const { success } = await handlePurchaseAddon(offeringId);
        await refresh();
        return success;
      } catch (e) {
        console.error("Addon purchase error", e);
        return false;
      } finally {
        setState((prev) => ({ ...prev, isPurchasing: false }));
      }
    },
    [refresh]
  );

  const openManagement = useCallback(async () => {
    const url = await getManagementURL();
    if (url) {
      window.open(url, "_blank");
    } else {
      alert("Management URL not available yet. Please check again later or contact support.");
    }
  }, []);

  const hasEntitlement = useCallback(
    (key: string): boolean => {
      if (state.isPro) return true;
      return state.activeEntitlements.includes(key);
    },
    [state.isPro, state.activeEntitlements]
  );

  return {
    ...state,
    purchase,
    purchaseAddon,
    refresh,
    openManagement,
    hasEntitlement,
  };
}
