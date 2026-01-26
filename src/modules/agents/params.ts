import { parseAsInteger, parseAsString } from "nuqs/server";

import { DEFAULT_PAGE } from "@/constanst";
import { createLoader } from "nuqs";

export const filtersSearchParams = {
  search: parseAsString.withDefault("").withOptions({ clearOnDefault: true }),
  page: parseAsInteger
    .withDefault(DEFAULT_PAGE)
    .withOptions({ clearOnDefault: true }),
};

export const loadSearchParams = createLoader(filtersSearchParams)