import { JobResponse } from "@/lib/jobs";

// types/jobs.ts
export enum JobType {
  FULL_TIME = "FULL_TIME",
  PART_TIME = "PART_TIME",
  REMOTE = "REMOTE",
  HYBRID = "HYBRID",
  CONTRACT = "CONTRACT",
}

export enum JobStatus {
  DRAFT = "DRAFT",
  PUBLISHED = "PUBLISHED",
  CLOSED = "CLOSED",
}

export const jobTypeLabels: Record<JobType, string> = {
  [JobType.FULL_TIME]: "Full Time",
  [JobType.PART_TIME]: "Part Time",
  [JobType.REMOTE]: "Remote",
  [JobType.HYBRID]: "Hybrid",
  [JobType.CONTRACT]: "Contract",
};

export const jobTypeColors: Record<JobType, string> = {
  [JobType.FULL_TIME]: "bg-brandGreen/10 text-brandGreen",
  [JobType.PART_TIME]: "bg-purpleAccent/10 text-purpleAccent",
  [JobType.REMOTE]: "bg-cyanAccent/10 text-cyanAccent",
  [JobType.HYBRID]: "bg-orangeAccent/10 text-orangeAccent",
  [JobType.CONTRACT]: "bg-redAccent/10 text-redAccent",
};

export interface MyJobsDashboardResponse {
  jobs: JobResponse[];
  totalCount: number;
  activeCount: number;
  allowedLimit: number;
  canPostMore: boolean;
}
