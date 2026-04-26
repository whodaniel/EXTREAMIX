import { Purchases } from "@revenuecat/purchases-js";

// Ensure this matches the key provided by the user
const apiKey = import.meta.env.VITE_REVENUECAT_PUBLIC_KEY || "test_ITxRpLmmpSGKyollhSyQTqPXMhP";

export const getOrCreateUserId = () => {
  let userId = localStorage.getItem('extreamix_rc_user_id');
  if (!userId || userId === '[Not provided]' || userId === 'null' || userId === 'undefined' || userId.length < 5) {
    const fallbackId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `extreamix_user_${Math.random().toString(36).substring(2, 15)}`;
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

export function checkExtreamixProStatus(customerInfo: any) {
  if (customerInfo && customerInfo.entitlements && customerInfo.entitlements.active["Extreamix Pro"]) {
    console.log("Access Granted: Extreamix Pro features unlocked.");
    return true;
  } else {
    console.log("User is on the free Pulse tier.");
    return false;
  }
}

export async function handlePurchase(selectedPackage: any) {
  try {
    // Triggers the web checkout flow
    const { customerInfo } = await purchases.purchasePackage({
      package: selectedPackage
    });

    // Immediately verify if the purchase unlocked the correct entitlement
    return checkExtreamixProStatus(customerInfo);
  } catch (error: any) {
    if (!error.userCancelled) {
      console.error("Purchase failed:", error.message);
    }
    throw error;
  }
}

export async function refreshCustomerStatus() {
  try {
    const customerInfo = await purchases.getCustomerInfo();
    return checkExtreamixProStatus(customerInfo);
  } catch (error) {
    console.error("Failed to retrieve customer info:", error);
    return false;
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

