import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export const useList = <T = any>(table: string, order = "created_at") =>
  useQuery({
    queryKey: [table],
    queryFn: async () => {
      const { data, error } = await supabase.from(table as any).select("*").order(order, { ascending: false });
      if (error) throw error;
      return (data ?? []) as T[];
    },
  });
