
// Get user groups function
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const { p_user_id } = await req.json();
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );
    
    console.log('Fetching groups for user:', p_user_id);
    
    // Get groups where the user is a member
    const { data: memberData, error: memberError } = await supabaseClient
      .from('group_members')
      .select('group_id')
      .eq('user_id', p_user_id);
    
    if (memberError) {
      console.error('Error fetching group memberships:', memberError);
      throw memberError;
    }
    
    console.log('Found memberships:', memberData);
    
    if (!memberData || memberData.length === 0) {
      console.log('No groups found for this user');
      return new Response(JSON.stringify([]), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Get the group IDs
    const groupIds = memberData.map(item => item.group_id);
    
    // Fetch the actual groups
    const { data: groups, error: groupsError } = await supabaseClient
      .from('groups')
      .select('*')
      .in('id', groupIds);
    
    if (groupsError) {
      console.error('Error fetching groups:', groupsError);
      throw groupsError;
    }
    
    console.log('Groups fetched:', groups);
    
    return new Response(JSON.stringify(groups), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in get_user_groups:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
