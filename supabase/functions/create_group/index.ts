
// Create group function
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
    const { group_id, group_name, group_description, creator_id } = await req.json();
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );
    
    // Insert the group
    const { error: groupError } = await supabaseClient
      .from('groups')
      .insert({
        id: group_id,
        name: group_name,
        description: group_description,
        created_by: creator_id,
      });
    
    if (groupError) {
      console.error('Error creating group:', groupError);
      throw groupError;
    }
    
    // Add the creator as a member of the group
    const { error: memberError } = await supabaseClient
      .from('group_members')
      .insert({
        group_id: group_id,
        user_id: creator_id
      });
    
    if (memberError) {
      console.error('Error adding creator as member:', memberError);
      throw memberError;
    }
    
    console.log(`Group ${group_id} created successfully with creator ${creator_id} as member`);
    
    return new Response(JSON.stringify({ 
      success: true,
      group: {
        id: group_id,
        name: group_name,
        description: group_description,
        created_by: creator_id
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in create_group function:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
