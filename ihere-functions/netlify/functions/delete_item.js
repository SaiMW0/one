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
  const { table, item_id, device_id } = body;

  try {
    if (!['files', 'rooms', 'polls', 'templates', 'quizzes'].includes(table)) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid table' }) };
    }

    const { data: item } = await supabase
      .from(table)
      .select('creator_id, room_id')
      .eq('id', item_id)
      .single();

    if (!item) {
      return { statusCode: 404, headers, body: JSON.stringify({ error: 'Item not found' }) };
    }

    const isRoomCreator = item.room_id
      ? (await supabase.from('rooms').select('creator_id').eq('id', item.room_id).single()).data?.creator_id === device_id
      : false;

    if (item.creator_id !== device_id && !isRoomCreator) {
      return { statusCode: 403, headers, body: JSON.stringify({ error: 'Not authorized' }) };
    }

    if (table === 'rooms') {
      await supabase.from('files').delete().eq('room_id', item_id);
    }

    const { error } = await supabase.from(table).delete().eq('id', item_id);
    if (error) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
    }

    return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};