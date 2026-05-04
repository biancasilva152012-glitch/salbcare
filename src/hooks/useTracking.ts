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

export function trackCtaClick(ctaName: string, location: string, extras: Record<string, unknown> = {}) {
  const payload = { cta_name: ctaName, cta_location: location, ...extras };
  if (window.gtag) {
    window.gtag("event", "cta_click", { ...payload, send_to: "G-117MVSM8LG" });
  }
  if (window.fbq) {
    window.fbq("trackCustom", "CtaClick", payload);
  }
}

/**
 * Unified event helper — fires the SAME event name with the SAME payload
 * to BOTH GA4 (gtag) and Meta Pixel (fbq trackCustom). Use for funnel
 * events that need 1:1 parity across platforms (checkout_started,
 * checkout_redirecting, checkout_error, subscription_confirmed, etc.).
 */
export function trackUnified(eventName: string, payload: Record<string, unknown> = {}) {
  if (window.gtag) {
    window.gtag("event", eventName, { ...payload, send_to: "G-117MVSM8LG" });
  }
  if (window.fbq) {
    window.fbq("trackCustom", eventName, payload);
  }
}

export function trackViewContent(contentName: string, category: string, value?: number) {
  const payload: Record<string, unknown> = { content_name: contentName, content_category: category };
  if (typeof value === "number") {
    payload.value = value;
    payload.currency = "BRL";
  }
  if (window.fbq) window.fbq("track", "ViewContent", payload);
  if (window.gtag) window.gtag("event", "view_content", { ...payload, send_to: "G-117MVSM8LG" });
}

export function trackLeadIntent(contentName: string, value = 89) {
  const payload = { content_name: contentName, value, currency: "BRL" };
  if (window.fbq) window.fbq("track", "Lead", payload);
  if (window.gtag) window.gtag("event", "generate_lead", payload);
}

let scrolledHalfwayFired = false;
export function setupScrolledHalfwayTracking() {
  if (typeof window === "undefined") return () => {};
  scrolledHalfwayFired = false;
  const handler = () => {
    const scrollable = document.body.scrollHeight - window.innerHeight;
    if (scrollable <= 0) return;
    const pct = (window.scrollY / scrollable) * 100;
    if (pct > 50 && !scrolledHalfwayFired) {
      scrolledHalfwayFired = true;
      const payload = { page: window.location.pathname };
      if (window.fbq) window.fbq("trackCustom", "ScrolledHalfway", payload);
      if (window.gtag) window.gtag("event", "scrolled_halfway", { ...payload, send_to: "G-117MVSM8LG" });
      window.removeEventListener("scroll", handler);
    }
  };
  window.addEventListener("scroll", handler, { passive: true });
  return () => window.removeEventListener("scroll", handler);
}

export function trackLimitWarning(eventName: string, count: number) {
  if (window.gtag) {
    window.gtag("event", eventName, {
      patient_count: count,
      send_to: "G-117MVSM8LG",
    });
  }
  if (window.fbq) {
    window.fbq("trackCustom", "LimitWarning", { event: eventName, patient_count: count });
  }
}
