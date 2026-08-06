import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://hzgaflrabmrcsokhoatv.supabase.co'
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || ''
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'yusufdupsc1@gmail.com'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Bejkhonda@2025!Secure'
const SCHOOL_NAME = process.env.ADMIN_SCHOOL_NAME || 'বেজখণ্ড সঃ প্রাঃ বিদ্যালয়'

if (!SUPABASE_ANON_KEY && !SUPABASE_SERVICE_KEY) {
  console.error('Missing Supabase keys: set VITE_SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Prefer service_role for admin ops if available (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// Anon client for signUp/signIn flows
const anonClient = SUPABASE_ANON_KEY ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { autoRefreshToken: false, persistSession: false } }) : supabase

async function ensureSchoolAndProfile(userId) {
  // Check if profile already exists
  const { data: existingProfile } = await supabase.from('user_profiles').select('*, schools(*)').eq('id', userId).maybeSingle()
  if (existingProfile) {
    console.log('Profile already exists for user:', userId)
    // Ensure subscription exists
    const schoolId = existingProfile.school_id
    const { data: sub } = await supabase.from('subscriptions').select('id').eq('school_id', schoolId).maybeSingle()
    if (!sub) {
      console.log('Creating missing subscription for school:', schoolId)
      const { error } = await supabase.from('subscriptions').insert({ school_id: schoolId, plan_id: 'basic', status: 'trialing' })
      if (error) console.error('Failed to create subscription:', error.message)
      else console.log('Subscription created (trialing)')
    } else {
      console.log('Subscription exists')
    }
    return existingProfile
  }

  // No profile – create school + profile + subscription
  console.log('Creating school, profile, subscription for user:', userId)
  const { data: school, error: schoolError } = await supabase.from('schools').insert({ name: SCHOOL_NAME }).select().single()
  if (schoolError) {
    console.error('Failed to create school:', schoolError.message)
    process.exit(1)
  }
  console.log('School created:', school.id)

  const { error: profileError } = await supabase.from('user_profiles').insert({
    id: userId,
    email: ADMIN_EMAIL,
    full_name: 'Owner Developer',
    role: 'admin',
    school_id: school.id
  })
  if (profileError) {
    console.error('Failed to create profile:', profileError.message)
    // cleanup school
    await supabase.from('schools').delete().eq('id', school.id).catch(()=>{})
    process.exit(1)
  }
  console.log('Profile created')

  const { error: subError } = await supabase.from('subscriptions').insert({
    school_id: school.id, plan_id: 'basic', status: 'trialing'
  })
  if (subError) console.error('Failed to create subscription (non-fatal):', subError.message)
  else console.log('Subscription created (trialing)')

  return { school_id: school.id }
}

