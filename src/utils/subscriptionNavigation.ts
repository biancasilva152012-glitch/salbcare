export const SUBSCRIPTION_ROUTE_VERSION = __APP_VERSION__;

export function buildVersionedSubscriptionUrl() {
  const url = new URL("/subscription", window.location.origin);
  url.searchParams.set("v", SUBSCRIPTION_ROUTE_VERSION);
  return `${url.pathname}${url.search}`;
}

export function openVersionedSubscriptionRoute() {
  window.location.assign(buildVersionedSubscriptionUrl());
}
