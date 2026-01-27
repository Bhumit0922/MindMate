// src/modules/agents/params.ts
import {
  parseAsInteger,
  parseAsString,
  createSearchParamsCache,
} from "nuqs/server";

import { DEFAULT_PAGE } from "@/constanst";

export const agentsSearchParams = createSearchParamsCache({
  search: parseAsString.withDefault("").withOptions({ clearOnDefault: true }),
  page: parseAsInteger
    .withDefault(DEFAULT_PAGE)
    .withOptions({ clearOnDefault: true }),
});
