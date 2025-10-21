const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY; // Use service key for backend

if (!supabaseUrl || !supabaseKey) {
    console.error('⚠️ Missing Supabase credentials in environment variables');
    console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_KEY');
    // Don't exit in production, let the API return proper error responses
    if (process.env.NODE_ENV !== 'production') {
        process.exit(1);
    }
}

const supabase = supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey)
    : null;

// Test connection
async function testConnection() {
    if (!supabase) {
        console.error('❌ Supabase client not initialized - missing credentials');
        return false;
    }
    try {
        const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });
        if (error) throw error;
        console.log('✅ Supabase connection successful');
        return true;
    } catch (error) {
        console.error('❌ Supabase connection failed:', error.message);
        return false;
    }
}

module.exports = { supabase, testConnection };
