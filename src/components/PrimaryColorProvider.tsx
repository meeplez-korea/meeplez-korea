"use client";

import { useEffect } from "react";
import { getSetting } from "@/lib/storage";

function hexToRgbString(hex: string): string {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!r) return "107, 166, 142";
  return `${parseInt(r[1], 16)}, ${parseInt(r[2], 16)}, ${parseInt(r[3], 16)}`;
}

function shiftHex(hex: string, amount: number): string {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!r) return "107, 166, 142";
  const c = (v: number) => Math.min(255, Math.max(0, v));
  return `${c(parseInt(r[1], 16) + amount)}, ${c(parseInt(r[2], 16) + amount)}, ${c(parseInt(r[3], 16) + amount)}`;
}

export function applyPrimaryColor(hex: string) {
  document.documentElement.style.setProperty("--primary", hexToRgbString(hex));
  document.documentElement.style.setProperty("--primary-dark", shiftHex(hex, -30));
  document.documentElement.style.setProperty("--primary-light", shiftHex(hex, 30));
}

export default function PrimaryColorProvider() {
  useEffect(() => {
    getSetting("primary_color").then((color) => {
      if (color) applyPrimaryColor(color);
    }).catch(() => {});
  }, []);
  return null;
}
