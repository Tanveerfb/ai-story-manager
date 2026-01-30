import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper functions for common queries

export async function getStoryParts(limit?: number) {
  const query = supabase
    .from('story_parts')
    .select('*')
    .order('part_number', { ascending: true });
  
  if (limit) {
    query.limit(limit);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  return data;
}

export async function getCharacters(roleFilter?: string) {
  let query = supabase
    .from('characters')
    .select('*')
    .order('name', { ascending: true });
  
  if (roleFilter) {
    query = query.eq('role', roleFilter);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  return data;
}

export async function getCharacterById(id: string) {
  const { data, error } = await supabase
    .from('characters')
    .select(`
      *,
      character_traits (*),
      relationships:relationships!character_1_id (*)
    `)
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
}

export async function getLocations() {
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .order('name', { ascending: true });
  
  if (error) throw error;
  return data;
}

export async function getEvents(filters?: {
  storyPartId?: string;
  characterId?: string;
  locationId?: string;
}) {
  let query = supabase
    .from('events')
    .select('*, story_parts(*), characters(*), locations(*)');
  
  if (filters?.storyPartId) {
    query = query.eq('story_part_id', filters.storyPartId);
  }
  if (filters?.characterId) {
    query = query.eq('character_id', filters.characterId);
  }
  if (filters?.locationId) {
    query = query.eq('location_id', filters.locationId);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  return data;
}

export async function insertStoryPart(storyPart: {
  part_number: number;
  title?: string;
  content: string;
  word_count?: number;
  summary?: string;
}) {
  const { data, error } = await supabase
    .from('story_parts')
    .insert(storyPart)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function insertCharacter(character: any) {
  const { data, error } = await supabase
    .from('characters')
    .insert(character)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function insertLocation(location: any) {
  const { data, error } = await supabase
    .from('locations')
    .insert(location)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function insertEvent(event: any) {
  const { data, error } = await supabase
    .from('events')
    .insert(event)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function insertRelationship(relationship: any) {
  const { data, error } = await supabase
    .from('relationships')
    .insert(relationship)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}
