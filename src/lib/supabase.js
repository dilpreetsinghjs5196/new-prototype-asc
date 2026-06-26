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
  },

  // Add a new surgeon
  async addSurgeon(surgeon) {
    const { data, error } = await supabase
      .from('surgeons')
      .insert([surgeon])
      .select();
    if (error) throw error;
    return data?.[0] || null;
  },

  // Update an existing surgeon
  async updateSurgeon(id, updates) {
    const { data, error } = await supabase
      .from('surgeons')
      .update(updates)
      .eq('id', id)
      .select();
    if (error) throw error;
    return data?.[0] || null;
  },

  // Delete a surgeon
  async deleteSurgeon(id) {
    const { error } = await supabase
      .from('surgeons')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  },

  // Add a new surgery
  async addSurgery(surgery) {
    const { data, error } = await supabase
      .from('surgeries')
      .insert([surgery])
      .select();
    if (error) throw error;
    return data?.[0] || null;
  },

  // Update an existing surgery
  async updateSurgery(id, updates) {
    const { data, error } = await supabase
      .from('surgeries')
      .update(updates)
      .eq('id', id)
      .select();
    if (error) throw error;
    return data?.[0] || null;
  },

  // Delete a surgery
  async deleteSurgery(id) {
    const { error } = await supabase
      .from('surgeries')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  },

  // Add a new OR block schedule
  async addORBlockSchedule(schedule) {
    const { data, error } = await supabase
      .from('or_block_schedule')
      .insert([schedule])
      .select()
      .single();
    if (error) throw error;
    return data || null;
  },

  // Update an existing OR block schedule
  async updateORBlockSchedule(id, updates) {
    const { data, error } = await supabase
      .from('or_block_schedule')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data || null;
  },

  // Delete an OR block schedule
  async deleteORBlockSchedule(id) {
    const { error } = await supabase
      .from('or_block_schedule')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  },

  // Fetch CPT codes list with server-side filtering, search, and pagination
  async getCPTCodesPaged({ search = '', category = 'All', page = 1, limit = 10 }) {
    let query = supabase
      .from('cpt_codes')
      .select('*', { count: 'exact' });

    if (search) {
      query = query.or(`code.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (category && category !== 'All') {
      query = query.eq('category', category);
    }

    query = query.order('code', { ascending: true });

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, count, error } = await query;
    if (error) throw error;

    return {
      cptCodes: data || [],
      totalCount: count || 0
    };
  },

  // Add a new CPT code
  async addCPTCode(cpt) {
    const { data: maxData, error: maxError } = await supabase
      .from('cpt_codes')
      .select('id')
      .order('id', { ascending: false })
      .limit(1);
    if (maxError) throw maxError;
    const maxId = maxData.length > 0 ? maxData[0].id : 0;
    const nextId = maxId + 1;

    const payload = {
      ...cpt,
      id: nextId,
      reimbursement: cpt.reimbursement !== null && cpt.reimbursement !== undefined ? cpt.reimbursement : 0,
      cost: cpt.cost !== null && cpt.cost !== undefined ? cpt.cost : 0,
      gross_charge: cpt.gross_charge !== null && cpt.gross_charge !== undefined ? cpt.gross_charge : 0,
      average_duration: cpt.average_duration !== null && cpt.average_duration !== undefined ? cpt.average_duration : 0,
      turnover_time: cpt.turnover_time !== null && cpt.turnover_time !== undefined ? cpt.turnover_time : 0
    };

    const { data, error } = await supabase
      .from('cpt_codes')
      .insert([payload])
      .select();
    if (error) throw error;
    return data?.[0] || null;
  },

  // Update an existing CPT code
  async updateCPTCode(id, updates) {
    const payload = { ...updates };
    if (updates.reimbursement === null || updates.reimbursement === undefined) payload.reimbursement = 0;
    if (updates.cost === null || updates.cost === undefined) payload.cost = 0;
    if (updates.gross_charge === null || updates.gross_charge === undefined) payload.gross_charge = 0;
    if (updates.average_duration === null || updates.average_duration === undefined) payload.average_duration = 0;
    if (updates.turnover_time === null || updates.turnover_time === undefined) payload.turnover_time = 0;

    const { data, error } = await supabase
      .from('cpt_codes')
      .update(payload)
      .eq('id', id)
      .select();
    if (error) throw error;
    return data?.[0] || null;
  },

  // Delete a CPT code
  async deleteCPTCode(id) {
    const { error } = await supabase
      .from('cpt_codes')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  }
};
