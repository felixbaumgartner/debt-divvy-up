
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
    
    console.log('Fetching members for group:', p_group_id);
    
    // First get the current user's ID for reference
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError) {
      console.error('Error getting user:', userError);
      throw userError;
    }
    
    // Get all members of the group
    const { data: groupMembers, error: groupMembersError } = await supabaseClient
      .from('group_members')
      .select('user_id')
      .eq('group_id', p_group_id);
    
    if (groupMembersError) {
      console.error('Error fetching group members:', groupMembersError);
      throw groupMembersError;
    }
    
    console.log('Found group members:', groupMembers);
    
    // Initialize members array with current user if they are a member
    let members = [];
    
    // Check if current user is already a member in the database
    const isCurrentUserMember = groupMembers.some(m => m.user_id === user.id);
    
    if (isCurrentUserMember) {
      members.push({
        id: user.id,
        name: user.user_metadata.name || 'User',
        email: user.email,
        avatarUrl: user.user_metadata.avatar_url
      });
    }
    
    // Get friends data for other members
    for (const member of groupMembers) {
      // Skip if this is the current user (already added)
      if (member.user_id === user.id) continue;
      
      // Try to find member info in profiles table first
      const { data: profile, error: profileError } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', member.user_id)
        .single();
        
      if (!profileError && profile) {
        members.push({
          id: profile.id,
          name: profile.name,
          email: profile.email,
          avatarUrl: profile.avatar_url
        });
        continue;
      }
      
      // If not in profiles, try in friends table
      const { data: friend, error: friendError } = await supabaseClient
        .from('friends')
        .select('*')
        .eq('user_id', user.id)
        .eq('id', member.user_id)
        .single();
      
      if (!friendError && friend) {
        members.push({
          id: friend.id,
          name: friend.friend_name,
          email: friend.friend_email,
          avatarUrl: friend.friend_avatar_url
        });
      } else {
        // If we can't find details, add with generic name
        members.push({
          id: member.user_id,
          name: 'Group Member',
        });
      }
    }
    
    console.log('Final members list:', members);
    
    return new Response(JSON.stringify(members), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in get_group_members:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
