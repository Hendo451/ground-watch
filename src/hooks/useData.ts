import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Venue {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  safe_zone_radius: number;
  created_at: string;
  updated_at: string;
}

export interface Official {
  id: string;
  name: string;
  mobile: string;
  venue_id: string | null;
  alerts_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface Game {
  id: string;
  name: string | null;
  venue_id: string;
  start_time: string;
  end_time: string;
  status: 'green' | 'orange' | 'red';
  countdown_end: string | null;
  last_strike_distance: number | null;
  last_strike_at: string | null;
  created_at: string;
  updated_at: string;
}

export const useVenues = () => {
  return useQuery({
    queryKey: ['venues'],
    queryFn: async () => {
      const { data, error } = await supabase.from('venues').select('*').order('name');
      if (error) throw error;
      return data as Venue[];
    },
  });
};

export const useOfficials = () => {
  return useQuery({
    queryKey: ['officials'],
    queryFn: async () => {
      const { data, error } = await supabase.from('officials').select('*').order('name');
      if (error) throw error;
      return data as Official[];
    },
  });
};

export const useGames = () => {
  return useQuery({
    queryKey: ['games'],
    queryFn: async () => {
      const { data, error } = await supabase.from('games').select('*').order('start_time', { ascending: false });
      if (error) throw error;
      return data as Game[];
    },
  });
};

export const useAddVenue = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (venue: { name: string; latitude: number; longitude: number; safe_zone_radius: number }) => {
      const { data, error } = await supabase.from('venues').insert(venue).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['venues'] });
      toast.success('Venue added successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useAddOfficial = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (official: { name: string; mobile: string; venue_id: string | null }) => {
      const { data, error } = await supabase.from('officials').insert({ ...official, alerts_enabled: true }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['officials'] });
      toast.success('Official added successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useAddGame = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (game: { name?: string; venue_id: string; start_time: string; end_time: string }) => {
      const { data, error } = await supabase.from('games').insert({ ...game, status: 'green' }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['games'] });
      toast.success('Game scheduled successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useUpdateGame = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (game: { id: string; name?: string; start_time?: string; end_time?: string }) => {
      const { id, ...updates } = game;
      const { data, error } = await supabase.from('games').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['games'] });
      toast.success('Game updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useDeleteGame = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('games').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['games'] });
      toast.success('Game deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useBulkAddGames = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (games: { name?: string; venue_id: string; start_time: string; end_time: string }[]) => {
      const gamesWithStatus = games.map(g => ({ ...g, status: 'green' as const }));
      const { data, error } = await supabase.from('games').insert(gamesWithStatus).select();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['games'] });
      toast.success(`${data.length} games imported successfully`);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};
