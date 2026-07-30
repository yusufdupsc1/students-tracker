import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://hzgaflrabmrcsokhoatv.supabase.co'
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'yusufdupsc1@gmail.com'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '123456'
const SCHOOL_NAME = process.env.ADMIN_SCHOOL_NAME || 'বেজখণ্ড সঃ প্রাঃ বিদ্যালয়'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function main() {
  console.log('Seeding admin user...')

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD
  })

  if (authError) {
    if (authError.message.includes('already registered')) {
      console.log('Admin user already exists in auth.users')
    } else {
      console.error('Failed to create admin user:', authError.message)
      process.exit(1)
    }
  }

  const userId = authData.user?.id
  if (!userId) {
    console.error('No user ID returned from signUp')
    process.exit(1)
  }

  console.log('Auth user created/verified:', userId)

  const { data: school, error: schoolError } = await supabase
    .from('schools')
    .insert({ name: SCHOOL_NAME })
    .select()
    .single()

  if (schoolError) {
    console.error('Failed to create school:', schoolError.message)
    process.exit(1)
  }

  console.log('School created:', school.id)

  const { error: profileError } = await supabase
    .from('user_profiles')
    .insert({
      id: userId,
      email: ADMIN_EMAIL,
      full_name: 'Owner Developer',
      role: 'admin',
      school_id: school.id
    })

  if (profileError) {
    console.error('Failed to create user profile:', profileError.message)
    process.exit(1)
  }

  console.log('User profile created with admin role')

  const { error: subError } = await supabase
    .from('subscriptions')
    .insert({
      school_id: school.id,
      plan_id: 'basic',
      status: 'trialing'
    })

  if (subError) {
    console.error('Failed to create subscription:', subError.message)
    process.exit(1)
  }

  console.log('Subscription created with trialing status')
  console.log('\nAdmin user ready:')
  console.log('  Email:    ' + ADMIN_EMAIL)
  console.log('  Password: ' + ADMIN_PASSWORD)
  console.log('  Role:     admin')
  console.log('\nIf email confirmation is enabled in Supabase, confirm the email before logging in.')
}

main().catch((err) => {
  console.error('Unexpected error:', err)
  process.exit(1)
})
