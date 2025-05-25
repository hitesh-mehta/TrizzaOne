
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
    const { query } = await req.json();
    
    const geminiApiKey = 'AIzaSyBGK_9Tpv2PorkIfIBrmOvNAtLTqkH5Meg';
    
    // Database schema information
    const dbSchema = `
    Database Schema for TrizzaOne Restaurant Management System:

    1. profiles table:
    - id (uuid, primary key)
    - first_name (text)
    - last_name (text)
    - created_at (timestamp)
    - updated_at (timestamp)

    2. dishes table:
    - dish_id (bigint, primary key)
    - dish_name (text, not null)
    - dish_price (real, not null)

    3. food_history table:
    - dish_name (text, not null)
    - timestamp (timestamp with time zone, not null)
    - quantity_prepared (bigint)
    - quantity_consumed (bigint)
    - water_consumption (double precision)
    - gas_consumption (double precision)
    - order_price (bigint)
    - food_rating (double precision)

    4. iot_data table:
    - id (uuid, primary key)
    - timestamp (timestamp with time zone, not null)
    - zone (enum type)
    - floor (integer, not null)
    - temperature (numeric, not null)
    - humidity (numeric, not null)
    - co2_level (numeric, not null)
    - light_level (double precision, not null)
    - occupancy_count (integer, not null)
    - motion_detected (enum type)
    - air_purifier_status (enum type)
    - fire_alarm_triggered (enum type)
    - gas_leak_detected (enum type)
    - power_status (enum type)
    - energy_consumed_kwh (double precision, not null)
    - battery_backup_level (double precision, not null)
    - cleaning_status (enum type)
    - last_cleaned_timestamp (timestamp with time zone)
    - created_at (timestamp with time zone, not null)
    `;

    const prompt = `
    You are Botato, a helpful database assistant for a restaurant management system. 
    
    Database Schema:
    ${dbSchema}

    User Query: "${query}"

    Instructions:
    1. Generate ONLY a PostgreSQL SELECT query based on the user's question
    2. Do NOT include any INSERT, UPDATE, DELETE, or DDL statements
    3. Use proper PostgreSQL syntax
    4. Return only the SQL query, nothing else
    5. If the query cannot be answered with the available tables, respond with "Sorry, I cannot find that information in the available data."
    6. Make sure the query is safe and only retrieves data

    Generate a PostgreSQL SELECT query:
    `;

    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      }),
    });

    if (!geminiResponse.ok) {
      throw new Error('Failed to get response from Gemini');
    }

    const geminiData = await geminiResponse.json();
    const generatedQuery = geminiData.candidates[0]?.content?.parts[0]?.text?.trim();

    if (!generatedQuery || generatedQuery.includes('Sorry, I cannot find')) {
      return new Response(JSON.stringify({ 
        response: "Sorry, I cannot find that information in the available data." 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate that it's only a SELECT query
    const cleanQuery = generatedQuery.replace(/```sql\n?|\n?```/g, '').trim();
    if (!cleanQuery.toLowerCase().startsWith('select')) {
      return new Response(JSON.stringify({ 
        response: "I can only fetch data. For modifications, please update the database manually." 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Execute the query
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase.rpc('execute_sql', {
      sql_query: cleanQuery
    });

    if (error) {
      console.error('Database error:', error);
      return new Response(JSON.stringify({ 
        response: "Sorry, there was an error executing your query. Please try rephrasing your question." 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Format the response
    let response = "";
    if (!data || data.length === 0) {
      response = "No data found for your query.";
    } else {
      response = `Here's what I found:\n\n`;
      if (Array.isArray(data)) {
        data.slice(0, 10).forEach((row, index) => {
          response += `${index + 1}. `;
          Object.entries(row).forEach(([key, value]) => {
            response += `${key}: ${value}, `;
          });
          response = response.slice(0, -2) + '\n';
        });
        if (data.length > 10) {
          response += `\n... and ${data.length - 10} more results`;
        }
      }
    }

    return new Response(JSON.stringify({ response }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in botato-query function:', error);
    return new Response(JSON.stringify({ 
      response: "Sorry, something went wrong. Please try again." 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
