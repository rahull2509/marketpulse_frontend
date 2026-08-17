/**
 * Base API client for all service modules.
 *
 * Provides typed fetch wrapper with error handling and
 * consistent response parsing matching the backend envelope.
 */

import type { ApiResponse } from "@/types/api";

const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
};

interface RequestOptions extends RequestInit {
  timeout?: number;
  retries?: number;
}

const DEFAULT_TIMEOUT = 15000; // 15 seconds
const DEFAULT_RETRIES = 2; // Total 3 attempts

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = "") {
    this.baseUrl = baseUrl;
  }

  private async fetchWithTimeoutAndRetry(
    url: string,
    options: RequestOptions
  ): Promise<Response> {
    const { timeout = DEFAULT_TIMEOUT, retries = DEFAULT_RETRIES, ...fetchOptions } = options;
    let attempt = 0;
    
    while (attempt <= retries) {
      try {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);
        
        const response = await fetch(url, {
          ...fetchOptions,
          signal: controller.signal,
        });
        
        clearTimeout(id);
        
        // Retry on 5xx server errors or 429 Too Many Requests
        if (!response.ok && (response.status >= 500 || response.status === 429) && attempt < retries) {
          throw new Error(`Server returned ${response.status}`);
        }
        
        return response;
      } catch (error: any) {
        attempt++;
        if (attempt > retries) {
          if (error.name === "AbortError") {
            throw new ApiError("Request timed out", "TIMEOUT", 408);
          }
          throw error;
        }
        // Exponential backoff: 500ms, 1000ms, 2000ms...
        const backoff = Math.min(500 * Math.pow(2, attempt - 1), 5000);
        await new Promise((resolve) => setTimeout(resolve, backoff));
      }
    }
    
    throw new Error("Unreachable");
  }

  async get<T>(endpoint: string, params?: Record<string, string>, options?: RequestOptions): Promise<ApiResponse<T>> {
    const url = new URL(endpoint, window.location.origin);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          url.searchParams.set(key, value);
        }
      });
    }

    try {
      const response = await this.fetchWithTimeoutAndRetry(url.toString(), {
        method: "GET",
        headers: DEFAULT_HEADERS,
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new ApiError(
          errorData?.error?.message || `Request failed with status ${response.status}`,
          errorData?.error?.code || "NETWORK_ERROR",
          response.status,
        );
      }

      return response.json();
    } catch (error: any) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(error.message || "Network request failed", "NETWORK_ERROR", 0);
    }
  }

  async post<T>(endpoint: string, body: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    try {
      const response = await this.fetchWithTimeoutAndRetry(endpoint, {
        method: "POST",
        headers: DEFAULT_HEADERS,
        body: JSON.stringify(body),
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new ApiError(
          errorData?.error?.message || `Request failed with status ${response.status}`,
          errorData?.error?.code || "NETWORK_ERROR",
          response.status,
        );
      }

      return response.json();
    } catch (error: any) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(error.message || "Network request failed", "NETWORK_ERROR", 0);
    }
  }
}

export class ApiError extends Error {
  code: string;
  status: number;

  constructor(message: string, code: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

export const api = new ApiClient();
