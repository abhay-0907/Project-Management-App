"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
const getClientYear = () => new Date().getFullYear();
const getServerYear = () => undefined;

export function CurrentYear() {
  const year = useSyncExternalStore(subscribe, getClientYear, getServerYear);

  return <>{year ?? ""}</>;
}
