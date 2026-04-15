import { useEffect } from "react";
import { useLocation } from "react-router-dom";

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    gtag?: (...args: any[]) => void;
  }
}

export function useTracking() {
  const location = useLocation();

  // Track page view on every route change
  useEffect(() => {
    trackPageView(location.pathname);
  }, [location.pathname]);

  return { trackLead, trackTrial, trackPageView };
}

function trackPageView(path: string) {
  // Meta Pixel
  if (window.fbq) {
    window.fbq("track", "PageView");
  }
  // GA4
  if (window.gtag) {
    window.gtag("event", "page_view", { page_path: path, send_to: "G-117MVSM8LG" });
  }
}

export function trackLead(email: string) {
  if (window.fbq) {
    window.fbq("track", "Lead", { content_name: email });
  }
  if (window.gtag) {
    window.gtag("event", "generate_lead", { email });
  }
}

export function trackTrial() {
  if (window.fbq) {
    window.fbq("track", "StartTrial", { currency: "BRL", value: 0 });
  }
  if (window.gtag) {
    window.gtag("event", "start_trial");
  }
}

export function trackRegistration() {
  if (window.gtag) {
    window.gtag("event", "conversion", {
      send_to: "AW-8171369367/register",
      value: 1.0,
      currency: "BRL",
    });
  }
  if (window.fbq) {
    window.fbq("track", "CompleteRegistration");
  }
}

export function trackCheckoutStart(planName: string, value: number) {
  if (window.gtag) {
    window.gtag("event", "begin_checkout", {
      send_to: "AW-8171369367/checkout",
      value,
      currency: "BRL",
      items: [{ item_name: planName }],
    });
  }
  if (window.fbq) {
    window.fbq("track", "InitiateCheckout", { currency: "BRL", value });
  }
}

export function trackPurchase(value: number) {
  if (window.gtag) {
    window.gtag("event", "conversion", {
      send_to: "AW-8171369367/purchase",
      value,
      currency: "BRL",
    });
    window.gtag("event", "purchase", { value, currency: "BRL" });
  }
  if (window.fbq) {
    window.fbq("track", "Purchase", { currency: "BRL", value });
  }
}

export function trackCtaClick(ctaName: string, location: string) {
  if (window.gtag) {
    window.gtag("event", "cta_click", {
      cta_name: ctaName,
      cta_location: location,
      send_to: "G-117MVSM8LG",
    });
  }
  if (window.fbq) {
    window.fbq("trackCustom", "CtaClick", { cta_name: ctaName, cta_location: location });
  }
}
