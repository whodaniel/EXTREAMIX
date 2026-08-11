import { Purchases } from "@revenuecat/purchases-js";

const apiKey = import.meta.env.VITE_REVENUECAT_PUBLIC_KEY;
if (!apiKey) {
  throw new Error("VITE_REVENUECAT_PUBLIC_KEY environment variable is required.");
}

// --- Entitlement Identifiers (must match RevenueCat dashboard) ---
export const ENTITLEMENTS = {
  PRO: "Extreamix Pro",
  AI_FILTER_FORGE: "ai_filter_forge",
  AI_SYNTH_SCAFFOLDER: "ai_feature_pack",
  SPATIAL_AUDIO: "spatial_audio_pack",
  AI_THEME_FORGE: "ai_theme_forge",
} as const;

export type EntitlementKey = (typeof ENTITLEMENTS)[keyof typeof ENTITLEMENTS];

// --- User Identity ---
export const getOrCreateUserId = (): string => {
  let userId = localStorage.getItem("extreamix_rc_user_id");
  if (!userId || userId === "[Not provided]" || userId === "null" || userId === "undefined" || userId.length < 5) {
    userId = Purchases.generateRevenueCatAnonymousAppUserId();
    localStorage.setItem("extreamix_rc_user_id", userId);
  }
  return userId;
};

// --- SDK Initialization ---
export const purchases = Purchases.configure({
  apiKey,
  appUserId: getOrCreateUserId(),
});

export async function authenticateUser(userId: string): Promise<void> {
  try {
    await purchases.changeUser(userId);
  } catch (error) {
    console.error("Failed to log in to RevenueCat:", error);
  }
}

// --- Offerings & Packages ---
export async function loadPaywallData() {
  try {
    const offerings = await purchases.getOfferings();
    if (offerings.current !== null) {
      return offerings.current.availablePackages;
    }
  } catch (error) {
    console.error("Error fetching offerings:", error);
  }
  return [];
}

// --- Entitlement Checks ---
export function checkExtreamixProStatus(customerInfo: any): boolean {
  return !!(customerInfo?.entitlements?.active?.[ENTITLEMENTS.PRO]);
}

export function checkEntitlement(customerInfo: any, entitlementKey: string): boolean {
  // Pro grants access to everything
  if (checkExtreamixProStatus(customerInfo)) return true;
  return !!(customerInfo?.entitlements?.active?.[entitlementKey]);
}

export function getActiveEntitlements(customerInfo: any): string[] {
  return Object.keys(customerInfo?.entitlements?.active || {});
}

// --- Purchase Flow ---
export async function handlePurchase(): Promise<boolean> {
  try {
    const { customerInfo } = await purchases.presentPaywall({
      htmlTarget: undefined, // full screen overlay
    });
    return checkExtreamixProStatus(customerInfo);
  } catch (error: any) {
    if (!error.userCancelled) {
      console.error("Purchase failed:", error.message);
    }
    throw error;
  }
}

export async function handlePurchaseAddon(offeringId?: string): Promise<{ customerInfo: any; success: boolean }> {
  try {
    const offerings = await purchases.getOfferings();

    // Try to find the specific offering, or fall back to current
    const offering = offeringId
      ? offerings.all[offeringId] || offerings.current
      : offerings.current;

    if (!offering) {
      throw new Error("No offering available for purchase.");
    }

    const { customerInfo } = await purchases.presentPaywall({
      htmlTarget: undefined,
      offering,
    });

    return { customerInfo, success: true };
  } catch (error: any) {
    if (!error.userCancelled) {
      console.error("Addon purchase failed:", error.message);
    }
    throw error;
  }
}

// --- Customer Info ---
export async function refreshCustomerStatus(): Promise<{
  isPro: boolean;
  activeEntitlements: string[];
  customerInfo: any;
}> {
  try {
    const customerInfo = await purchases.getCustomerInfo();
    const isPro = checkExtreamixProStatus(customerInfo);
    const activeEntitlements = getActiveEntitlements(customerInfo);
    return { isPro, activeEntitlements, customerInfo };
  } catch (error) {
    console.error("Failed to retrieve customer info:", error);
    return { isPro: false, activeEntitlements: [], customerInfo: null };
  }
}

export async function getManagementURL(): Promise<string | null> {
  try {
    const customerInfo = await purchases.getCustomerInfo();
    return customerInfo.managementURL || null;
  } catch (error) {
    return null;
  }
}

// --- Subscription Metadata for ProfileView ---
export async function getSubscriptionDetails(): Promise<{
  isPro: boolean;
  activeEntitlements: string[];
  planName: string;
  expirationDate: string | null;
  willRenew: boolean;
  managementURL: string | null;
}> {
  try {
    const customerInfo = await purchases.getCustomerInfo();
    const isPro = checkExtreamixProStatus(customerInfo);
    const activeEntitlements = getActiveEntitlements(customerInfo);

    // Determine plan name from active entitlements
    let planName = "Pulse (Free)";
    if (isPro) {
      // Check if it's annual (Broadcast) or monthly (Studio)
      const proEntitlement = customerInfo.entitlements.active[ENTITLEMENTS.PRO];
      const productIdentifier = proEntitlement?.productIdentifier || "";
      if (productIdentifier.includes("annual") || productIdentifier.includes("yearly") || productIdentifier.includes("broadcast")) {
        planName = "Broadcast";
      } else {
        planName = "Studio";
      }
    }

    // Get expiration/renewal info from the Pro entitlement
    const proEntitlement = customerInfo.entitlements.active[ENTITLEMENTS.PRO];
    const expirationDate = proEntitlement?.expirationDate || null;
    const willRenew = proEntitlement?.willRenew || false;
    const managementURL = customerInfo.managementURL || null;

    return { isPro, activeEntitlements, planName, expirationDate, willRenew, managementURL };
  } catch (error) {
    console.error("Failed to get subscription details:", error);
    return {
      isPro: false,
      activeEntitlements: [],
      planName: "Pulse (Free)",
      expirationDate: null,
      willRenew: false,
      managementURL: null,
    };
  }
}
