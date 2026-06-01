import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Perform a relational query pulling cases and their matching penal classifications
    const { data, error } = await supabase
      .from('cases')
      .select(`
        ddl_case_id,
        date_of_filing,
        type_name,
        state_code,
        acts_sections (
          act,
          bailable_ipc,
          criminal,
          number_sections_ipc
        )
      `)
      .limit(200); // Fetch a manageable chunk for the real-time presentation engine

    if (error) throw error;

    return NextResponse.json({ success: true, cases: data });
  } catch (error) {
    console.error('Database query failure:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}