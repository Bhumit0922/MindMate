import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { polarClient } from "@/lib/polar";
import { db } from "@/db";
import { count, eq } from "drizzle-orm";
import { agents, meetings } from "@/db/schema";

export const premiumRouter = createTRPCRouter({
  getCurrentSubscription: protectedProcedure.query(async ({ ctx }) => {
    const customer = await polarClient.customers.getStateExternal({
      externalId: ctx.auth.user.id,
    });
    const subcription = customer.activeSubscriptions[0];
    if (!subcription) {
      return null;
    }
    const product = await polarClient.products.get({
      id: subcription.productId,
    });
    return product;
  }),
  getProduct: protectedProcedure.query(async () => {
    const products = await polarClient.products.list({
      isArchived: false,
      isRecurring: true,
      sorting: ["price_amount"],
    });
    return products.result.items;
  }),
  getFreeUsage: protectedProcedure.query(async ({ ctx }) => {
    const customer = await polarClient.customers.getStateExternal({
      externalId: ctx.auth.user.id,
    });
    const subcription = customer.activeSubscriptions[0];

    if (subcription) {
      return null;
    }

    const [userMeeting] = await db
      .select({
        count: count(meetings.id),
      })
      .from(meetings)
      .where(eq(meetings.userId, ctx.auth.user.id));

    const [userAgents] = await db
      .select({ count: count(agents.id) })
      .from(agents)
      .where(eq(agents.userId, ctx.auth.user.id));

    return {
      meetingCount: userMeeting.count,
      agentCount: userAgents.count,
    };
  }),
});
