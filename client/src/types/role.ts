export type RoleTag =
  | "Coding"
  | "Non-Coding"
  | "Creative"
  | "Emerging"
  | "Management"
  | "Hybrid";

export interface RoleStats {
  averageSalary?: string;
  jobOpenings?: string;
  growthRate?: string;
}

export interface CertificationItem {
  name: string;
  type: "FREE" | "PAID";
  provider?: string;
}

export interface RoadmapLevel {
  stage: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "JOB READY";
  title: string;
  skills: string[];
  tools?: string[];
  learningActivities?: string[];
  projects?: string[];
  description?: string;
}

export interface ITRole {
  id: string;
  title: string;
  category: string;
  tags: RoleTag[];
  shortDescription: string;
  responsibilities?: string[];
  scope?: string;
  technicalSkills: string[];
  softSkills: string[];
  tools?: string[];
  stats?: RoleStats;
  projects?: {
    beginner: string[];
    intermediate: string[];
    advanced: string[];
  };
  certifications?: CertificationItem[];
  roadmap?: RoadmapLevel[];
  industry: string[];
}
