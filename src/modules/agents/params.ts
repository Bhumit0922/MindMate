import { createLoader, parseAsInteger, parseAsString } from "nuqs/server";
import { DEFAULT_PAGE } from "@/constanst";

export const agentsSearchParams = createLoader({
  search: parseAsString
    .withDefault("")
    .withOptions({ clearOnDefault: true }),

  page: parseAsInteger
    .withDefault(DEFAULT_PAGE)
    .withOptions({ clearOnDefault: true }),
});
