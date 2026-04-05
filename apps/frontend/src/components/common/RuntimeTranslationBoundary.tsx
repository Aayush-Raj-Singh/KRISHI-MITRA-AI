import React, { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

import {
  normalizeRuntimeLanguage,
  shouldRuntimeTranslate,
  translateRuntimeStrings,
} from "../../utils/runtimeTranslation";

const ATTRIBUTE_NAMES = ["placeholder", "title", "aria-label", "aria-placeholder", "alt"] as const;
const EXCLUDED_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "IFRAME", "SVG", "PATH", "CODE", "PRE"]);

type TextTarget = {
  type: "text";
  node: Text;
  source: string;
};

type AttributeTarget = {
  type: "attribute";
  element: HTMLElement;
  name: (typeof ATTRIBUTE_NAMES)[number];
  source: string;
};

type Target = TextTarget | AttributeTarget;

const originalTextMap = new WeakMap<Text, string>();
const originalAttributeMap = new WeakMap<HTMLElement, Map<string, string>>();

const isElementExcluded = (element: Element | null) => {
  let current = element;
  while (current) {
    if (EXCLUDED_TAGS.has(current.tagName)) {
      return true;
    }
    if (current instanceof HTMLElement && current.dataset.noAutoTranslate === "true") {
      return true;
    }
    current = current.parentElement;
  }
  return false;
};

const collectTextTargets = (root: HTMLElement): TextTarget[] => {
  const targets: TextTarget[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (candidate) => {
      const node = candidate as Text;
      const parent = node.parentElement;
      if (!parent || isElementExcluded(parent)) {
        return NodeFilter.FILTER_REJECT;
      }
      const currentValue = node.nodeValue || "";
      const originalValue = originalTextMap.get(node) || currentValue;
      if (!originalTextMap.has(node)) {
        originalTextMap.set(node, currentValue);
      }
      if (!shouldRuntimeTranslate(originalValue)) {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    const source = originalTextMap.get(node) || node.nodeValue || "";
    if (shouldRuntimeTranslate(source)) {
      targets.push({ type: "text", node, source });
    }
  }

  return targets;
};

const collectAttributeTargets = (root: HTMLElement): AttributeTarget[] => {
  const targets: AttributeTarget[] = [];
  root.querySelectorAll<HTMLElement>("*").forEach((element) => {
    if (isElementExcluded(element)) {
      return;
    }

    const storedAttributes = originalAttributeMap.get(element) || new Map<string, string>();

    ATTRIBUTE_NAMES.forEach((name) => {
      const currentValue = element.getAttribute(name);
      if (!currentValue) {
        return;
      }
      if (!storedAttributes.has(name)) {
        storedAttributes.set(name, currentValue);
      }
      const source = storedAttributes.get(name) || currentValue;
      if (!shouldRuntimeTranslate(source)) {
        return;
      }
      targets.push({ type: "attribute", element, name, source });
    });

    if (storedAttributes.size > 0) {
      originalAttributeMap.set(element, storedAttributes);
    }
  });

  return targets;
};

const applyTargets = (targets: Target[], language: string, translations: Record<string, string>) => {
  const normalizedLanguage = normalizeRuntimeLanguage(language);

  targets.forEach((target) => {
    const nextValue =
      normalizedLanguage === "en" ? target.source : translations[target.source] || target.source;

    if (target.type === "text") {
      if ((target.node.nodeValue || "") !== nextValue) {
        target.node.nodeValue = nextValue;
      }
      return;
    }

    if (target.element.getAttribute(target.name) !== nextValue) {
      target.element.setAttribute(target.name, nextValue);
    }
  });
};

type RuntimeTranslationBoundaryProps = {
  routeSignature?: string;
};

type IdleWindow = Window & {
  requestIdleCallback?: (callback: IdleRequestCallback) => number;
  cancelIdleCallback?: (handle: number) => void;
};

export const RuntimeTranslationBoundary: React.FC<RuntimeTranslationBoundaryProps> = ({
  routeSignature,
}) => {
  const { i18n } = useTranslation();
  const language = normalizeRuntimeLanguage(i18n.language || "en");
  const runIdRef = useRef(0);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    let active = true;
    let timerId: number | undefined;
    let secondPassTimerId: number | undefined;
    let idleId: number | undefined;
    const idleWindow = window as IdleWindow;

    const runTranslation = async () => {
      const runId = ++runIdRef.current;
      const root = document.getElementById("root");
      if (!root) {
        return;
      }
      const targets = [...collectTextTargets(root), ...collectAttributeTargets(root)];

      if (!active || targets.length === 0) {
        return;
      }

      if (language === "en") {
        applyTargets(targets, language, {});
        return;
      }

      try {
        const translations = await translateRuntimeStrings(
          targets.map((target) => target.source),
          language,
        );
        if (!active || runId !== runIdRef.current) {
          return;
        }
        applyTargets(targets, language, translations);
      } catch {
        // Leave original English copy in place if runtime translation is unavailable.
      }
    };

    const scheduleTranslationPass = (delay = 0) => {
      if (timerId) {
        window.clearTimeout(timerId);
      }

      timerId = window.setTimeout(() => {
        if (!active) {
          return;
        }

        if (typeof idleWindow.requestIdleCallback === "function") {
          idleId = idleWindow.requestIdleCallback(() => {
            void runTranslation();
          });
          return;
        }

        void runTranslation();
      }, delay);
    };

    scheduleTranslationPass(40);
    secondPassTimerId = window.setTimeout(() => {
      scheduleTranslationPass(0);
    }, 900);

    return () => {
      active = false;
      if (timerId) {
        window.clearTimeout(timerId);
      }
      if (secondPassTimerId) {
        window.clearTimeout(secondPassTimerId);
      }
      if (idleId && typeof idleWindow.cancelIdleCallback === "function") {
        idleWindow.cancelIdleCallback(idleId);
      }
    };
  }, [language, routeSignature]);

  return null;
};
