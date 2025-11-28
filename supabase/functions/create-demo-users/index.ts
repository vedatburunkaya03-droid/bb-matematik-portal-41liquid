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
  role: string;
}

const demoUsers: DemoUser[] = [
  {
    email: 'admin@bbmatematik.com',
    password: 'admin123',
    fullName: 'Demo Yönetici',
    role: 'yonetici',
  },
  {
    email: 'egitmen@bbmatematik.com',
    password: 'egitmen123',
    fullName: 'Ahmet Yılmaz',
    role: 'egitmen',
  },
  {
    email: 'egitmen2@bbmatematik.com',
    password: 'egitmen123',
    fullName: 'Ayşe Demir',
    role: 'egitmen',
  },
  {
    email: 'danisman@bbmatematik.com',
    password: 'danisman123',
    fullName: 'Mehmet Kaya',
    role: 'danisman',
  },
  {
    email: 'ogrenci1@bbmatematik.com',
    password: 'ogrenci123',
    fullName: 'Ali Çelik',
    role: 'ogrenci',
  },
  {
    email: 'ogrenci2@bbmatematik.com',
    password: 'ogrenci123',
    fullName: 'Zeynep Yıldız',
    role: 'ogrenci',
  },
  {
    email: 'ogrenci3@bbmatematik.com',
    password: 'ogrenci123',
    fullName: 'Can Arslan',
    role: 'ogrenci',
  },
  {
    email: 'ogrenci4@bbmatematik.com',
    password: 'ogrenci123',
    fullName: 'Elif Öztürk',
    role: 'ogrenci',
  },
  {
    email: 'veli1@bbmatematik.com',
    password: 'veli123',
    fullName: 'Hasan Çelik',
    role: 'veli',
  },
  {
    email: 'veli2@bbmatematik.com',
    password: 'veli123',
    fullName: 'Fatma Yıldız',
    role: 'veli',
  },
  {
    email: 'veli3@bbmatematik.com',
    password: 'veli123',
    fullName: 'Mustafa Arslan',
    role: 'veli',
  },
  {
    email: 'veli4@bbmatematik.com',
    password: 'veli123',
    fullName: 'Emine Öztürk',
    role: 'veli',
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

    for (const user of demoUsers) {
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existingUser = existingUsers?.users.find(u => u.email === user.email);

      if (existingUser) {
        await supabase.auth.admin.updateUserById(existingUser.id, {
          password: user.password,
        });

        const { error: updateError } = await supabase
          .from('users')
          .upsert({
            id: existingUser.id,
            email: user.email,
            full_name: user.fullName,
            role: user.role,
          });

        results.push({
          email: user.email,
          status: 'updated',
          role: user.role,
          error: updateError?.message,
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
          role: user.role,
        });

        results.push({
          email: user.email,
          status: 'created',
          role: user.role,
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