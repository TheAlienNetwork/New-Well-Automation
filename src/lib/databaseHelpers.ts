import { supabase } from "./database";
import type { Tables, TablesInsert } from "@/types/supabase";

/**
 * Utility functions for common database operations
 */

// Pagination helper
export interface PaginationOptions {
  page: number;
  pageSize: number;
  orderBy?: string;
  ascending?: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const getPaginated = async <
  T extends keyof Database["public"]["Tables"],
>(
  table: T,
  options: PaginationOptions,
  filters?: Record<string, any>,
): Promise<PaginatedResult<Tables<T>>> => {
  const { page, pageSize, orderBy = "created_at", ascending = false } = options;

  try {
    // First get the total count
    let countQuery = supabase
      .from(table)
      .select("*", { count: "exact", head: true });

    // Apply filters if provided
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        countQuery = countQuery.eq(key, value);
      });
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error(`Error counting records in ${table}:`, countError);
      throw countError;
    }

    // Then get the paginated data
    let dataQuery = supabase
      .from(table)
      .select("*")
      .order(orderBy, { ascending })
      .range((page - 1) * pageSize, page * pageSize - 1);

    // Apply filters if provided
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        dataQuery = dataQuery.eq(key, value);
      });
    }

    const { data, error: dataError } = await dataQuery;

    if (dataError) {
      console.error(`Error fetching paginated data from ${table}:`, dataError);
      throw dataError;
    }

    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    return {
      data: data as Tables<T>[],
      count: totalCount,
      page,
      pageSize,
      totalPages,
    };
  } catch (error) {
    console.error(`Error in paginated query for ${table}:`, error);
    throw error;
  }
};

// Bulk operations with transaction support
export const bulkUpsert = async <T extends keyof Database["public"]["Tables"]>(
  table: T,
  records: TablesInsert<T>[],
  onConflict?: string,
): Promise<Tables<T>[]> => {
  try {
    let query = supabase.from(table).upsert(records);

    if (onConflict) {
      query = query.onConflict(onConflict);
    }

    const { data, error } = await query.select();

    if (error) {
      console.error(`Error in bulk upsert for ${table}:`, error);
      throw error;
    }

    return data as Tables<T>[];
  } catch (error) {
    console.error(`Error in bulk upsert for ${table}:`, error);
    throw error;
  }
};

// Real-time subscription helpers
export const subscribeToTable = <T extends keyof Database["public"]["Tables"]>(
  table: T,
  callback: (payload: any) => void,
  filters?: Record<string, any>,
) => {
  let subscription = supabase
    .channel(`${table}_changes`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table,
      },
      (payload) => {
        callback(payload);
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(subscription);
  };
};

// Advanced filtering
export interface FilterOptions {
  field: string;
  operator:
    | "eq"
    | "neq"
    | "gt"
    | "gte"
    | "lt"
    | "lte"
    | "like"
    | "ilike"
    | "in";
  value: any;
}

export const applyFilters = (query: any, filters: FilterOptions[]) => {
  let filteredQuery = query;

  filters.forEach((filter) => {
    const { field, operator, value } = filter;

    switch (operator) {
      case "eq":
        filteredQuery = filteredQuery.eq(field, value);
        break;
      case "neq":
        filteredQuery = filteredQuery.neq(field, value);
        break;
      case "gt":
        filteredQuery = filteredQuery.gt(field, value);
        break;
      case "gte":
        filteredQuery = filteredQuery.gte(field, value);
        break;
      case "lt":
        filteredQuery = filteredQuery.lt(field, value);
        break;
      case "lte":
        filteredQuery = filteredQuery.lte(field, value);
        break;
      case "like":
        filteredQuery = filteredQuery.like(field, value);
        break;
      case "ilike":
        filteredQuery = filteredQuery.ilike(field, value);
        break;
      case "in":
        filteredQuery = filteredQuery.in(field, value);
        break;
      default:
        break;
    }
  });

  return filteredQuery;
};

// Cache helpers
const cache = new Map<string, { data: any; timestamp: number }>();
const DEFAULT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

export const getCached = async <T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl = DEFAULT_CACHE_TTL,
): Promise<T> => {
  const now = Date.now();
  const cachedItem = cache.get(key);

  if (cachedItem && now - cachedItem.timestamp < ttl) {
    return cachedItem.data as T;
  }

  const data = await fetchFn();
  cache.set(key, { data, timestamp: now });
  return data;
};

export const invalidateCache = (key: string) => {
  cache.delete(key);
};

export const clearCache = () => {
  cache.clear();
};
