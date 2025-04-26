
// Add group member function
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
    const { p_group_id, p_user_id } = await req.json();
    
    if (!p_group_id || !p_user_id) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters: p_group_id and p_user_id are required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );
    
    console.log(`Adding member ${p_user_id} to group ${p_group_id}`);
    
    // First ensure user exists in profiles table
    const { data: profileData, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', p_user_id)
      .single();
      
    if (profileError) {
      console.log('Profile not found, checking friends table');
      
      // Get friend data
      const { data: friendData, error: friendError } = await supabaseClient
        .from('friends')
        .select('*')
        .eq('id', p_user_id)
        .single();
        
      if (friendError) {
        console.error('Error fetching friend data:', friendError);
        return new Response(
          JSON.stringify({ error: "User not found in profiles or friends" }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Creating profile from friend data:', friendData);
      
      // Create profile from friend data
      const { error: createProfileError } = await supabaseClient
        .from('profiles')
        .insert({
          id: p_user_id,
          name: friendData.friend_name,
          email: friendData.friend_email,
          avatar_url: friendData.friend_avatar_url
        });
        
      if (createProfileError) {
        console.error('Failed to create profile:', createProfileError);
        return new Response(
          JSON.stringify({ error: "Could not create user profile", details: createProfileError }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      console.log('Profile created successfully');
    }
    
    // Check if already a member
    const { data: existingMember, error: checkError } = await supabaseClient
      .from('group_members')
      .select('*')
      .eq('group_id', p_group_id)
      .eq('user_id', p_user_id)
      .single();
      
    if (!checkError && existingMember) {
      console.log('User is already a member');
      return new Response(
        JSON.stringify({ success: true, message: "User is already a member of this group" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('Adding user to group_members');
    
    // Insert the group member
    const { error } = await supabaseClient
      .from('group_members')
      .insert({
        group_id: p_group_id,
        user_id: p_user_id,
      });
    
    if (error) {
      console.error('Error adding user to group_members:', error);
      return new Response(
        JSON.stringify({ error: `Failed to add member: ${error.message}`, details: error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('Successfully added user to group');
    
    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Exception in add_group_member:', error);
    return new Response(
      JSON.stringify({ error: error.message, stack: error.stack }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
