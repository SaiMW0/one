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
  const { table, item_id, password } = body;

  try {
    if (!['files', 'rooms'].includes(table)) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid table' }) };
    }

    const { data: item } = await supabase
      .from(table)
      .select('password')
      .eq('id', item_id)
      .single();

    if (!item) {
      return { statusCode: 404, headers, body: JSON.stringify({ error: 'Item not found' }) };
    }

    if (item.password !== password) {
      return { statusCode: 403, headers, body: JSON.stringify({ error: 'Incorrect password' }) };
    }

    return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};