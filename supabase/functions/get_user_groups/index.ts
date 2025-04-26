
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
    
    // First, get the group IDs that the user is a member of
    const { data: membershipData, error: membershipError } = await supabaseClient
      .from('group_members')
      .select('group_id')
      .eq('user_id', p_user_id);
    
    if (membershipError) {
      console.error('Error fetching group memberships:', membershipError);
      throw membershipError;
    }
    
    // No memberships found
    if (!membershipData || membershipData.length === 0) {
      console.log('No group memberships found for user');
      return new Response(JSON.stringify([]), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Extract group IDs from memberships
    const groupIds = membershipData.map(membership => membership.group_id);
    console.log('User is a member of groups:', groupIds);
    
    // Fetch the actual group data
    const { data: groupsData, error: groupsError } = await supabaseClient
      .from('groups')
      .select('*')
      .in('id', groupIds);
    
    if (groupsError) {
      console.error('Error fetching groups:', groupsError);
      throw groupsError;
    }
    
    console.log('Found groups:', groupsData?.length || 0);
    
    return new Response(JSON.stringify(groupsData || []), {
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
