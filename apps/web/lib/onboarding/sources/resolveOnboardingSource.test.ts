import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  resolveScrapeDataSource: vi.fn(),
  hasXApiSourceCredentials: vi.fn(),
  resolveXApiDataSource: vi.fn(),
}));

vi.mock("./scrapeSource", () => ({
  resolveScrapeDataSource: mocks.resolveScrapeDataSource,
}));

vi.mock("./xApiSource", () => ({
  hasXApiSourceCredentials: mocks.hasXApiSourceCredentials,
  resolveXApiDataSource: mocks.resolveXApiDataSource,
}));

import {
  getConfiguredOnboardingMode,
  resolveOnboardingDataSource,
} from "./resolveOnboardingSource";
import { buildOnboardingResultFromDataSource } from "../pipeline/service";

const originalOnboardingMode = process.env.ONBOARDING_MODE;
const originalOnboardingDataSource = process.env.ONBOARDING_DATA_SOURCE;

function createInput() {
  return {
    account: "stan",
    goal: "followers" as const,
    timeBudgetMinutes: 30,
    tone: {
      casing: "lowercase" as const,
      risk: "safe" as const,
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  delete process.env.ONBOARDING_MODE;
  delete process.env.ONBOARDING_DATA_SOURCE;
  mocks.hasXApiSourceCredentials.mockReturnValue(false);
});

afterEach(() => {
  if (originalOnboardingMode === undefined) {
    delete process.env.ONBOARDING_MODE;
  } else {
    process.env.ONBOARDING_MODE = originalOnboardingMode;
  }

  if (originalOnboardingDataSource === undefined) {
    delete process.env.ONBOARDING_DATA_SOURCE;
  } else {
    process.env.ONBOARDING_DATA_SOURCE = originalOnboardingDataSource;
  }
});

describe("resolveOnboardingDataSource", () => {
  test("recognizes explicit demo mode without touching live X sources", async () => {
    process.env.ONBOARDING_MODE = "demo";

    const source = await resolveOnboardingDataSource(createInput());

    expect(getConfiguredOnboardingMode()).toBe("demo");
    expect(source.source).toBe("demo");
    expect(source.profile.username).toBe("mayaops");
    expect(source.posts.length).toBeGreaterThan(40);
    expect(mocks.resolveScrapeDataSource).not.toHaveBeenCalled();
    expect(mocks.resolveXApiDataSource).not.toHaveBeenCalled();
  });

  test("builds a normal onboarding result from demo fixture data", async () => {
    process.env.ONBOARDING_MODE = "demo";
    const source = await resolveOnboardingDataSource(createInput());

    const result = buildOnboardingResultFromDataSource({
      input: createInput(),
      dataSource: source,
    });

    expect(result.source).toBe("demo");
    expect(result.profile.name).toBe("Maya Chen");
    expect(result.analysisConfidence.band).toBe("strong");
    expect(result.recentReplyPosts.length).toBeGreaterThan(0);
  });

  test("throws instead of falling back to mock data when scrape mode fails", async () => {
    process.env.ONBOARDING_MODE = "scrape";
    mocks.resolveScrapeDataSource.mockRejectedValue(new Error("scrape parser failed"));

    await expect(resolveOnboardingDataSource(createInput())).rejects.toThrow(
      "ONBOARDING_MODE=scrape failed: scrape parser failed",
    );
  });

  test("throws in auto mode when scrape fails and x api fallback is unavailable", async () => {
    mocks.resolveScrapeDataSource.mockRejectedValue(new Error("timeline parse failed"));
    mocks.hasXApiSourceCredentials.mockReturnValue(false);

    await expect(resolveOnboardingDataSource(createInput())).rejects.toThrow(
      "Scrape source failed: timeline parse failed X API fallback is unavailable because credentials are not configured.",
    );
  });
});
