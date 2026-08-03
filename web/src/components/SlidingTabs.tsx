"use client";

import React, { useState, useEffect, useRef, useLayoutEffect } from "react";

export interface TabItem<T extends string = string> {
  id: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
}

export interface SlidingTabsProps<T extends string = string> {
  tabs: TabItem<T>[];
  activeId: T;
  onChange: (id: T) => void;
  className?: string;
  pillClassName?: string;
  variant?: "dark" | "light" | "purple";
  size?: "sm" | "md";
}

export function SlidingTabs<T extends string = string>({
  tabs,
  activeId,
  onChange,
  className = "",
  pillClassName = "",
  variant = "dark",
  size = "md",
}: SlidingTabsProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<T, HTMLButtonElement>>(new Map());
  const [pillStyle, setPillStyle] = useState({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    opacity: 0,
  });
  const isInitial = useRef(true);

  const updatePill = () => {
    const activeEl = itemRefs.current.get(activeId);
    if (activeEl && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const activeRect = activeEl.getBoundingClientRect();
      const left = activeRect.left - containerRect.left;
      const top = activeRect.top - containerRect.top;
      const width = activeRect.width;
      const height = activeRect.height;

      setPillStyle({
        left,
        top,
        width,
        height,
        opacity: 1,
      });
    }
  };

  useLayoutEffect(() => {
    updatePill();
  }, [activeId, tabs]);

  useEffect(() => {
    if (isInitial.current) {
      isInitial.current = false;
      updatePill();
    }

    const handleResize = () => updatePill();
    window.addEventListener("resize", handleResize);

    const observer = new ResizeObserver(() => updatePill());
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      observer.disconnect();
    };
  }, [activeId]);

  const pillVariantStyle =
    variant === "purple"
      ? "bg-purple-600 shadow-md shadow-purple-500/20 text-white"
      : variant === "light"
        ? "bg-white shadow-md text-[#111111]"
        : "bg-[#111111] shadow-md shadow-black/10 text-white";

  const sizePadding =
    size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-xs font-semibold";

  return (
    <div
      ref={containerRef}
      className={`relative flex items-center gap-1 bg-white/90 backdrop-blur-md border border-zinc-200/80 rounded-xl p-1.5 shadow-xs w-fit ${className}`}
    >
      {/* Sliding pill element with stiff, snappy spring physics */}
      <div
        className={`absolute top-0 left-0 rounded-lg pointer-events-none ${pillVariantStyle} ${pillClassName}`}
        style={{
          transform: `translate3d(${pillStyle.left}px, ${pillStyle.top}px, 0)`,
          width: `${pillStyle.width}px`,
          height: `${pillStyle.height}px`,
          opacity: pillStyle.opacity,
          transition: isInitial.current
            ? "none"
            : "transform 360ms cubic-bezier(0.34, 1.4, 0.64, 1), width 360ms cubic-bezier(0.34, 1.4, 0.64, 1), height 360ms cubic-bezier(0.34, 1.4, 0.64, 1), opacity 200ms ease",
        }}
      />

      {tabs.map((tab) => {
        const isActive = activeId === tab.id;
        return (
          <button
            key={tab.id}
            ref={(el) => {
              if (el) itemRefs.current.set(tab.id, el);
              else itemRefs.current.delete(tab.id);
            }}
            onClick={() => onChange(tab.id)}
            type="button"
            className={`relative z-10 flex items-center gap-2 ${sizePadding} rounded-lg cursor-pointer select-none transition-colors duration-200 ${
              isActive
                ? variant === "light"
                  ? "text-[#111111] font-bold"
                  : "text-white font-semibold"
                : "text-zinc-500 hover:text-zinc-900"
            }`}
          >
            {tab.icon && (
              <span className="shrink-0 transition-transform duration-200">
                {tab.icon}
              </span>
            )}
            <span>{tab.label}</span>
            {tab.badge && <span className="ml-1">{tab.badge}</span>}
          </button>
        );
      })}
    </div>
  );
}
