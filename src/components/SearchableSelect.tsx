import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';

export interface SearchableSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SearchableSelectProps {
  value: string;
  options: SearchableSelectOption[];
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  bright?: boolean;
  ariaLabel?: string;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  value,
  options,
  onChange,
  className = '',
  placeholder = 'Select an option…',
  searchPlaceholder = 'Type to search…',
  disabled = false,
  bright = false,
  ariaLabel,
}) => {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value);
  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    if (!normalizedQuery) return options;
    return options.filter((option) => option.label.toLocaleLowerCase().includes(normalizedQuery));
  }, [options, query]);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        setQuery('');
        setSearchOpen(false);
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative flex w-full min-w-0 items-center gap-1.5">
      <button
        type="button"
        disabled={disabled}
        aria-label={searchOpen ? 'Close search' : 'Search options'}
        title={searchOpen ? 'Close search' : 'Search options'}
        onClick={() => {
          if (searchOpen) {
            setSearchOpen(false);
            setQuery('');
            setOpen(false);
          } else {
            setSearchOpen(true);
            setOpen(true);
          }
        }}
        className={`flex-shrink-0 p-2 rounded-lg border disabled:opacity-50 ${
          bright ? 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100' : 'bg-neutral-950 border-neutral-700 text-neutral-300 hover:bg-neutral-800'
        }`}
      >
        <Search className="w-4 h-4" />
      </button>
      {searchOpen && (
        <input
          autoFocus
          type="search"
          value={query}
          disabled={disabled}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          placeholder={searchPlaceholder}
          aria-label={ariaLabel ? `Search ${ariaLabel}` : searchPlaceholder}
          className={`w-24 sm:w-32 min-w-0 px-2 py-2 rounded-lg border outline-none text-xs focus:border-amber-500 ${
            bright ? 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400' : 'bg-neutral-950 border-neutral-700 text-neutral-100 placeholder:text-neutral-500'
          }`}
        />
      )}
      <button
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((wasOpen) => !wasOpen)}
        className={`flex-1 min-w-0 flex items-center justify-between gap-2 text-left disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        <span className="truncate">{selected?.label ?? placeholder}</span>
        <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className={`absolute right-0 top-full z-[80] mt-1 w-full min-w-48 overflow-hidden rounded-xl border shadow-xl ${
          bright ? 'bg-white border-slate-300' : 'bg-neutral-950 border-neutral-700'
        }`}>
          <div role="listbox" className="max-h-56 overflow-y-auto p-1">
            {filteredOptions.length ? filteredOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={option.value === value}
                disabled={option.disabled}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                  setQuery('');
                  setSearchOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-xs disabled:opacity-40 disabled:cursor-not-allowed ${
                  option.value === value
                    ? bright ? 'bg-amber-100 text-amber-950' : 'bg-amber-500/15 text-amber-200'
                    : bright ? 'text-slate-800 hover:bg-slate-100' : 'text-neutral-200 hover:bg-neutral-800'
                }`}
              >
                <span>{option.label}</span>
                {option.value === value && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
              </button>
            )) : (
              <p className={`px-3 py-3 text-xs ${bright ? 'text-slate-500' : 'text-neutral-500'}`}>
                No matching options
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
