"use client";

import * as React from "react";
import { useState, useRef, useEffect, useId } from "react";
import { ChevronDownIcon, CheckIcon, SearchIcon, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SearchableSelectOption {
  value: string;
  label: string;
  /** Optional sub-label shown below the main label */
  sublabel?: string;
}

interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  className?: string;
  /** Max visible items before scroll kicks in (default 6) */
  maxVisible?: number;
}

export function SearchableSelect({
  options,
  value,
  onValueChange,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  emptyMessage = "No results found.",
  disabled = false,
  className,
  maxVisible = 6,
}: SearchableSelectProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase()) ||
    (o.sublabel ?? "").toLowerCase().includes(search.toLowerCase())
  );

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Focus search when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 0);
    } else {
      setSearch("");
    }
  }, [open]);

  // Keyboard navigation
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      setOpen(false);
      setSearch("");
    }
    if ((e.key === "Enter" || e.key === " ") && !open) {
      setOpen(true);
    }
  }

  function handleSelect(optValue: string) {
    onValueChange?.(optValue);
    setOpen(false);
    setSearch("");
  }

  // Calculate max height based on maxVisible * item height (36px) + search bar (44px) + padding (8px)
  const itemHeight = 36;
  const maxListHeight = maxVisible * itemHeight;

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      {/* Trigger */}
      <button
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-controls={`${id}-listbox`}
        aria-haspopup="listbox"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={handleKeyDown}
        className={cn(
          "flex w-full items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent py-2 pr-2 pl-2.5 text-sm whitespace-nowrap transition-all outline-none select-none h-8",
          "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          "disabled:cursor-not-allowed disabled:opacity-50",
          open && "border-ring ring-3 ring-ring/50",
          !selected && "text-muted-foreground",
          "dark:bg-input/30 dark:hover:bg-input/50"
        )}
      >
        <span className="flex-1 text-left truncate">
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDownIcon
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          id={`${id}-listbox`}
          role="listbox"
          className={cn(
            "absolute z-50 mt-1 w-full min-w-36 rounded-lg border border-border bg-popover text-popover-foreground shadow-lg",
            "animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-100"
          )}
        >
          {/* Search input */}
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <SearchIcon className="size-3.5 shrink-0 text-muted-foreground" />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <XIcon className="size-3.5" />
              </button>
            )}
          </div>

          {/* Options list */}
          <div
            ref={listRef}
            className="overflow-y-auto overscroll-contain p-1"
            style={{ maxHeight: `${maxListHeight}px` }}
          >
            {filtered.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                {emptyMessage}
              </div>
            ) : (
              filtered.map((option) => {
                const isSelected = option.value === value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(option.value)}
                    className={cn(
                      "relative flex w-full cursor-default items-center gap-2 rounded-md py-1.5 pr-8 pl-2 text-sm outline-none select-none transition-colors",
                      "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                      isSelected && "bg-accent/50 font-medium"
                    )}
                  >
                    <span className="flex flex-col flex-1 text-left min-w-0">
                      <span className="truncate">{option.label}</span>
                      {option.sublabel && (
                        <span className="text-xs text-muted-foreground truncate">
                          {option.sublabel}
                        </span>
                      )}
                    </span>
                    {isSelected && (
                      <CheckIcon className="absolute right-2 size-4 shrink-0 text-primary" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer hint if results are filtered */}
          {filtered.length > 0 && filtered.length < options.length && (
            <div className="border-t border-border px-3 py-1.5 text-[11px] text-muted-foreground text-center">
              Showing {filtered.length} of {options.length} results
            </div>
          )}
        </div>
      )}
    </div>
  );
}
