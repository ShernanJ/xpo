export const DEMO_USER_ID_PREFIX = "demo_";
export const DEMO_USER_NAME = "Xpo Demo Visitor";

export function isDemoUserId(userId: string | null | undefined): boolean {
  return typeof userId === "string" && userId.startsWith(DEMO_USER_ID_PREFIX);
}
