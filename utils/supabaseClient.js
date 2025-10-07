const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

const missingEnvMessage = 'Supabase client is not configured. Please set SUPABASE_URL and SUPABASE_KEY environment variables.';

const createDisabledQuery = (message) => {
    const errorFactory = () => ({ data: null, error: new Error(message) });
    const promise = Promise.resolve().then(errorFactory);

    const proxy = new Proxy(
        {},
        {
            get(_target, property) {
                if (property === 'then') {
                    return promise.then.bind(promise);
                }
                if (property === 'catch') {
                    return promise.catch.bind(promise);
                }
                if (property === 'finally') {
                    return promise.finally.bind(promise);
                }

                return () => proxy;
            }
        }
    );

    return proxy;
};

const createDisabledClient = (message) => ({
    from: () => createDisabledQuery(message),
    rpc: () => Promise.resolve({ data: null, error: new Error(message) }),
    channel: () => {
        throw new Error(message);
    }
});

const isConfigured = Boolean(supabaseUrl && supabaseKey);

if (!isConfigured) {
    console.warn(`[Supabase] ${missingEnvMessage}`);
}

const supabase = isConfigured
    ? createClient(supabaseUrl, supabaseKey)
    : createDisabledClient(missingEnvMessage);

supabase.isConfigured = isConfigured;

module.exports = supabase;