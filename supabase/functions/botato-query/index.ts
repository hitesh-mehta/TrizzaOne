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
    
    // Enhanced database schema information
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

Analyze the user's question and determine what information they want. Based on the query, respond with ONLY a JSON object in this exact format:

For queries about temperature, IoT sensor data:
{
  "analysis_type": "iot",
  "table": "iot_data",
  "operation": "max_temperature|min_temperature|avg_temperature|latest_temperature",
  "time_filter": "past_hour|past_day|today|yesterday|this_week|all_time",
  "columns": ["temperature", "zone", "timestamp"],
  "limit": 10
}

For queries about sales, order prices, revenue:
{
  "analysis_type": "sales",
  "table": "food_history", 
  "operation": "total_sales|avg_price|total_orders",
  "time_filter": "past_hour|past_day|today|yesterday|this_week|all_time",
  "columns": ["order_price", "dish_name", "timestamp"],
  "limit": 50
}

For queries about popularity, most/least consumed items, or food waste:
{
  "analysis_type": "aggregated",
  "table": "food_history",
  "operation": "most_popular|least_popular|most_consumed|least_consumed|food_waste|sales_summary",
  "time_filter": "today|yesterday|this_week|all_time",
  "limit": 10
}

For simple data retrieval:
{
  "analysis_type": "simple",
  "table": "table_name",
  "action": "select|count|average",
  "columns": ["column1", "column2"],
  "filters": {
    "column_name": "value",
    "date_filter": "today|yesterday|this_week"
  },
  "limit": 10
}

For unsupported queries:
{"error": "CANNOT_ANSWER"}

Examples:
- "highest temp in past hour" → analysis_type: "iot", operation: "max_temperature", time_filter: "past_hour"
- "total prices of sales in last 1 day" → analysis_type: "sales", operation: "total_sales", time_filter: "past_day"
- "most popular dish today" → analysis_type: "aggregated", operation: "most_popular", time_filter: "today"

