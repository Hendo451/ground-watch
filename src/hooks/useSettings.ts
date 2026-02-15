import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Settings {
  id: string;
  default_warmup_minutes: number;
  upcoming_days_window: number;
  countdown_duration_minutes: number;
  sms_alerts_enabled: boolean;
  updated_at: string;
}

export const useSettings = () => {
  return useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settings' as any)
        .select('*')
        .limit(1)
        .single();
      if (error) throw error;
      return data as unknown as Settings;
    },
  });
};

export const useUpdateSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (updates: Partial<Settings> & { id: string }) => {
      const { id, ...rest } = updates;
      const { data, error } = await supabase
        .from('settings' as any)
        .update(rest)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as Settings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Settings saved');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};
