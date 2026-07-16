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

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = "") {
    this.baseUrl = baseUrl;
  }

  async get<T>(endpoint: string, params?: Record<string, string>): Promise<ApiResponse<T>> {
    const url = new URL(endpoint, window.location.origin);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          url.searchParams.set(key, value);
        }
      });
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: DEFAULT_HEADERS,
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
  }

  async post<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: DEFAULT_HEADERS,
      body: JSON.stringify(body),
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
