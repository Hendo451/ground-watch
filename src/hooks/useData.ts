import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type SportIntensity = 'category_1' | 'category_2' | 'category_3';
export type HeatStatus = 'low' | 'moderate' | 'high' | 'extreme';

export interface Venue {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  safe_zone_radius: number;
  sport_intensity: SportIntensity;
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
  grade_id: string | null;
  start_time: string;
  end_time: string;
  status: 'green' | 'orange' | 'red';
  countdown_end: string | null;
  last_strike_distance: number | null;
  last_strike_at: string | null;
  warmup_minutes: number;
  heat_status: HeatStatus;
  last_temp_c: number | null;
  last_humidity: number | null;
  last_heat_check_at: string | null;
  weather_icon: string | null;
  lightning_forecast: string;
  created_at: string;
  updated_at: string;
}

export interface Grade {
  id: string;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Training {
  id: string;
  name: string;
  venue_id: string | null;
  grade_id: string | null;
  day_of_week: number;
  start_time: string;
  end_time: string;
  start_date: string;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface TrainingException {
  id: string;
  training_id: string;
  exception_date: string;
  is_cancelled: boolean;
  override_start_time: string | null;
  override_end_time: string | null;
  override_venue_id: string | null;
  reason: string | null;
  created_at: string;
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
    mutationFn: async (venue: { name: string; latitude: number; longitude: number; safe_zone_radius: number; sport_intensity?: SportIntensity }) => {
      const { data, error } = await supabase.from('venues').insert({
        ...venue,
        sport_intensity: venue.sport_intensity || 'category_1'
      }).select().single();
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
    mutationFn: async (game: { name?: string; venue_id: string; grade_id?: string; start_time: string; end_time: string; warmup_minutes?: number }) => {
      const { data, error } = await supabase.from('games').insert({ 
        ...game, 
        status: 'green',
        warmup_minutes: game.warmup_minutes ?? 45
      }).select().single();
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

export interface LightningStrike {
  id: string;
  game_id: string;
  venue_id: string;
  latitude: number;
  longitude: number;
  distance_km: number;
  detected_at: string;
  strike_type: string | null;
  peak_amperage: number | null;
}

export const useLightningStrikes = (gameId: string | null) => {
  const queryClient = useQueryClient();

  useQuery({
    queryKey: ['lightning_strikes', gameId],
    enabled: !!gameId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lightning_strikes')
        .select('*')
        .eq('game_id', gameId!)
        .order('detected_at', { ascending: false });
      if (error) throw error;
      return data as LightningStrike[];
    },
  });

  // Subscribe to realtime
  useQuery({
    queryKey: ['lightning_strikes_realtime_sub', gameId],
    enabled: !!gameId,
    queryFn: () => {
      const channel = supabase
        .channel(`strikes-${gameId}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'lightning_strikes', filter: `game_id=eq.${gameId}` },
          () => {
            queryClient.invalidateQueries({ queryKey: ['lightning_strikes', gameId] });
          }
        )
        .subscribe();
      return { channel };
    },
    staleTime: Infinity,
  });

  // Return the query result
  return useQuery({
    queryKey: ['lightning_strikes', gameId],
    enabled: !!gameId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lightning_strikes')
        .select('*')
        .eq('game_id', gameId!)
        .order('detected_at', { ascending: false });
      if (error) throw error;
      return data as LightningStrike[];
    },
  });
};

export const useUpdateGame = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (game: { id: string; name?: string; start_time?: string; end_time?: string; warmup_minutes?: number }) => {
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
    mutationFn: async (games: { name?: string; venue_id: string; grade_id?: string; start_time: string; end_time: string; warmup_minutes?: number }[]) => {
      const gamesWithDefaults = games.map(g => ({ 
        ...g, 
        status: 'green' as const,
        warmup_minutes: g.warmup_minutes ?? 45
      }));
      const { data, error } = await supabase.from('games').insert(gamesWithDefaults).select();
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

// Grades hooks
export const useGrades = () => {
  return useQuery({
    queryKey: ['grades'],
    queryFn: async () => {
      const { data, error } = await supabase.from('grades').select('*').order('sort_order');
      if (error) throw error;
      return data as Grade[];
    },
  });
};

export const useAddGrade = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (grade: { name: string; sort_order?: number }) => {
      const { data, error } = await supabase.from('grades').insert(grade).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grades'] });
      toast.success('Grade added successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useUpdateGrade = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (grade: { id: string; name?: string; sort_order?: number }) => {
      const { id, ...updates } = grade;
      const { data, error } = await supabase.from('grades').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grades'] });
      toast.success('Grade updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useDeleteGrade = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('grades').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grades'] });
      toast.success('Grade deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

// Trainings hooks
export const useTrainings = () => {
  return useQuery({
    queryKey: ['trainings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('trainings').select('*').order('day_of_week');
      if (error) throw error;
      return data as Training[];
    },
  });
};

export const useAddTraining = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (training: { 
      name: string; 
      venue_id?: string; 
      grade_id?: string;
      day_of_week: number; 
      start_time: string; 
      end_time: string; 
      start_date: string;
      end_date?: string;
    }) => {
      const { data, error } = await supabase.from('trainings').insert(training).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainings'] });
      toast.success('Training schedule added');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useUpdateTraining = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (training: { 
      id: string; 
      name?: string; 
      venue_id?: string; 
      grade_id?: string;
      day_of_week?: number; 
      start_time?: string; 
      end_time?: string;
      start_date?: string;
      end_date?: string | null;
    }) => {
      const { id, ...updates } = training;
      const { data, error } = await supabase.from('trainings').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainings'] });
      toast.success('Training updated');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useDeleteTraining = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('trainings').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainings'] });
      toast.success('Training deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

// Training exceptions hooks
export const useTrainingExceptions = () => {
  return useQuery({
    queryKey: ['training_exceptions'],
    queryFn: async () => {
      const { data, error } = await supabase.from('training_exceptions').select('*').order('exception_date');
      if (error) throw error;
      return data as TrainingException[];
    },
  });
};

export const useAddTrainingException = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (exception: { 
      training_id: string; 
      exception_date: string; 
      is_cancelled?: boolean;
      override_start_time?: string;
      override_end_time?: string;
      override_venue_id?: string;
      reason?: string;
    }) => {
      const { data, error } = await supabase.from('training_exceptions').insert(exception).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training_exceptions'] });
      toast.success('Training exception added');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useDeleteTrainingException = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('training_exceptions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training_exceptions'] });
      toast.success('Exception removed');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};
