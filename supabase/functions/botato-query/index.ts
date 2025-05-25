
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

    const prompt = `You are Botato, a helpful database assistant for the TrizzaOne restaurant management system. 

Database Schema:
${dbSchema}

User Query: "${query}"

Based on the user's question, determine what data they want and respond with ONLY a JSON object in this exact format:
{
  "table": "table_name",
  "action": "select|count|average",
  "columns": ["column1", "column2"],
  "filters": {
    "column_name": "value",
    "date_filter": "today|yesterday|this_week"
  },
  "limit": 10
}

Rules:
1. Only use tables: dishes, food_history, iot_data, profiles
2. Only use SELECT operations (no INSERT, UPDATE, DELETE)
3. For date filters, use "today", "yesterday", or "this_week"
4. If the query cannot be answered, respond with: {"error": "CANNOT_ANSWER"}
5. Return ONLY the JSON object, no explanations

Generate the JSON:`;

    console.log('Sending request to Gemini API...');

    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${geminiApiKey}`, {
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
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', geminiResponse.status, geminiResponse.statusText, errorText);
      throw new Error(`Gemini API failed: ${geminiResponse.status} - ${errorText}`);
    }

    const geminiData = await geminiResponse.json();
    console.log('Gemini response received:', JSON.stringify(geminiData, null, 2));
    
    const generatedResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    console.log('Generated response:', generatedResponse);

    if (!generatedResponse) {
      return new Response(JSON.stringify({ 
        response: "Sorry, I couldn't process your request. Please try rephrasing your question." 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse the JSON response
    let queryConfig;
    try {
      const cleanResponse = generatedResponse.replace(/```json\n?|\n?```|```/g, '').trim();
      queryConfig = JSON.parse(cleanResponse);
      console.log('Parsed query config:', queryConfig);
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', parseError);
      return new Response(JSON.stringify({ 
        response: "Sorry, I couldn't understand your request. Please try asking in a different way." 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (queryConfig.error === 'CANNOT_ANSWER') {
      return new Response(JSON.stringify({ 
        response: "Sorry, I cannot find that information in the available data. Please try asking about dishes, food history, IoT sensors, or user profiles." 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Execute the query using Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Executing query with config:', queryConfig);

    let supabaseQuery = supabase.from(queryConfig.table);

    // Apply action
    if (queryConfig.action === 'count') {
      supabaseQuery = supabaseQuery.select('*', { count: 'exact', head: true });
    } else if (queryConfig.action === 'average' && queryConfig.columns?.length > 0) {
      // For average, we'll select the column and calculate average on frontend
      supabaseQuery = supabaseQuery.select(queryConfig.columns.join(','));
    } else {
      // Default select
      const columns = queryConfig.columns && queryConfig.columns.length > 0 
        ? queryConfig.columns.join(',') 
        : '*';
      supabaseQuery = supabaseQuery.select(columns);
    }

    // Apply filters
    if (queryConfig.filters) {
      for (const [column, value] of Object.entries(queryConfig.filters)) {
        if (column === 'date_filter' && value) {
          const today = new Date();
          let dateFilter;
          
          if (value === 'today') {
            dateFilter = today.toISOString().split('T')[0];
            supabaseQuery = supabaseQuery.gte('timestamp', `${dateFilter}T00:00:00`)
                                       .lt('timestamp', `${dateFilter}T23:59:59`);
          } else if (value === 'yesterday') {
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            dateFilter = yesterday.toISOString().split('T')[0];
            supabaseQuery = supabaseQuery.gte('timestamp', `${dateFilter}T00:00:00`)
                                       .lt('timestamp', `${dateFilter}T23:59:59`);
          } else if (value === 'this_week') {
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - today.getDay());
            supabaseQuery = supabaseQuery.gte('timestamp', weekStart.toISOString());
          }
        } else if (value && column !== 'date_filter') {
          supabaseQuery = supabaseQuery.eq(column, value);
        }
      }
    }

    // Apply limit
    if (queryConfig.limit && queryConfig.action !== 'count') {
      supabaseQuery = supabaseQuery.limit(queryConfig.limit);
    }

    const { data, error, count } = await supabaseQuery;

    if (error) {
      console.error('Database error:', error);
      return new Response(JSON.stringify({ 
        response: "Sorry, there was an error executing your query. Please try rephrasing your question." 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Query result:', { data, count });

    // Format the response
    let response = "";
    
    if (queryConfig.action === 'count') {
      response = `Found ${count || 0} records.`;
    } else if (queryConfig.action === 'average' && data && data.length > 0 && queryConfig.columns?.length > 0) {
      const column = queryConfig.columns[0];
      const values = data.map(row => parseFloat(row[column])).filter(val => !isNaN(val));
      if (values.length > 0) {
        const average = values.reduce((sum, val) => sum + val, 0) / values.length;
        response = `The average ${column} is ${average.toFixed(2)}.`;
      } else {
        response = `No valid data found for calculating average of ${column}.`;
      }
    } else if (!data || data.length === 0) {
      response = "No data found for your query. Try asking about different time periods or check if the data exists.";
    } else {
      response = `Here's what I found:\n\n`;
      const displayData = data.slice(0, 10);
      displayData.forEach((row, index) => {
        response += `${index + 1}. `;
        const entries = Object.entries(row);
        entries.forEach(([key, value], entryIndex) => {
          if (entryIndex > 0) response += ", ";
          response += `${key}: ${value}`;
        });
        response += '\n';
      });
      
      if (data.length > 10) {
        response += `\n... and ${data.length - 10} more results.`;
      }
      
      response += `\nTotal results: ${data.length}`;
    }

    return new Response(JSON.stringify({ response }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in botato-query function:', error);
    return new Response(JSON.stringify({ 
      response: "Sorry, something went wrong while processing your request. Please try again." 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
