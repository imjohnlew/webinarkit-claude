import { supabase } from '../config/supabase';
import type { Webinar, CreateWebinarBody, UpdateWebinarBody } from '../types';

export const webinarService = {
  async list(): Promise<Webinar[]> {
    const { data, error } = await supabase
      .from('webinars')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data as Webinar[];
  },

  async getById(id: string): Promise<Webinar | null> {
    const { data, error } = await supabase
      .from('webinars')
      .select('*')
      .eq('id', id)
      .single();
    if (error && error.code === 'PGRST116') return null;
    if (error) throw new Error(error.message);
    return data as Webinar;
  },

  async create(body: CreateWebinarBody): Promise<Webinar> {
    const { data, error } = await supabase
      .from('webinars')
      .insert({
        title: body.title,
        description: body.description ?? null,
        video_url: body.video_url,
        host_name: body.host_name,
        host_email: body.host_email,
        host_bio: body.host_bio ?? null,
        cover_image_url: body.cover_image_url ?? null,
        status: 'draft',
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as Webinar;
  },

  async update(id: string, body: UpdateWebinarBody): Promise<Webinar | null> {
    const { data, error } = await supabase
      .from('webinars')
      .update(body)
      .eq('id', id)
      .select()
      .single();
    if (error && error.code === 'PGRST116') return null;
    if (error) throw new Error(error.message);
    return data as Webinar;
  },

  async delete(id: string): Promise<boolean> {
    const { error, count } = await supabase
      .from('webinars')
      .delete({ count: 'exact' })
      .eq('id', id);
    if (error) throw new Error(error.message);
    return (count ?? 0) > 0;
  },
};
