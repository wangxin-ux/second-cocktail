import type { ReportPayload, ReportResult, SafetyService } from "./safety";

export class DemoSafetyService implements SafetyService {
  async submitReport(payload: ReportPayload): Promise<ReportResult> {
    void payload;
    await new Promise((resolve) => window.setTimeout(resolve, 180));
    return { delivered: false, mode: "demo" };
  }
}
