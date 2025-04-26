
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
    
    // Get all formal members of the group from group_members
    const { data: groupMembers, error: groupMembersError } = await supabaseClient
      .from('group_members')
      .select('user_id')
      .eq('group_id', p_group_id);
    
    if (groupMembersError) {
      console.error('Error fetching group members:', groupMembersError);
      throw groupMembersError;
    }
    
    // Get all users who have participated in expenses for this group but might not be formal members
    const { data: expenseParticipants, error: expenseParticipantsError } = await supabaseClient
      .from('expense_participants')
      .select('user_id, expenses!inner(group_id)')
      .eq('expenses.group_id', p_group_id);
    
    if (expenseParticipantsError) {
      console.error('Error fetching expense participants:', expenseParticipantsError);
      throw expenseParticipantsError;
    }
    
    // Combine both sets of user IDs into a unique set
    const memberIds = new Set();
    
    // Add formal group members
    groupMembers.forEach(member => {
      memberIds.add(member.user_id);
    });
    
    // Add expense participants
    expenseParticipants.forEach(participant => {
      memberIds.add(participant.user_id);
    });
    
    // Get users who paid for expenses in this group
    const { data: expensePayers, error: expensePayersError } = await supabaseClient
      .from('expenses')
      .select('paid_by')
      .eq('group_id', p_group_id);
    
    if (expensePayersError) {
      console.error('Error fetching expense payers:', expensePayersError);
      throw expensePayersError;
    }
    
    // Add expense payers
    expensePayers.forEach(expense => {
      memberIds.add(expense.paid_by);
    });
    
    console.log('Combined member IDs:', Array.from(memberIds));
    
    // Initialize members array
    let members = [];
    
    // Process all the member IDs
    for (const userId of memberIds) {
      // Skip processing if we've already added this user
      if (members.some(m => m.id === userId)) continue;
      
      // Special handling for current user
      if (userId === user.id) {
        members.push({
          id: user.id,
          name: user.user_metadata.name || 'User',
          email: user.email,
          avatarUrl: user.user_metadata.avatar_url
        });
        continue;
      }
      
      // Try to find member info in profiles table first
      const { data: profile, error: profileError } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', userId)
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
        .eq('id', userId)
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
          id: userId,
          name: 'Group Member',
        });
      }
    }
    
    console.log('Final members list:', members);
    
    // For every expense participant who is not in the group_members table yet, add them
    for (const userId of memberIds) {
      // Check if they're already a formal group member
      const isFormalMember = groupMembers.some(member => member.user_id === userId);
      
      // If not, add them to the group_members table
      if (!isFormalMember) {
        const { error: addMemberError } = await supabaseClient
          .from('group_members')
          .insert({
            group_id: p_group_id,
            user_id: userId
          })
          .single();
        
        if (addMemberError) {
          console.warn(`Error adding user ${userId} to group_members:`, addMemberError);
          // Continue execution even if this fails
        } else {
          console.log(`Added user ${userId} to group_members`);
        }
      }
    }
    
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
