
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
    console.log('Received query:', query);
    
    const geminiApiKey = 'AIzaSyBGK_9Tpv2PorkIfIBrmOvNAtLTqkH5Meg';
    
    // Complete database schema information
    const dbSchema = `
    Database Schema for TrizzaOne Restaurant Management System:

    1. profiles table:
    - id (uuid, primary key) - User profile identifier
    - first_name (text) - User's first name
    - last_name (text) - User's last name
    - created_at (timestamp) - When profile was created
    - updated_at (timestamp) - When profile was last updated

    2. dishes table:
    - dish_id (bigint, primary key) - Unique dish identifier
    - dish_name (text, not null) - Name of the dish
    - dish_price (real, not null) - Price of the dish

    3. food_history table:
    - dish_name (text, not null) - Name of the dish prepared
    - timestamp (timestamp with time zone, not null) - When the dish was prepared
    - quantity_prepared (bigint) - How many units were prepared
    - quantity_consumed (bigint) - How many units were consumed
    - water_consumption (double precision) - Water used in preparation (liters)
    - gas_consumption (double precision) - Gas used in preparation (units)
    - order_price (bigint) - Total price of the order
    - food_rating (double precision) - Customer rating for the food

    4. iot_data table:
    - id (uuid, primary key) - Unique IoT data entry identifier
    - timestamp (timestamp with time zone, not null) - When the data was recorded
    - zone (enum: Zone01, Zone02, Zone03, Zone04) - Which zone/area of the restaurant
    - floor (integer, not null) - Floor number (0, 1, 2, 3)
    - temperature (numeric, not null) - Temperature in Celsius
    - humidity (numeric, not null) - Humidity percentage
    - co2_level (numeric, not null) - CO2 levels in ppm
    - light_level (double precision, not null) - Light intensity
    - occupancy_count (integer, not null) - Number of people in the zone
    - motion_detected (enum: yes, no) - Whether motion was detected
    - air_purifier_status (enum: on, off) - Air purifier status
    - fire_alarm_triggered (enum: yes, no) - Fire alarm status
    - gas_leak_detected (enum: yes, no) - Gas leak detection status
    - power_status (enum: on, off) - Power status
    - energy_consumed_kwh (double precision, not null) - Energy consumption in kWh
    - battery_backup_level (double precision, not null) - Battery backup percentage
    - cleaning_status (enum: pending, inprogress, done) - Cleaning status
    - last_cleaned_timestamp (timestamp with time zone) - When the area was last cleaned
    - created_at (timestamp with time zone, not null) - When the record was created

    Available zones: Zone01, Zone02, Zone03, Zone04
    Available floors: 0 (ground), 1, 2, 3
    `;

    const prompt = `
    You are Botato, a helpful database assistant for the TrizzaOne restaurant management system. 
    
    Complete Database Schema:
    ${dbSchema}

    User Query: "${query}"

    Instructions:
    1. Generate ONLY a PostgreSQL SELECT query based on the user's question
    2. Do NOT include any INSERT, UPDATE, DELETE, or DDL statements
    3. Use proper PostgreSQL syntax with correct table and column names
    4. Return only the SQL query without any markdown formatting or explanations
    5. If the query cannot be answered with the available tables, respond with exactly: "CANNOT_ANSWER"
    6. Make sure the query is safe and only retrieves data
    7. Use appropriate WHERE clauses, ORDER BY, and LIMIT as needed
    8. For date/time queries, use proper PostgreSQL date functions
    9. For aggregations, use appropriate GROUP BY clauses

    Examples of good queries:
    - SELECT * FROM dishes ORDER BY dish_price DESC LIMIT 10;
    - SELECT zone, AVG(temperature) FROM iot_data WHERE DATE(timestamp) = CURRENT_DATE GROUP BY zone;
    - SELECT dish_name, SUM(quantity_consumed) FROM food_history WHERE timestamp >= NOW() - INTERVAL '7 days' GROUP BY dish_name;

    Generate the PostgreSQL SELECT query:
    `;

    console.log('Sending prompt to Gemini:', prompt.substring(0, 200) + '...');

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
        }],
        generationConfig: {
          temperature: 0.1,
          topK: 1,
          topP: 0.8,
          maxOutputTokens: 1024,
        }
      }),
    });

    if (!geminiResponse.ok) {
      console.error('Gemini API error:', geminiResponse.status, geminiResponse.statusText);
      throw new Error(`Gemini API failed: ${geminiResponse.status}`);
    }

    const geminiData = await geminiResponse.json();
    console.log('Gemini response:', geminiData);
    
    const generatedQuery = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    console.log('Generated query:', generatedQuery);

    if (!generatedQuery || generatedQuery === 'CANNOT_ANSWER') {
      return new Response(JSON.stringify({ 
        response: "Sorry, I cannot find that information in the available data. Please try asking about dishes, food history, IoT sensors, or user profiles." 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Clean the query and validate it's a SELECT statement
    const cleanQuery = generatedQuery.replace(/```sql\n?|\n?```|```/g, '').trim();
    if (!cleanQuery.toLowerCase().startsWith('select')) {
      console.error('Invalid query generated:', cleanQuery);
      return new Response(JSON.stringify({ 
        response: "I can only fetch data from the database. For modifications, please update the database manually." 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Execute the query using Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Executing query:', cleanQuery);

    // Execute raw SQL query
    const { data, error } = await supabase.rpc('execute_sql', {
      sql_query: cleanQuery
    });

    if (error) {
      console.error('Database error:', error);
      return new Response(JSON.stringify({ 
        response: "Sorry, there was an error executing your query. Please try rephrasing your question or make sure you're asking about valid data." 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Query result:', data);

    // Format the response
    let response = "";
    if (!data || data.length === 0) {
      response = "No data found for your query. Try asking about different time periods or check if the data exists.";
    } else {
      response = `Here's what I found:\n\n`;
      if (Array.isArray(data)) {
        // Show up to 20 results
        const displayData = data.slice(0, 20);
        displayData.forEach((row, index) => {
          response += `${index + 1}. `;
          const entries = Object.entries(row);
          entries.forEach(([key, value], entryIndex) => {
            if (entryIndex > 0) response += ", ";
            response += `${key}: ${value}`;
          });
          response += '\n';
        });
        
        if (data.length > 20) {
          response += `\n... and ${data.length - 20} more results. Try being more specific to see fewer results.`;
        }
        
        response += `\nTotal results: ${data.length}`;
      }
    }

    return new Response(JSON.stringify({ response }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in botato-query function:', error);
    return new Response(JSON.stringify({ 
      response: "Sorry, something went wrong while processing your request. Please try again or rephrase your question." 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
