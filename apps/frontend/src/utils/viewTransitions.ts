import { flushSync } from "react-dom";
import type { NavigateFunction, NavigateOptions, To } from "react-router-dom";

import { preloadRouteModule } from "../routes/routeModules";

type ViewTransitionHandle = {
  finished: Promise<void>;
  ready: Promise<void>;
  updateCallbackDone: Promise<void>;
  skipTransition?: () => void;
};

type DocumentWithViewTransition = Document & {
  startViewTransition?: (callback: () => void) => ViewTransitionHandle;
};

const supportsViewTransitions = () => {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return false;
  }

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return false;
  }

  return typeof (document as DocumentWithViewTransition).startViewTransition === "function";
};

export const runViewTransition = (update: () => void) => {
  if (!supportsViewTransitions()) {
    update();
    return;
  }

  const transitionDocument = document as DocumentWithViewTransition;
  transitionDocument.startViewTransition?.(() => {
    flushSync(() => {
      update();
    });
  });
};

export const navigateWithViewTransition = (
  navigate: NavigateFunction,
  to: To,
  options?: NavigateOptions,
) => {
  if (typeof to === "string" && to.startsWith("/")) {
    void preloadRouteModule(to);
  }

  runViewTransition(() => {
    navigate(to, options);
  });
};
