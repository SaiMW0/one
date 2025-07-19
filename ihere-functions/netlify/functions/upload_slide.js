const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': 'https://ihere.me',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const body = JSON.parse(event.body);
  const { room_id, slide_url, slide_size, device_id } = body;

  try {
    if (!room_id || !slide_url || !slide_size || !device_id) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing required fields' }) };
    }

    const { data: room } = await supabase
      .from('rooms')
      .select('creator_id')
      .eq('id', room_id)
      .single();

    if (!room) {
      return { statusCode: 404, headers, body: JSON.stringify({ error: 'Room not found' }) };
    }

    if (room.creator_id !== device_id) {
      return { statusCode: 403, headers, body: JSON.stringify({ error: 'Only room creator can upload slides' }) };
    }

    const { data, error } = await supabase
      .from('slides')
      .insert({
        room_id,
        slide_url,
        slide_size,
        creator_id: device_id,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
    }

    return { statusCode: 200, headers, body: JSON.stringify(data) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};