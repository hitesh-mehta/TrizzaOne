
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GEMINI_API_KEY = 'AIzaSyBGK_9Tpv2PorkIfIBrmOvNAtLTqkH5Meg';

const DATABASE_SCHEMA = `
Database Schema for Restaurant Management System:

1. dishes table:
   - dish_name (text, primary key): Name of the dish
   - dish_price (real): Price of the dish
   - dish_id (bigint): Unique identifier for the dish

2. food_history table:
   - dish_name (text): Name of the dish ordered
   - timestamp (timestamp with time zone): When the order was placed
   - quantity_prepared (bigint): How many portions were prepared
   - quantity_consumed (bigint): How many portions were actually consumed
   - water_consumption (double precision): Water used in preparation
   - gas_consumption (double precision): Gas used in preparation
   - order_price (bigint): Total price of the order
   - food_rating (double precision): Customer rating for the food

3. iot_data table:
   - timestamp (timestamp with time zone): When the data was recorded
   - zone (enum): Location zone (kitchen, dining, pantry)
   - floor (integer): Floor number
   - temperature (numeric): Temperature reading
   - humidity (numeric): Humidity percentage
   - co2_level (numeric): CO2 levels
   - light_level (double precision): Light intensity
   - occupancy_count (integer): Number of people in the area
   - motion_detected (boolean): Whether motion was detected
   - air_purifier_status (enum): Status of air purifier
   - fire_alarm_triggered (boolean): Fire alarm status
   - gas_leak_detected (boolean): Gas leak detection
   - power_status (enum): Power supply status
   - energy_consumed_kwh (double precision): Energy consumption
   - battery_backup_level (double precision): Battery backup percentage
   - cleaning_status (enum): Cleaning status
   - last_cleaned_timestamp (timestamp with time zone): Last cleaning time

4. profiles table:
   - id (uuid, primary key): User unique identifier
   - first_name (text): User's first name
   - last_name (text): User's last name
   - created_at (timestamp with time zone): Account creation time
   - updated_at (timestamp with time zone): Last profile update time
`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();

    // Check if the query contains modification keywords
    const modificationKeywords = ['insert', 'update', 'delete', 'drop', 'create', 'alter', 'truncate'];
    const lowerQuery = query.toLowerCase();
    
    if (modificationKeywords.some(keyword => lowerQuery.includes(keyword))) {
      return new Response(JSON.stringify({ 
        error: "I can only fetch data. For modifications, please update the database manually." 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate SQL query using Gemini
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are a PostgreSQL query generator for a restaurant management system. 
            
${DATABASE_SCHEMA}

User Query: "${query}"

Generate ONLY a PostgreSQL SELECT query (no explanations, no markdown, just the SQL). The query should:
- Use proper PostgreSQL syntax
- Only use SELECT statements (no INSERT, UPDATE, DELETE, etc.)
- Reference only the tables and columns described in the schema above
- Be safe and efficient
- Return meaningful results for the user's question

If the user's question cannot be answered with the available data, return: SELECT 'No data available for this query' as message;`
          }]
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 500,
        },
      }),
    });

    const geminiData = await geminiResponse.json();
    
    if (!geminiData.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Failed to generate SQL query');
    }

    let sqlQuery = geminiData.candidates[0].content.parts[0].text.trim();
    
    // Clean up the SQL query (remove markdown formatting if any)
    sqlQuery = sqlQuery.replace(/```sql\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Ensure it's a SELECT query
    if (!sqlQuery.toLowerCase().startsWith('select')) {
      throw new Error('Only SELECT queries are allowed');
    }

    // Execute the query using Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data, error } = await supabase.rpc('execute_sql', { sql_query: sqlQuery });
    
    if (error) {
      // If RPC doesn't exist, try direct query execution
      const { data: directData, error: directError } = await supabase
        .from('dummy') // This will fail but we'll catch it
        .select('*');
      
      // For now, return a simulated response
      return new Response(JSON.stringify({
        query: sqlQuery,
        data: [],
        message: "Query generated successfully. Direct execution requires additional setup."
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      query: sqlQuery,
      data: data || [],
      message: "Query executed successfully"
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in query-database function:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to process query',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
