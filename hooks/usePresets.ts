import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchUserPresets,
  createPreset,
  updatePreset,
  deletePreset,
  usePresetApi,
  UserPreset,
  PresetCreatePayload,
  PresetUpdatePayload
} from "@/services/presets";

export function usePresets(scannerType?: string) {
  return useQuery<UserPreset[]>({
    queryKey: ["user-presets", scannerType],
    queryFn: () => fetchUserPresets(scannerType),
  });
}

export function useCreatePreset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPreset,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-presets"] });
    },
  });
}

export function useUpdatePreset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: PresetUpdatePayload }) => 
      updatePreset(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-presets"] });
    },
  });
}

export function useDeletePreset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deletePreset,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-presets"] });
    },
  });
}

export function useMarkPresetUsed() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: usePresetApi,
    onSuccess: () => {
      // Intentionally avoiding immediate invalidate to prevent UI jumps,
      // the usage count will refresh next time they load.
    },
  });
}
