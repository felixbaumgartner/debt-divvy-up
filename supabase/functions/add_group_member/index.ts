
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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', // Use service role key to bypass RLS
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );
    
    // First check if this user already exists in profiles table
    const { data: profileData, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', p_user_id)
      .single();
      
    if (profileError || !profileData) {
      console.error('User profile not found:', profileError);
      
      // Try to get the user from friends table to create a profile
      const { data: friendData, error: friendError } = await supabaseClient
        .from('friends')
        .select('*')
        .eq('id', p_user_id)
        .single();
        
      if (!friendError && friendData) {
        // Create a profile for this friend
        const { error: createProfileError } = await supabaseClient
          .from('profiles')
          .insert({
            id: p_user_id,
            name: friendData.friend_name,
            email: friendData.friend_email,
            avatar_url: friendData.friend_avatar_url
          });
          
        if (createProfileError) {
          console.error('Failed to create profile from friend data:', createProfileError);
          return new Response(
            JSON.stringify({ error: "Could not create user profile" }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } else {
        return new Response(
          JSON.stringify({ error: "User doesn't exist. Please add the user as a friend first." }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
    
    // Check if user is already a member of this group
    const { data: existingMember, error: checkError } = await supabaseClient
      .from('group_members')
      .select('*')
      .eq('group_id', p_group_id)
      .eq('user_id', p_user_id)
      .single();
      
    if (!checkError && existingMember) {
      // User is already a member, return success
      return new Response(
        JSON.stringify({ success: true, message: "User is already a member of this group" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
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
        JSON.stringify({ error: `Failed to add member: ${error.message}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Exception in add_group_member:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
