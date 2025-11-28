import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface DemoUser {
  email: string;
  password: string;
  fullName: string;
}

const usersWithoutRoles: DemoUser[] = [
  {
    email: 'yeni1@bbmatematik.com',
    password: 'demo123',
    fullName: 'Kemal Yılmaz',
  },
  {
    email: 'yeni2@bbmatematik.com',
    password: 'demo123',
    fullName: 'Selin Kaya',
  },
  {
    email: 'yeni3@bbmatematik.com',
    password: 'demo123',
    fullName: 'Deniz Aydın',
  },
];

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const results = [];

    for (const user of usersWithoutRoles) {
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existingUser = existingUsers?.users.find(u => u.email === user.email);

      if (existingUser) {
        results.push({
          email: user.email,
          status: 'already_exists',
        });
        continue;
      }

      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
      });

      if (authError) {
        results.push({
          email: user.email,
          status: 'error',
          error: authError.message,
        });
        continue;
      }

      if (authData.user) {
        const { error: profileError } = await supabase.from('users').insert({
          id: authData.user.id,
          email: user.email,
          full_name: user.fullName,
          role: null,
        });

        results.push({
          email: user.email,
          status: 'created',
          role: 'none',
          error: profileError?.message,
        });
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});