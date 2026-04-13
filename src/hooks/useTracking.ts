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
    window.gtag("event", "page_view", { page_path: path });
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
