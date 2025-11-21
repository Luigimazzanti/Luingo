import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../utils/supabase/info';

const supabaseUrl = `https://${projectId}.supabase.co`;
export const supabase = createClient(supabaseUrl, publicAnonKey);

const TABLE_NAME = 'kv_store_ebbb5c67';

export const db = {
  get: async (key: string) => {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('value')
      .eq('key', key)
      .maybeSingle();
    
    if (error) {
      console.error('DB Get Error:', error);
      return null;
    }
    return data?.value || null;
  },

  set: async (key: string, value: any) => {
    const { error } = await supabase
      .from(TABLE_NAME)
      .upsert({ key, value });
    
    if (error) {
      // Handle RLS (Row Level Security) Policy violations gracefully
      if (error.code === '42501') {
        // Silently ignore RLS violations as we fallback to local state
        // This prevents console noise in demo environments
        return false;
      }
      console.error('DB Set Error:', error);
      return false;
    }
    return true;
  },
  
  delete: async (key: string) => {
      const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('key', key);
      
      if (error) {
        console.error('DB Delete Error:', error);
        return false;
      }
      return true;
  },
  
  getByPrefix: async (prefix: string) => {
      const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('key, value')
      .like('key', `${prefix}%`);
      
      if (error) {
          console.error('DB Prefix Error:', error);
          return [];
      }
      return data?.map(d => d.value) || [];
  },

  // Helper to subscribe to a specific key
  subscribe: (key: string, callback: (value: any) => void) => {
    const channel = supabase
      .channel(`watch-${key}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: TABLE_NAME,
          filter: `key=eq.${key}`,
        },
        (payload: any) => {
            if (payload.eventType === 'DELETE') {
                callback(null);
            } else {
                callback(payload.new.value);
            }
        }
      )
      .subscribe();
      
    return () => {
        supabase.removeChannel(channel);
    };
  }
};
