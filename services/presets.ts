import { ScannerPreset, ScannerCondition, UnifiedQueryRequest } from "@/types/scanner";
import { API_BASE_URL } from "@/constants/api";

export interface PresetCreatePayload {
  name: string;
  description?: string;
  scanner_type?: string;
  version?: number;
  request: UnifiedQueryRequest;
  is_public?: boolean;
  sorting?: any[];
  page_size?: number;
  selected_columns?: string[];
  ui_state?: Record<string, any>;
}

export interface PresetUpdatePayload {
  name?: string;
  description?: string;
  request?: UnifiedQueryRequest;
  version?: number;
  favorite?: boolean;
  is_public?: boolean;
  sorting?: any[];
  page_size?: number;
  selected_columns?: string[];
  ui_state?: Record<string, any>;
}

export interface UserPreset {
  id: string;
  name: string;
  description?: string;
  request: UnifiedQueryRequest;
  favorite: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
  last_used: string | null;
  is_deleted: boolean;
}

export async function fetchUserPresets(scannerType?: string): Promise<UserPreset[]> {
  const url = new URL(`${API_BASE_URL}/presets`, window.location.origin);
  if (scannerType) {
    url.searchParams.append("scanner_type", scannerType);
  }
  
  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error("Failed to fetch user presets");
  }
  return res.json();
}

export async function createPreset(payload: PresetCreatePayload): Promise<UserPreset> {
  const res = await fetch(`${API_BASE_URL}/presets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  
  const data = await res.json();
  if (!res.ok) {
    if (res.status === 409) {
      throw { status: 409, data };
    }
    throw new Error(data.detail || "Failed to create preset");
  }
  return data;
}

export async function updatePreset(id: string, payload: PresetUpdatePayload): Promise<UserPreset> {
  const res = await fetch(`${API_BASE_URL}/presets/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  
  if (!res.ok) {
    throw new Error("Failed to update preset");
  }
  return res.json();
}

export async function deletePreset(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/presets/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error("Failed to delete preset");
  }
}

export async function usePresetApi(id: string): Promise<UserPreset> {
  const res = await fetch(`${API_BASE_URL}/presets/${id}/use`, {
    method: "POST",
  });
  if (!res.ok) {
    throw new Error("Failed to mark preset as used");
  }
  return res.json();
}
