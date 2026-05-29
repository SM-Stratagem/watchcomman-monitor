export type ContractEntry = {
  externalKey: string;
  jurisdiction: "us-sam" | "eu-ted" | "uk-gov" | "dsca";
  title: string;
  agency: string | null;
  naics: string | null;
  valueUsd: number | null;
  country: string | null;
  summary: string | null;
  link: string | null;
  publishedAt: string;
  deadlineAt: string | null;
};
