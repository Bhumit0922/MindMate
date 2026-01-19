"use client";

import { useTRPC } from "@/trpc/client";

export const HomeView = () => {
  const trpc = useTRPC()
  const { data } = useQuery(trpc.hello.queryOptions({text: "Bhumit"}))

  

  return (
    <>
      <div className="flex flex-col p-4 gap-y-4">
        {data?.greeting}
      </div>
    </>
  );
};
