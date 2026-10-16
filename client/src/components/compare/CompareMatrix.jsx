import React from 'react';
import {
  FileText,
  ListChecks,
  Code2,
  HeartHandshake,
  Wrench,
  FolderGit2,
  BookOpen,
  Award,
  Building2,
  DollarSign,
  TrendingUp,
  Terminal,
  CheckCircle2,
} from 'lucide-react';
import { Badge } from '../Badge';

export function CompareMatrix({ roles = [] }) {
  if (roles.length === 0) return null;

  // 14 dimensions definition
  const dimensions = [
    {
      id: 'overview',
      label: '1. Career Overview',
      icon: FileText,
      render: (role) => (
        <p className="text-xs text-foreground/90 leading-relaxed font-normal">
          {role.shortDescription || 'Data unavailable'}
        </p>
      ),
    },
    {
      id: 'responsibilities',
      label: '2. Main Responsibilities',
      icon: ListChecks,
      render: (role) => {
        const items = role.responsibilities || [];
        if (items.length === 0) return <span className="text-muted-foreground text-xs">Data unavailable</span>;
        return (
          <ul className="space-y-1.5 text-xs text-muted-foreground">
            {items.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-foreground shrink-0 mt-1.5" />
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        );
      },
    },
    {
      id: 'technicalSkills',
      label: '3. Technical Skills',
      icon: Code2,
      render: (role) => {
        const skills = role.technicalSkills || [];
        if (skills.length === 0) return <span className="text-muted-foreground text-xs">Data unavailable</span>;
        return (
          <div className="flex flex-wrap gap-1.5">
            {skills.map((skill) => (
              <span
                key={skill}
                className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-secondary text-foreground border border-border/80"
              >
                {skill}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      id: 'softSkills',
      label: '4. Soft Skills',
      icon: HeartHandshake,
      render: (role) => {
        const skills = role.softSkills || [];
        if (skills.length === 0) return <span className="text-muted-foreground text-xs">Data unavailable</span>;
        return (
          <div className="flex flex-wrap gap-1.5">
            {skills.map((skill) => (
              <span
                key={skill}
                className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-secondary text-foreground border border-border/80"
              >
                {skill}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      id: 'tools',
      label: '5. Tools & Technologies',
      icon: Wrench,
      render: (role) => {
        const tools = role.tools || [];
        if (tools.length === 0) return <span className="text-muted-foreground text-xs">Data unavailable</span>;
        return (
          <div className="flex flex-wrap gap-1.5">
            {tools.map((tool) => (
              <span
                key={tool}
                className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-neutral-100 dark:bg-neutral-800 text-foreground border border-neutral-300 dark:border-neutral-700"
              >
                {tool}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      id: 'beginnerProjects',
      label: '6. Beginner Projects',
      icon: FolderGit2,
      render: (role) => {
        const projs = role.projects?.beginner || [];
        if (projs.length === 0) return <span className="text-muted-foreground text-xs">Data unavailable</span>;
        return (
          <ul className="space-y-1.5 text-xs text-muted-foreground">
            {projs.map((p, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-foreground shrink-0 mt-1.5" />
                <span className="leading-relaxed">{p}</span>
              </li>
            ))}
          </ul>
        );
      },
    },
    {
      id: 'intermediateProjects',
      label: '7. Intermediate Projects',
      icon: FolderGit2,
      render: (role) => {
        const projs = role.projects?.intermediate || [];
        if (projs.length === 0) return <span className="text-muted-foreground text-xs">Data unavailable</span>;
        return (
          <ul className="space-y-1.5 text-xs text-muted-foreground">
            {projs.map((p, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-foreground shrink-0 mt-1.5" />
                <span className="leading-relaxed">{p}</span>
              </li>
            ))}
          </ul>
        );
      },
    },
    {
      id: 'advancedProjects',
      label: '8. Advanced Projects',
      icon: FolderGit2,
      render: (role) => {
        const projs = role.projects?.advanced || [];
        if (projs.length === 0) return <span className="text-muted-foreground text-xs">Data unavailable</span>;
        return (
          <ul className="space-y-1.5 text-xs text-muted-foreground">
            {projs.map((p, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-foreground shrink-0 mt-1.5" />
                <span className="leading-relaxed text-foreground font-medium">{p}</span>
              </li>
            ))}
          </ul>
        );
      },
    },
    {
      id: 'roadmap',
      label: '9. Learning Roadmap',
      icon: BookOpen,
      render: (role) => {
        const stages = role.roadmap || [];
        if (stages.length === 0) return <span className="text-muted-foreground text-xs">Data unavailable</span>;
        return (
          <div className="space-y-2">
            {stages.map((stg, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl bg-secondary/60 border border-border/80 space-y-1"
              >
                <div className="flex items-center justify-between text-[11px] font-bold text-foreground">
                  <span className="uppercase tracking-wider">{stg.stage}</span>
                  <span className="text-muted-foreground">{stg.title}</span>
                </div>
                {stg.skills && (
                  <p className="text-[10px] text-muted-foreground truncate">
                    Skills: {stg.skills.join(', ')}
                  </p>
                )}
              </div>
            ))}
          </div>
        );
      },
    },
    {
      id: 'certifications',
      label: '10. Recommended Certifications',
      icon: Award,
      render: (role) => {
        const certs = role.certifications || [];
        if (certs.length === 0) return <span className="text-muted-foreground text-xs">Data unavailable</span>;
        return (
          <div className="space-y-1.5">
            {certs.map((cert, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-2 p-2 rounded-lg bg-card border border-border text-xs"
              >
                <span className="font-medium text-foreground truncate">{cert.name}</span>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase shrink-0 ${
                    cert.type === 'FREE'
                      ? 'bg-neutral-100 dark:bg-neutral-800 text-foreground border-neutral-300 dark:border-neutral-700'
                      : 'bg-neutral-200 dark:bg-neutral-800 text-foreground border-neutral-400 dark:border-neutral-600'
                  }`}
                >
                  {cert.type}
                </span>
              </div>
            ))}
          </div>
        );
      },
    },
    {
      id: 'industry',
      label: '11. Hiring Industries',
      icon: Building2,
      render: (role) => {
        const ind = role.industry || [];
        if (ind.length === 0) return <span className="text-muted-foreground text-xs">Data unavailable</span>;
        return (
          <div className="flex flex-wrap gap-1.5">
            {ind.map((item) => (
              <span
                key={item}
                className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-neutral-100 dark:bg-neutral-800 text-foreground border border-neutral-300 dark:border-neutral-700"
              >
                {item}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      id: 'salary',
      label: '12. Average Salary',
      icon: DollarSign,
      render: (role) => (
        <div className="p-3 rounded-xl bg-secondary/60 border border-border">
          <p className="text-sm font-black text-foreground">
            {role.stats?.averageSalary || 'Data unavailable'}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Annual CTC (Entry to Mid-Level)
          </p>
        </div>
      ),
    },
    {
      id: 'growth',
      label: '13. Job-Market Growth',
      icon: TrendingUp,
      render: (role) => (
        <div className="p-3 rounded-xl bg-secondary/60 border border-border">
          <p className="text-sm font-black text-foreground">
            {role.stats?.growthRate || 'Data unavailable'}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Openings: {role.stats?.jobOpenings || 'Active hiring'}
          </p>
        </div>
      ),
    },
    {
      id: 'roleType',
      label: '14. Coding Requirement / Role Type',
      icon: Terminal,
      render: (role) => {
        const tags = role.tags || [];
        return (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1">
              {tags.map((t) => (
                <Badge key={t} variant={t.toLowerCase()} size="md">
                  {t}
                </Badge>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Domain: <strong className="text-foreground">{role.category}</strong>
            </p>
          </div>
        );
      },
    },
  ];

  return (
    <div className="bg-card rounded-2xl border border-border shadow-xs overflow-hidden">
      <div className="p-4 sm:p-5 border-b border-border bg-secondary/30 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
            Side-by-Side Comparison Matrix
          </h3>
          <p className="text-xs text-muted-foreground">
            Evaluated across 14 comprehensive professional dimensions
          </p>
        </div>
        <span className="text-xs font-semibold text-muted-foreground hidden sm:inline">
          Scroll horizontally on smaller screens
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs min-w-[700px]">
          {/* Table Header: Role Titles */}
          <thead>
            <tr className="border-b border-border bg-card">
              <th className="p-4 w-52 sm:w-64 font-bold text-muted-foreground uppercase tracking-wider text-[11px] bg-card sticky left-0 z-10 border-r border-border">
                Comparison Dimension
              </th>
              {roles.map((role) => (
                <th
                  key={role.id}
                  className="p-4 font-bold text-foreground text-sm border-r border-border last:border-r-0 min-w-[220px]"
                >
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {role.category}
                    </p>
                    <p className="text-sm font-black text-foreground">
                      {role.title}
                    </p>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* Table Body: 14 Rows */}
          <tbody className="divide-y divide-border">
            {dimensions.map((dim) => {
              const Icon = dim.icon;
              return (
                <tr key={dim.id} className="hover:bg-secondary/20 transition-colors">
                  {/* Sticky Dimension Label Column */}
                  <td className="p-4 font-bold text-foreground bg-card sticky left-0 z-10 border-r border-border align-top">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="leading-snug">{dim.label}</span>
                    </div>
                  </td>

                  {/* Role Data Columns */}
                  {roles.map((role) => (
                    <td
                      key={role.id}
                      className="p-4 border-r border-border last:border-r-0 align-top"
                    >
                      {dim.render(role)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
