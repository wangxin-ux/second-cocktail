export type ReportReason = "unsafe" | "harassment" | "identity_mismatch" | "other";

export type ReportPayload = {
  candidateId: string;
  reason: ReportReason;
  stage: string;
  createdAt: string;
};

export type ReportResult = {
  delivered: boolean;
  mode: "demo" | "live";
};

export interface SafetyService {
  submitReport(payload: ReportPayload): Promise<ReportResult>;
}
