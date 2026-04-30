import { useEffect, useState } from "react";

export type Platform =
  | "ios"
  | "android"
  | "desktop-chrome"
  | "desktop-edge"
  | "desktop-safari"
  | "desktop-firefox"
  | "other";

export type Browser =
  | "safari"
  | "chrome"
  | "edge"
  | "firefox"
  | "samsung"
  | "other";

export interface PlatformInfo {
  platform: Platform;
  browser: Browser;
  isStandalone: boolean;
  isMobile: boolean;
}

const detect = (): PlatformInfo => {
  if (typeof window === "undefined") {
    return { platform: "other", browser: "other", isStandalone: false, isMobile: false };
  }
  const ua = navigator.userAgent || "";
  const uaLower = ua.toLowerCase();

  const isStandalone =
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // iOS Safari
    (window.navigator as unknown as { standalone?: boolean }).standalone === true;

  const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream;
  const isAndroid = /android/i.test(ua);

  let browser: Browser = "other";
  if (/SamsungBrowser/i.test(ua)) browser = "samsung";
  else if (/edg\//i.test(uaLower)) browser = "edge";
  else if (/firefox|fxios/i.test(uaLower)) browser = "firefox";
  else if (/chrome|crios/i.test(uaLower) && !/edg\//i.test(uaLower)) browser = "chrome";
  else if (/safari/i.test(uaLower) && !/chrome|crios|android/i.test(uaLower)) browser = "safari";

  let platform: Platform = "other";
  if (isIOS) platform = "ios";
  else if (isAndroid) platform = "android";
  else if (browser === "chrome") platform = "desktop-chrome";
  else if (browser === "edge") platform = "desktop-edge";
  else if (browser === "safari") platform = "desktop-safari";
  else if (browser === "firefox") platform = "desktop-firefox";

  return { platform, browser, isStandalone, isMobile: isIOS || isAndroid };
};

export const usePlatformDetection = (): PlatformInfo => {
  const [info, setInfo] = useState<PlatformInfo>(detect);

  useEffect(() => {
    setInfo(detect());
    const mql = window.matchMedia?.("(display-mode: standalone)");
    if (!mql) return;
    const handler = () => setInfo(detect());
    mql.addEventListener?.("change", handler);
    return () => mql.removeEventListener?.("change", handler);
  }, []);

  return info;
};
