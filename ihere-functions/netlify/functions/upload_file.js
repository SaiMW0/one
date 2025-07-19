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
  const { room_id, content, device_id, type, name, is_locked, password, lat, lon } = body;

  try {
    if (!content || !device_id || !type || !name) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing required fields' }) };
    }

    if (room_id) {
      const { data: room } = await supabase
        .from('rooms')
        .select('disable_contributions, lat, lon')
        .eq('id', room_id)
        .single();

      if (!room) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: 'Room not found' }) };
      }

      if (room.disable_contributions) {
        const { data: isCreator } = await supabase
          .from('rooms')
          .select('creator_id')
          .eq('id', room_id)
          .eq('creator_id', device_id)
          .single();

        if (!isCreator) {
          return { statusCode: 403, headers, body: JSON.stringify({ error: 'Contributions disabled for non-creators' }) };
        }
      }

      const distance = Math.sqrt(
        Math.pow(room.lat - lat, 2) + Math.pow(room.lon - lon, 2)
      ) * 111000;

      if (distance > 100) {
        return { statusCode: 403, headers, body: JSON.stringify({ error: 'Outside 100-meter range' }) };
      }
    }

    const { data, error } = await supabase
      .from('files')
      .insert({
        room_id,
        content,
        creator_id: device_id,
        type,
        name,
        is_locked,
        password: is_locked ? password : null,
        lat,
        lon,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString()
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