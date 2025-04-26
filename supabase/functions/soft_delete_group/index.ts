
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createAdminClient } from '../_shared/db-utils.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const { group_id, deleted_at } = await req.json();
    
    if (!group_id) {
      throw new Error('Group ID is required');
    }
    
    const supabaseAdmin = createAdminClient();
    
    // Call the soft_delete_group function
    const { data, error } = await supabaseAdmin.rpc('soft_delete_group', {
      p_group_id: group_id,
      p_deleted_at: deleted_at || new Date().toISOString()
    });
    
    if (error) {
      throw error;
    }
    
    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in soft_delete_group:', error.message);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
