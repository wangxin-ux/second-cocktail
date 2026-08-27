import type { MatchCandidate, MatchService } from "./match-types";

export type DemoMatchScenario = "default" | "empty" | "error";

export const demoMatchPool: readonly MatchCandidate[] = [
  { id: "mika", nickname: "Mika", age: 27, zodiac: "Libra", mbti: "ENFP", energy: "open", spirit: "gin", flavor: "refreshing", drink: "Silver Garden", personalitySignal: "Collects city stories and always notices the best song in the room.", personalitySignalZh: "收集城市故事，也总能听见房间里最好听的那首歌。" },
  { id: "noah", nickname: "Noah", age: 30, zodiac: "Scorpio", mbti: "INTJ", energy: "curious", spirit: "whisky", flavor: "bold", drink: "Quiet Frequency", personalitySignal: "Builds things by day and looks for strange little bars after dark.", personalitySignalZh: "白天搭建新东西，晚上寻找有趣的小酒吧。" },
  { id: "sora", nickname: "Sora", age: 25, zodiac: "Pisces", mbti: "INFP", energy: "slow", spirit: "rum", flavor: "sweet", drink: "Velvet Tide", personalitySignal: "A quiet observer who notices details other people miss.", personalitySignalZh: "安静的观察者，总能看见别人忽略的细节。" },
  { id: "alex", nickname: "Alex", age: 29, zodiac: "Gemini", mbti: "ENTP", energy: "celebrating", spirit: "tequila", flavor: "sour", drink: "Electric Alibi", personalitySignal: "Turns accidental conversations into ambitious weekend plans.", personalitySignalZh: "常把偶然的聊天变成周末的新计划。" },
  { id: "lin", nickname: "Lin", age: 28, zodiac: "Taurus", mbti: "ISFJ", energy: "open", spirit: "brandy", flavor: "fruity", drink: "Afterglow Orchard", personalitySignal: "Remembers small details and knows where the city feels most human.", personalitySignalZh: "记得微小细节，也知道城市里最有人情味的角落。" },
  { id: "jules", nickname: "Jules", age: 26, zodiac: "Aquarius", mbti: "ISTP", energy: "curious", spirit: "vodka", flavor: "bitter", drink: "Cold Signal", personalitySignal: "Likes precise objects, unexpected detours, and very dry humor.", personalitySignalZh: "喜欢精确的物件、意外的绕路和很冷的幽默。" },
] as const;

function wait(milliseconds: number) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

export class DemoMatchService implements MatchService {
  constructor(
    private readonly scenario: DemoMatchScenario = "default",
    private readonly candidatePool: readonly MatchCandidate[] = demoMatchPool,
  ) {}

  async getAvailability() {
    await wait(120);
    if (this.scenario === "error") throw new Error("Demo availability failure");
    return { onlineCount: this.scenario === "empty" ? 0 : this.candidatePool.length, source: "demo" as const };
  }

  async findCandidate(excludedCandidateIds: readonly string[]) {
    await wait(450);
    if (this.scenario === "error") throw new Error("Demo search failure");
    if (this.scenario === "empty") return { status: "empty" as const };
    const candidate = this.candidatePool.find((item) => !excludedCandidateIds.includes(item.id));
    return candidate ? { status: "candidate" as const, candidate } : { status: "empty" as const };
  }

  async acceptCandidate(candidateId: string) {
    if (!this.candidatePool.some((candidate) => candidate.id === candidateId)) throw new Error("Unknown demo candidate");
    await wait(180);
  }

  async passCandidate(candidateId: string) {
    if (!this.candidatePool.some((candidate) => candidate.id === candidateId)) throw new Error("Unknown demo candidate");
    await wait(80);
    return { otherPartyMessage: "candidate_unavailable" as const };
  }

  async waitForMutualAcceptance(candidateId: string) {
    if (!this.candidatePool.some((candidate) => candidate.id === candidateId)) throw new Error("Unknown demo candidate");
    await wait(900);
    return true;
  }
}
