import { NonRetriableError, type GetFunctionInput, type GetStepTools } from "inngest";

import { prisma } from "@/lib/db";

import {
  inngest,
  type ScraperAccountLockedEventData,
} from "../client";

type RefreshScraperTokensContext = Omit<GetFunctionInput<typeof inngest>, "event"> & {
  event: {
    data: ScraperAccountLockedEventData;
  };
  step: GetStepTools<typeof inngest>;
};

export async function refreshScraperTokensHandler({
  event,
  step,
}: RefreshScraperTokensContext) {
  const { accountId, status } = event.data;

  const account = await step.run("load-scraper-account", async () =>
    prisma.scraperProxyAccount.findUnique({
      where: { id: accountId },
      select: {
        id: true,
        username: true,
        password: true,
        twoFactorSecret: true,
        authToken: true,
        ct0: true,
        status: true,
      },
    }),
  );

  if (!account) {
    throw new NonRetriableError(`Scraper account ${accountId} was not found.`);
  }

  console.log(
    `[scraper-refresh] Account ${account.id} (@${account.username}) requires token refresh after entering ${status}.`,
  );

  return {
    accountId: account.id,
    username: account.username,
    passwordPresent: Boolean(account.password),
    twoFactorSecretPresent: Boolean(account.twoFactorSecret),
    authTokenPresent: Boolean(account.authToken),
    ct0Present: Boolean(account.ct0),
    status: account.status,
  };
}

export const refreshScraperTokens = inngest.createFunction(
  {
    id: "refresh-scraper-tokens",
    retries: 2,
    triggers: [{ event: "scraper/account.locked" }],
  },
  refreshScraperTokensHandler,
);