async function main() {
  console.log('=== Admin Seed / Reset ===')
  console.log('Email:', ADMIN_EMAIL)
  console.log('Supabase URL:', SUPABASE_URL)
  console.log('Using service_role:', Boolean(SUPABASE_SERVICE_KEY))

  // If service_role available, use admin API to create/update user directly (reliable)
  if (SUPABASE_SERVICE_KEY) {
    const { createClient: createAdmin } = await import('@supabase/supabase-js')
    const admin = createAdmin(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })
    // Try to list users to find existing
    const { data: { users }, error: listErr } = await admin.auth.admin.listUsers()
    if (listErr) console.warn('listUsers failed:', listErr.message)
    const existing = users?.find(u => u.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase())

    let userId
    if (existing) {
      console.log('Admin user already exists:', existing.id)
      // Reset password via admin update
      console.log('Resetting password...')
      const { error: updErr } = await admin.auth.admin.updateUserById(existing.id, { password: ADMIN_PASSWORD, email_confirm: true, user_metadata: { full_name: 'Owner Developer' } })
      if (updErr) {
        console.error('Failed to reset password:', updErr.message)
        // Try delete and recreate if update fails
      } else {
        console.log('Password reset successfully')
      }
      userId = existing.id
    } else {
      console.log('Creating admin user via admin API...')
      const { data, error } = await admin.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: 'Owner Developer', school_name: SCHOOL_NAME }
      })
      if (error) {
        console.error('Failed to create user via admin API:', error.message)
        process.exit(1)
      }
      userId = data.user.id
      console.log('Admin auth user created:', userId)
    }

    await ensureSchoolAndProfile(userId)

    console.log('\n✅ Admin ready:')
    console.log('  Email:    ' + ADMIN_EMAIL)
    console.log('  Password: ' + ADMIN_PASSWORD)
    console.log('  URL:      ' + SUPABASE_URL)
    console.log('\nYou can now login at /login')
    return
  }

  // Fallback: anon flow (requires email confirmations disabled)
  console.log('No service_role key – using anon signUp/signIn flow (ensure email confirmations disabled in Supabase)')
  // Try signIn first to get userId if already exists
  const { data: signInData, error: signInErr } = await anonClient.auth.signInWithPassword({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
  if (!signInErr && signInData.user) {
    console.log('SignIn succeeded – user already exists and password matches:', signInData.user.id)
    await ensureSchoolAndProfile(signInData.user.id)
    console.log('\n✅ Admin ready (signIn):', ADMIN_EMAIL)
    return
  }
  if (signInErr) console.log('signIn failed (expected if new user):', signInErr.message)

  // Try signUp
  const { data: signUpData, error: signUpErr } = await anonClient.auth.signUp({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD, options: { data: { full_name: 'Owner Developer' } } })
  if (signUpErr) {
    if (signUpErr.message.includes('already registered') || signUpErr.message.includes('already exists')) {
      console.log('User already registered – trying to fetch id via signIn with same password may have failed due to wrong password.')
      console.log('If password was changed, set correct ADMIN_PASSWORD env or provide SUPABASE_SERVICE_ROLE_KEY to reset.')
      // Try to get user via getUser after signIn attempt? Without service key we cannot reset.
      // Exit with helpful message
      console.error('\n⚠️ Admin exists but password mismatch and no service_role key to reset.')
      console.error('   Provide SUPABASE_SERVICE_ROLE_KEY env to force password reset.')
      process.exit(1)
    } else {
      console.error('signUp failed:', signUpErr.message)
      process.exit(1)
    }
  }

  const userId = signUpData.user?.id
  if (!userId) {
    console.error('No user ID from signUp – check Supabase logs. Session present?', !!signUpData.session)
    process.exit(1)
  }
  console.log('Auth user created:', userId, 'session:', !!signUpData.session)
  if (!signUpData.session) {
    console.warn('No session – email confirmation likely enabled. Confirm email in dashboard or disable confirmations (supabase/config.toml).')
  }

  // Need an authenticated client to insert school/profile – use session if available
  let authedClient = anonClient
  if (signUpData.session?.access_token) {
    authedClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${signUpData.session.access_token}` } },
      auth: { persistSession: false }
    })
    // For ensureSchoolAndProfile we need to use service or authed – use authed for RLS
    const { data: school, error: se } = await authedClient.from('schools').insert({ name: SCHOOL_NAME }).select().single()
    if (se) {
      console.error('Failed to create school (anon):', se.message)
      process.exit(1)
    }
    console.log('School created:', school.id)
    const { error: pe } = await authedClient.from('user_profiles').insert({ id: userId, email: ADMIN_EMAIL, full_name: 'Owner Developer', role: 'admin', school_id: school.id })
    if (pe) {
      console.error('Failed to create profile:', pe.message)
      process.exit(1)
    }
    console.log('Profile created')
    const { error: subE } = await authedClient.from('subscriptions').insert({ school_id: school.id, plan_id: 'basic', status: 'trialing' })
    if (subE) console.warn('Subscription create failed:', subE.message)
    else console.log('Subscription created')
  } else {
    await ensureSchoolAndProfile(userId)
  }

  console.log('\n✅ Admin ready:')
  console.log('  Email:    ' + ADMIN_EMAIL)
  console.log('  Password: ' + ADMIN_PASSWORD)
}

main().catch((err) => {
  console.error('Unexpected error:', err)
  process.exit(1)
})
