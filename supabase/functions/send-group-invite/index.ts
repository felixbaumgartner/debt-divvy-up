
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { friendName, friendEmail, groupName, inviterName } = await req.json();

    // Input validation
    if (!friendEmail) {
      console.error('Missing required field: friendEmail');
      throw new Error('Friend email is required');
    }

    if (!groupName) {
      console.error('Missing required field: groupName');
      throw new Error('Group name is required');
    }

    console.log(`Sending email to ${friendEmail} for group "${groupName}" invite from ${inviterName}`);

    const emailResponse = await resend.emails.send({
      from: "Debt Divvy-Up <onboarding@resend.dev>",
      to: [friendEmail],
      subject: `${inviterName || 'Someone'} added you to ${groupName} on Debt Divvy-Up`,
      html: `
        <h1>You've been added to a group!</h1>
        <p>Hello ${friendName || 'there'},</p>
        <p>${inviterName || 'Someone'} has added you to the group "${groupName}" on Debt Divvy-Up.</p>
        <p>You can now start tracking and splitting expenses with your group members.</p>
        <p>Best regards,<br>The Debt Divvy-Up Team</p>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });
  } catch (error) {
    console.error('Error in send-group-invite function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
