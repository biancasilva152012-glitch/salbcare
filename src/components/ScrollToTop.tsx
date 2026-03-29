import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Scrolls to the top of the page on every route change.
 */
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Instant scroll on route change to avoid jarring delayed scroll
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

export default ScrollToTop;
