"use client";

import { useEffect, useRef, useState } from "react";
import type { LocatorValue } from "@/lib/nodes";

const PICK_TIMEOUT_MS = 120000;

/**
 * Drives the WebBot extension's element-picker: asks the target tab to enter
 * pick mode and resolves the chosen locator. `onPick` receives the result.
 */
export function useElementPicker(onPick: (locator: LocatorValue) => void) {
  const [picking, setPicking] = useState(false);
  const [pickMsg, setPickMsg] = useState<string | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  const pickFromPage = () => {
    if (picking) return;
    setPickMsg(null);
    setPicking(true);

    const onMsg = (e: MessageEvent) => {
      const d = e.data;
      if (!d || d.__webbot !== "PICK_RESULT") return;
      finish();
      if (d.error) {
        setPickMsg(d.error);
        return;
      }
      if (!d.cancelled && d.locator) {
        onPick({ by: "text", selector: "", ...d.locator } as LocatorValue);
        if (d.count > 1) setPickMsg(`Matched ${d.count} similar elements.`);
      }
    };

    const timer = window.setTimeout(() => {
      finish();
      setPickMsg("No response — is the WebBot extension installed and enabled?");
    }, PICK_TIMEOUT_MS);

    function finish() {
      window.clearTimeout(timer);
      window.removeEventListener("message", onMsg);
      cleanupRef.current = null;
      setPicking(false);
    }

    cleanupRef.current = finish;
    window.addEventListener("message", onMsg);
    window.postMessage({ __webbot: "PICK_REQUEST" }, "*");
  };

  // Tear down the listener if the modal closes mid-pick.
  useEffect(() => () => cleanupRef.current?.(), []);

  return { picking, pickMsg, pickFromPage };
}
