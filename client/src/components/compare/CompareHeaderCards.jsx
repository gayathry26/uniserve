import React, { useState } from 'react';
import {
  X,
  ArrowRight,
  TrendingUp,
  DollarSign,
  Building2,
  Trash2,
  ArrowLeft,
  Share2,
  Check,
  Compass,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '../Badge';

export function CompareHeaderCards({
  roles = [],
  onRemoveRole,
  onClearAll,
  onViewDetails,
}) {
  const [copied, setCopied] = useState(false);

  if (roles.length === 0) return null;

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Determine grid column layout based on number of selected roles
  const gridColsClass =
    roles.length === 1
      ? 'grid-cols-1 max-w-md'
      : roles.length === 2
      ? 'grid-cols-1 md:grid-cols-2'
      : roles.length === 3
      ? 'grid-cols-1 md:grid-cols-3'
      : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4';

  return (
    <div className="space-y-4">
      {/* Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-border/60">
        <div className="flex items-center gap-3">
          <Link
            to="/domains"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Explore Domains</span>
          </Link>
          <span className="text-muted-foreground">•</span>
          <span className="text-xs text-muted-foreground font-semibold">
            {roles.length} {roles.length === 1 ? 'Career Path' : 'Career Paths'} Under Active Comparison
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Share Link Button */}
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-border bg-card hover:bg-secondary text-foreground transition-colors cursor-pointer"
            title="Copy shareable link"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-foreground stroke-[2.5]" />
                <span>Link Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Share Comparison</span>
              </>
            )}
          </button>

          {/* Clear All Button */}
          <button
            type="button"
            onClick={onClearAll}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground bg-secondary hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All</span>
          </button>
        </div>
      </div>

      {/* Selected Overview Cards Grid */}
      <div className={`grid ${gridColsClass} gap-4`}>
        {roles.map((role) => (
          <div
            key={role.id}
            className="bg-card rounded-2xl border border-border p-5 shadow-xs flex flex-col justify-between space-y-4 relative group"
          >
            {/* Top row with remove button */}
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {role.category}
                </span>
                <h3 className="text-base font-bold text-foreground leading-snug">
                  {role.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onRemoveRole(role.id)}
                className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer shrink-0"
                title={`Remove ${role.title}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1">
              {role.tags.map((t) => (
                <Badge key={t} variant={t.toLowerCase()} size="sm">
                  {t}
                </Badge>
              ))}
            </div>

            {/* Description */}
            <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
              {role.shortDescription}
            </p>

            {/* Market Info */}
            <div className="grid grid-cols-2 gap-2 text-xs bg-secondary/50 rounded-xl p-2.5 border border-border/60">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Avg. Salary
                </p>
                <p className="font-bold text-foreground truncate mt-0.5">
                  {role.stats?.averageSalary || 'Data unavailable'}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Growth Rate
                </p>
                <p className="font-bold text-foreground truncate mt-0.5">
                  {role.stats?.growthRate || 'Data unavailable'}
                </p>
              </div>
            </div>

            {/* Industries */}
            {role.industry && role.industry.length > 0 && (
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Top Hiring Sectors
                </p>
                <p className="text-xs font-medium text-foreground truncate">
                  {role.industry.slice(0, 3).join(', ')}
                </p>
              </div>
            )}

            {/* View Path Link */}
            <button
              type="button"
              onClick={() => onViewDetails(role)}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-secondary hover:bg-neutral-200 dark:hover:bg-neutral-800 text-foreground transition-colors cursor-pointer"
            >
              <span>View Full Career Roadmap</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