Rules:
1. Only use tables: dishes, food_history, iot_data, profiles
2. Only use SELECT operations (no INSERT, UPDATE, DELETE)
3. For date filters, use "past_hour", "past_day", "today", "yesterday", "this_week", or "all_time"
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

    let response = "";
    let data = null;

    if (queryConfig.analysis_type === 'iot') {
      const result = await handleIoTQuery(supabase, queryConfig);
      response = result.response;
      data = result.data;
    } else if (queryConfig.analysis_type === 'sales') {
      const result = await handleSalesQuery(supabase, queryConfig);
      response = result.response;
      data = result.data;
    } else if (queryConfig.analysis_type === 'aggregated') {
      const result = await handleAggregatedQuery(supabase, queryConfig);
      response = result.response;
      data = result.data;
    } else {
      const result = await handleSimpleQuery(supabase, queryConfig);
      response = result.response;
      data = result.data;
    }

    return new Response(JSON.stringify({ response, data }), {
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

async function handleIoTQuery(supabase: any, config: any) {
  const { operation, time_filter, columns, limit = 10 } = config;
  
  let supabaseQuery = supabase.from('iot_data').select(columns.join(','));
  
  // Apply time filter
  const now = new Date();
  if (time_filter === 'past_hour') {
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    supabaseQuery = supabaseQuery.gte('timestamp', oneHourAgo.toISOString());
  } else if (time_filter === 'past_day') {
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    supabaseQuery = supabaseQuery.gte('timestamp', oneDayAgo.toISOString());
  } else if (time_filter === 'today') {
    const todayStr = now.toISOString().split('T')[0];
    supabaseQuery = supabaseQuery.gte('timestamp', `${todayStr}T00:00:00`)
                                 .lt('timestamp', `${todayStr}T23:59:59`);
  }

  // Apply ordering based on operation
  if (operation.includes('max') || operation.includes('highest')) {
    supabaseQuery = supabaseQuery.order('temperature', { ascending: false });
  } else if (operation.includes('min') || operation.includes('lowest')) {
    supabaseQuery = supabaseQuery.order('temperature', { ascending: true });
  } else {
    supabaseQuery = supabaseQuery.order('timestamp', { ascending: false });
  }

  supabaseQuery = supabaseQuery.limit(limit);

  const { data, error } = await supabaseQuery;

  if (error) {
    console.error('Database error:', error);
    return { response: "Sorry, there was an error retrieving the data.", data: null };
  }

  if (!data || data.length === 0) {
    return { response: "No IoT data found for the specified time period.", data: [] };
  }

  let responseText = "";
  
  if (operation === 'max_temperature' || operation.includes('highest')) {
    const maxTemp = data[0];
    responseText = `Highest temperature in ${time_filter.replace('_', ' ')}: **${maxTemp.temperature}°C** in ${maxTemp.zone} at ${new Date(maxTemp.timestamp).toLocaleString()}`;
  } else if (operation === 'min_temperature' || operation.includes('lowest')) {
    const minTemp = data[0];
    responseText = `Lowest temperature in ${time_filter.replace('_', ' ')}: **${minTemp.temperature}°C** in ${minTemp.zone} at ${new Date(minTemp.timestamp).toLocaleString()}`;
  } else if (operation === 'avg_temperature') {
    const avgTemp = data.reduce((sum, item) => sum + parseFloat(item.temperature), 0) / data.length;
    responseText = `Average temperature in ${time_filter.replace('_', ' ')}: **${avgTemp.toFixed(1)}°C** (based on ${data.length} readings)`;
  } else {
    responseText = `Latest temperature readings (${time_filter.replace('_', ' ')}):\n`;
    responseText += data.slice(0, 5).map((item, index) => 
      `${index + 1}. **${item.zone}**: ${item.temperature}°C at ${new Date(item.timestamp).toLocaleString()}`
    ).join('\n');
  }

  return { response: responseText, data };
}

async function handleSalesQuery(supabase: any, config: any) {
  const { operation, time_filter, columns, limit = 50 } = config;
  
  let supabaseQuery = supabase.from('food_history').select(columns.join(','));
  
  // Apply time filter
  const now = new Date();
  if (time_filter === 'past_hour') {
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    supabaseQuery = supabaseQuery.gte('timestamp', oneHourAgo.toISOString());
  } else if (time_filter === 'past_day') {
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    supabaseQuery = supabaseQuery.gte('timestamp', oneDayAgo.toISOString());
  } else if (time_filter === 'today') {
    const todayStr = now.toISOString().split('T')[0];
    supabaseQuery = supabaseQuery.gte('timestamp', `${todayStr}T00:00:00`)
                                 .lt('timestamp', `${todayStr}T23:59:59`);
  }

  supabaseQuery = supabaseQuery.not('order_price', 'is', null).limit(limit);

  const { data, error } = await supabaseQuery;

  if (error) {
    console.error('Database error:', error);
    return { response: "Sorry, there was an error retrieving the sales data.", data: null };
  }

  if (!data || data.length === 0) {
    return { response: "No sales data found for the specified time period.", data: [] };
  }

  let responseText = "";
  
  if (operation === 'total_sales') {
    const totalSales = data.reduce((sum, item) => sum + (item.order_price || 0), 0);
    responseText = `Total sales in ${time_filter.replace('_', ' ')}: **$${totalSales.toFixed(2)}** from ${data.length} orders`;
  } else if (operation === 'avg_price') {
    const avgPrice = data.reduce((sum, item) => sum + (item.order_price || 0), 0) / data.length;
    responseText = `Average order price in ${time_filter.replace('_', ' ')}: **$${avgPrice.toFixed(2)}** (based on ${data.length} orders)`;
  } else if (operation === 'total_orders') {
    responseText = `Total orders in ${time_filter.replace('_', ' ')}: **${data.length} orders**`;
  } else {
    responseText = `Sales summary for ${time_filter.replace('_', ' ')}:\n`;
    const totalSales = data.reduce((sum, item) => sum + (item.order_price || 0), 0);
    responseText += `• Total Revenue: **$${totalSales.toFixed(2)}**\n`;
    responseText += `• Total Orders: **${data.length}**\n`;
    responseText += `• Average Order: **$${(totalSales / data.length).toFixed(2)}**`;
  }

  return { response: responseText, data };
}

async function handleAggregatedQuery(supabase: any, config: any) {
  const { operation, time_filter, limit = 10 } = config;
  
  // Build time filter
  let timeFilter = '';
  const today = new Date();
  
  if (time_filter === 'today') {
    const todayStr = today.toISOString().split('T')[0];
    timeFilter = `timestamp >= '${todayStr}T00:00:00' AND timestamp < '${todayStr}T23:59:59'`;
  } else if (time_filter === 'yesterday') {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    timeFilter = `timestamp >= '${yesterdayStr}T00:00:00' AND timestamp < '${yesterdayStr}T23:59:59'`;
  } else if (time_filter === 'this_week') {
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    timeFilter = `timestamp >= '${weekStart.toISOString()}'`;
  }

  let supabaseQuery = supabase.from('food_history').select('dish_name, quantity_consumed, quantity_prepared');
  
  if (timeFilter) {
    const parts = timeFilter.split(' AND ');
    if (parts.length === 2) {
      const startTime = parts[0].split("'")[1];
      const endTime = parts[1].split("'")[1];
      supabaseQuery = supabaseQuery.gte('timestamp', startTime).lt('timestamp', endTime);
    } else {
      const startTime = timeFilter.split("'")[1];
      supabaseQuery = supabaseQuery.gte('timestamp', startTime);
    }
  }

  const { data: rawData, error } = await supabaseQuery.not('quantity_consumed', 'is', null);

  if (error) {
    console.error('Database error:', error);
    return { response: "Sorry, there was an error retrieving the data.", data: null };
  }

  if (!rawData || rawData.length === 0) {
    return { response: "No data found for the specified time period.", data: [] };
  }

  // Aggregate data by dish
  const dishStats = rawData.reduce((acc: any, item: any) => {
    const dishName = item.dish_name;
    if (!acc[dishName]) {
      acc[dishName] = {
        dish_name: dishName,
        total_consumed: 0,
        total_prepared: 0,
        total_wasted: 0,
        orders: 0
      };
    }
    
    acc[dishName].total_consumed += item.quantity_consumed || 0;
    acc[dishName].total_prepared += item.quantity_prepared || 0;
    acc[dishName].total_wasted += (item.quantity_prepared || 0) - (item.quantity_consumed || 0);
    acc[dishName].orders += 1;
    
    return acc;
  }, {});

  const aggregatedData = Object.values(dishStats);

  // Sort based on operation
  let sortedData;
  let responseText;

  switch (operation) {
    case 'most_popular':
    case 'most_consumed':
      sortedData = aggregatedData.sort((a: any, b: any) => b.total_consumed - a.total_consumed);
      responseText = `Most consumed dish${time_filter !== 'all_time' ? ` ${time_filter}` : ''}: **${sortedData[0].dish_name}** with ${sortedData[0].total_consumed} units consumed`;
      break;
      
    case 'least_popular':
    case 'least_consumed':
      sortedData = aggregatedData.sort((a: any, b: any) => a.total_consumed - b.total_consumed);
      responseText = `Least consumed dish${time_filter !== 'all_time' ? ` ${time_filter}` : ''}: **${sortedData[0].dish_name}** with ${sortedData[0].total_consumed} units consumed`;
      break;
      
    case 'food_waste':
      sortedData = aggregatedData.sort((a: any, b: any) => b.total_wasted - a.total_wasted);
      responseText = `Food waste analysis${time_filter !== 'all_time' ? ` ${time_filter}` : ''}:\n`;
      responseText += sortedData.slice(0, 5).map((item: any, index: number) => 
        `${index + 1}. **${item.dish_name}**: ${item.total_wasted} units wasted (${item.total_prepared} prepared, ${item.total_consumed} consumed)`
      ).join('\n');
      break;
      
    default:
      sortedData = aggregatedData.sort((a: any, b: any) => b.total_consumed - a.total_consumed);
      responseText = `Food consumption summary${time_filter !== 'all_time' ? ` ${time_filter}` : ''}:\n`;
      responseText += sortedData.slice(0, limit).map((item: any, index: number) => 
        `${index + 1}. **${item.dish_name}**: ${item.total_consumed} consumed, ${item.total_wasted} wasted`
      ).join('\n');
  }

  return {
    response: responseText,
    data: sortedData.slice(0, limit)
  };
}

async function handleSimpleQuery(supabase: any, config: any) {
  let supabaseQuery = supabase.from(config.table);

  // Apply action
  if (config.action === 'count') {
    supabaseQuery = supabaseQuery.select('*', { count: 'exact', head: true });
  } else if (config.action === 'average' && config.columns?.length > 0) {
    supabaseQuery = supabaseQuery.select(config.columns.join(','));
  } else {
    const columns = config.columns && config.columns.length > 0 
      ? config.columns.join(',') 
      : '*';
    supabaseQuery = supabaseQuery.select(columns);
  }

  // Apply filters
  if (config.filters) {
    for (const [column, value] of Object.entries(config.filters)) {
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
  if (config.limit && config.action !== 'count') {
    supabaseQuery = supabaseQuery.limit(config.limit);
  }

  const { data, error, count } = await supabaseQuery;

  if (error) {
    console.error('Database error:', error);
    return { response: "Sorry, there was an error executing your query.", data: null };
  }

  let response = "";
  
  if (config.action === 'count') {
    response = `Found ${count || 0} records.`;
  } else if (config.action === 'average' && data && data.length > 0 && config.columns?.length > 0) {
    const column = config.columns[0];
    const values = data.map(row => parseFloat(row[column])).filter(val => !isNaN(val));
    if (values.length > 0) {
      const average = values.reduce((sum, val) => sum + val, 0) / values.length;
      response = `The average ${column} is ${average.toFixed(2)}.`;
    } else {
      response = `No valid data found for calculating average of ${column}.`;
    }
  } else if (!data || data.length === 0) {
    response = "No data found for your query.";
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

  return { response, data };
}
