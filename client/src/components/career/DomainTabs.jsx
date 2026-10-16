import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, Layers } from 'lucide-react';

export function DomainTabs({
  categories = [],
  activeCategory = 'All Domains',
  onSelectCategory,
  counts = {},
}) {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const offset = direction === 'left' ? -260 : 260;
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-0.5">
        <div className="flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Browse Domains
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => scroll('left')}
            aria-label="Scroll left"
            className="p-1 rounded-lg border border-border bg-card hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => scroll('right')}
            aria-label="Scroll right"
            className="p-1 rounded-lg border border-border bg-card hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="relative">
        <div
          ref={scrollRef}
          className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth py-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {categories.map((cat) => {
            const isActive = activeCategory === cat;
            const count = counts[cat];

            return (
              <button
                key={cat}
                type="button"
                onClick={() => onSelectCategory(cat)}
                className={`shrink-0 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer select-none active:scale-95 ${
                  isActive
                    ? 'bg-foreground text-background border-foreground font-semibold shadow-xs'
                    : 'bg-card text-foreground border-border hover:bg-secondary hover:border-neutral-400 dark:hover:border-neutral-600'
                }`}
              >
                <span>{cat}</span>
                {typeof count === 'number' && (
                  <span
                    className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
                      isActive
                        ? 'bg-background/20 text-background'
                        : 'bg-secondary text-muted-foreground'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
