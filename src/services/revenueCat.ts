import { Purchases } from "@revenuecat/purchases-js";

// Ensure this matches the key provided by the user
const apiKey = import.meta.env.VITE_REVENUECAT_PUBLIC_KEY || "test_ITxRpLmmpSGKyollhSyQTqPXMhP";

export const getOrCreateUserId = () => {
  let userId = localStorage.getItem('extreamix_rc_user_id');
  if (!userId || userId === '[Not provided]' || userId === 'null' || userId === 'undefined' || userId.length < 5) {
    const fallbackId = Purchases.generateRevenueCatAnonymousAppUserId();
    userId = fallbackId;
    localStorage.setItem('extreamix_rc_user_id', userId);
  }
  return userId;
};

export const purchases = Purchases.configure({
  apiKey,
  appUserId: getOrCreateUserId(),
});

export async function authenticateUser(userId: string) {
  try {
    await purchases.changeUser(userId);
  } catch (error) {
    console.error("Failed to log in to RevenueCat:", error);
  }
}

export async function loadPaywallData() {
  try {
    const offerings = await purchases.getOfferings();
    if (offerings.current !== null) {
      // availablePackages contains Monthly, Yearly, and Lifetime setups
      return offerings.current.availablePackages;
    }
  } catch (error) {
    console.error("Error fetching offerings:", error);
  }
  return [];
}

export interface EntitlementStatus {
  hasPulseUnlock: boolean;
  hasStudio: boolean;
  hasBroadcast: boolean;
  isPro: boolean;
}

export function checkExtreamixProStatus(customerInfo: any): EntitlementStatus {
  const active = customerInfo?.entitlements?.active || {};
  
  const hasPulseUnlock = !!(active["pulse_tier_unlocked"] || active["ad_free_access"] || active["Extreamix Pro"]);
  const hasStudio = !!(active["studio_access"] || active["Extreamix Pro"]);
  const hasBroadcast = !!(active["broadcast_access"] || active["Extreamix Pro"]);
  const isPro = hasPulseUnlock || hasStudio || hasBroadcast;

  if (isPro) {
    console.log("Access Granted: Premium features unlocked.", { hasPulseUnlock, hasStudio, hasBroadcast });
  } else {
    console.log("User is on the free Pulse tier.");
  }
  
  return { hasPulseUnlock, hasStudio, hasBroadcast, isPro };
}

export async function handlePurchase(): Promise<EntitlementStatus> {
  try {
    const { customerInfo } = await purchases.presentPaywall({
      htmlTarget: undefined // full screen overlay
    });

    return checkExtreamixProStatus(customerInfo);
  } catch (error: any) {
    if (!error.userCancelled) {
      console.error("Purchase failed:", error.message);
    }
    throw error;
  }
}

export async function refreshCustomerStatus(): Promise<EntitlementStatus> {
  try {
    const customerInfo = await purchases.getCustomerInfo();
    return checkExtreamixProStatus(customerInfo);
  } catch (error) {
    console.error("Failed to retrieve customer info:", error);
    return { hasPulseUnlock: false, hasStudio: false, hasBroadcast: false, isPro: false };
  }
}

export async function getManagementURL() {
  try {
    const customerInfo = await purchases.getCustomerInfo();
    return customerInfo.managementURL;
  } catch (error) {
    return null;
  }
}

