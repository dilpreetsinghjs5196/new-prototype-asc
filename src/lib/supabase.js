import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xeqbfrxoozaltcxvitfa.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const db = {
  // Fetch list of surgeons
  async getSurgeons() {
    const { data, error } = await supabase
      .from('surgeons')
      .select('*')
      .order('id', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  // Fetch list of patients
  async getPatients() {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  // Fetch CPT codes list
  async getCPTCodes() {
    const { data, error } = await supabase
      .from('cpt_codes')
      .select('*')
      .order('code', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  // Fetch surgeries, joining surgeon and patient details
  async getSurgeries() {
    const { data, error } = await supabase
      .from('surgeries')
      .select('*, patients(*), surgeons(*)')
      .order('date', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  // Fetch OR Block Schedule
  async getORBlockSchedule() {
    const { data, error } = await supabase
      .from('or_block_schedule')
      .select('*')
      .order('id', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  // Add a new patient
  async addPatient(patient) {
    const { data, error } = await supabase
      .from('patients')
      .insert([patient])
      .select();
    if (error) throw error;
    return data?.[0] || null;
  },

  // Update an existing patient
  async updatePatient(id, updates) {
    const { data, error } = await supabase
      .from('patients')
      .update(updates)
      .eq('id', id)
      .select();
    if (error) throw error;
    return data?.[0] || null;
  },

  // Delete a patient
  async deletePatient(id) {
    const { error } = await supabase
      .from('patients')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  }
};
