
// Get group members function
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
    const { p_group_id } = await req.json();
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );
    
    // First get the current user's ID for reference
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError) throw userError;
    
    // Get all members of the group
    const { data: memberIds, error: membersError } = await supabaseClient
      .from('group_members')
      .select('user_id')
      .eq('group_id', p_group_id);
    
    if (membersError) throw membersError;
    
    // Initialize members array with current user
    let members = [{
      id: user.id,
      name: user.user_metadata.name || 'User',
      email: user.email,
      avatarUrl: user.user_metadata.avatar_url
    }];
    
    // Get friends data for other members
    const otherMemberIds = memberIds
      .filter(m => m.user_id !== user.id)
      .map(m => m.user_id);
    
    if (otherMemberIds.length > 0) {
      const { data: friends, error: friendsError } = await supabaseClient
        .from('friends')
        .select('*')
        .eq('user_id', user.id)
        .in('id', otherMemberIds);
      
      if (!friendsError && friends && friends.length > 0) {
        const friendMembers = friends.map(friend => ({
          id: friend.id,
          name: friend.friend_name,
          email: friend.friend_email,
          avatarUrl: friend.friend_avatar_url,
        }));
        members = [...members, ...friendMembers];
      }
    }
    
    return new Response(JSON.stringify(members), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
