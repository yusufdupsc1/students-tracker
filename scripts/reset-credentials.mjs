#!/usr/bin/env node
/**
 * Reset login credentials – secure password reset helper
 * 
 * Usage:
 *   node scripts/reset-credentials.mjs --email=yusufdupsc1@gmail.com --password='NewSecurePass123!' 
 *   Or via env: ADMIN_EMAIL, ADMIN_PASSWORD
 * 
 * Requires either:
 *   - SUPABASE_SERVICE_ROLE_KEY (preferred, bypasses RLS, works even if password wrong)
 *   - Or existing correct password with ANON_KEY (will try signIn + update)
 * 
 * This script is idempotent and will:
 *   1. Find or create the auth user
 *   2. Reset password to supplied value
 *   3. Ensure school/profile/subscription exist
 *   4. Verify login works
 */

import { createClient } from '@supabase/supabase-js'

const args = Object.fromEntries(process.argv.slice(2).map(a => {
  const [k, v] = a.replace(/^--/, '').split('=')
  return [k, v || true]
}))

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://hzgaflrabmrcsokhoatv.supabase.co'
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ''
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || ''
const ADMIN_EMAIL = args.email || process.env.ADMIN_EMAIL || 'yusufdupsc1@gmail.com'
const ADMIN_PASSWORD = args.password || process.env.ADMIN_PASSWORD || 'Bejkhonda@2025!Secure'
const SCHOOL_NAME = args.school || process.env.ADMIN_SCHOOL_NAME || 'বেজখণ্ড সঃ প্রাঃ বিদ্যালয়'

console.log(`
╔════════════════════════════════════════════════════════════╗
║   🔐  Students Tracker – Reset Login Credentials          ║
╚════════════════════════════════════════════════════════════╝

Supabase URL : ${SUPABASE_URL}
Target Email : ${ADMIN_EMAIL}
Has Anon Key : ${Boolean(SUPABASE_ANON_KEY)}
Has Service  : ${Boolean(SERVICE_KEY)}
`)

if (!ADMIN_EMAIL.includes('@')) {
  console.error('❌ Invalid email:', ADMIN_EMAIL)
  process.exit(1)
}
if (ADMIN_PASSWORD.length < 6) {
  console.error('❌ Password must be at least 6 chars')
  process.exit(1)
}
if (!SUPABASE_ANON_KEY && !SERVICE_KEY) {
  console.error('❌ Missing Supabase keys. Set VITE_SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

async function verifyLogin() {
  if (!SUPABASE_ANON_KEY) return false
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data, error } = await client.auth.signInWithPassword({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
  if (error) {
    console.log('   Verify login FAILED:', error.message)
    return false
  }
  console.log('   ✅ Verify login SUCCESS – user:', data.user?.id)
  await client.auth.signOut().catch(()=>{})
  return true
}

if (SERVICE_KEY) {
  console.log('→ Using Service Role key (admin API)...')
  const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data: { users }, error: listErr } = await admin.auth.admin.listUsers()
  if (listErr) {
    console.error('❌ listUsers failed:', listErr.message)
    process.exit(1)
  }
  let user = users.find(u => u.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase())
  if (user) {
    console.log(`→ Found existing user: ${user.id} (${user.email})`)
    console.log('→ Resetting password...')
    const { error } = await admin.auth.admin.updateUserById(user.id, {
      password: ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: 'Owner Developer' }
    })
    if (error) {
      console.error('❌ Password reset failed:', error.message)
      process.exit(1)
    }
    console.log('✅ Password updated')
  } else {
    console.log('→ Creating new admin user...')
    const { data, error } = await admin.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: 'Owner Developer', school_name: SCHOOL_NAME }
    })
    if (error) {
      console.error('❌ Create user failed:', error.message)
      process.exit(1)
    }
    user = data.user
    console.log('✅ User created:', user.id)
  }

  // Ensure profile/school/subscription
  const supa = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })
  const { data: profile } = await supa.from('user_profiles').select('*, schools(*)').eq('id', user.id).maybeSingle()
  if (profile) {
    console.log('✅ Profile already exists – school:', profile.schools?.name || profile.school_id)
    const { data: sub } = await supa.from('subscriptions').select('id,status').eq('school_id', profile.school_id).maybeSingle()
    if (!sub) {
      console.log('→ Creating missing subscription...')
      const { error } = await supa.from('subscriptions').insert({ school_id: profile.school_id, plan_id: 'basic', status: 'trialing' })
      console.log(error ? '❌ sub failed: '+error.message : '✅ Subscription trialing created')
    } else {
      console.log('✅ Subscription:', sub.status)
      // Ensure not expired – reset to trialing if past_due/canceled
      if (['past_due','canceled'].includes(sub.status)) {
        await supa.from('subscriptions').update({ status: 'trialing', current_period_end: new Date(Date.now()+30*24*3600000).toISOString() }).eq('school_id', profile.school_id)
        console.log('→ Subscription reset to trialing')
      }
    }
  } else {
    console.log('→ Creating school/profile/subscription...')
    const { data: school, error: sErr } = await supa.from('schools').insert({ name: SCHOOL_NAME }).select().single()
    if (sErr) { console.error('❌ school:', sErr.message); process.exit(1) }
    console.log('✅ School:', school.id)
    const { error: pErr } = await supa.from('user_profiles').insert({ id: user.id, email: ADMIN_EMAIL, full_name: 'Owner Developer', role: 'admin', school_id: school.id })
    if (pErr) { console.error('❌ profile:', pErr.message); process.exit(1) }
    console.log('✅ Profile created')
    const { error: subErr } = await supa.from('subscriptions').insert({ school_id: school.id, plan_id: 'basic', status: 'trialing' })
    console.log(subErr ? '❌ sub: '+subErr.message : '✅ Subscription trialing')
  }

  console.log('\n🔍 Verifying login...')
  const ok = await verifyLogin()
  console.log(ok ? '\n✅✅✅  CREDENTIALS RESET SUCCESS  ✅✅✅' : '\n⚠️  Password set but verify failed – check ANON_KEY or RLS')
  console.log(`
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Email   : ${ADMIN_EMAIL}
   Password: ${ADMIN_PASSWORD}
   Login   : /login  →  then /app
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `)
  process.exit(ok ? 0 : 1)
} else {
  console.log('→ No service key – attempting anon flow (requires email confirmations OFF)')
  console.log('  If this fails, set SUPABASE_SERVICE_ROLE_KEY from Supabase Dashboard → Project Settings → API')
  const anon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } })
  // Try signIn first
  const { data: si, error: se } = await anon.auth.signInWithPassword({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
  if (!se && si.user) {
    console.log('✅ Already can login – password correct')
    console.log('→ Ensuring profile...')
    // Need authenticated client to check profile
    const authed = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: `Bearer ${si.session.access_token}` } }, auth: { persistSession: false } })
    const { data: prof } = await authed.from('user_profiles').select('id').eq('id', si.user.id).maybeSingle()
    if (!prof) {
      console.log('⚠️ No profile – run seed:admin with authenticated session or use service key')
    } else {
      console.log('✅ Profile exists')
    }
    console.log(`\n✅ Credentials verified – login with ${ADMIN_EMAIL}`)
    process.exit(0)
  }
  console.log(' signIn failed:', se?.message)
  console.log('→ Trying signUp...')
  const { data: su, error: sue } = await anon.auth.signUp({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD, options: { data: { full_name: 'Owner Developer' } } })
  if (sue) {
    if (sue.message.includes('already registered')) {
      console.error('\n❌ User exists but password is WRONG and no service key to reset.')
      console.error('   Fix: Get SUPABASE_SERVICE_ROLE_KEY from https://supabase.com/dashboard/project/hzgaflrabmrcsokhoatv/settings/api')
      console.error('   Then: SUPABASE_SERVICE_ROLE_KEY=xxx node scripts/reset-credentials.mjs --password="NewPass123!"')
      process.exit(1)
    }
    console.error('❌ signUp failed:', sue.message)
    process.exit(1)
  }
  console.log('✅ signUp created:', su.user?.id, 'session?', !!su.session)
  if (!su.session) {
    console.warn('⚠️ No session – email confirmation enabled. Disable in Supabase Dashboard → Auth → Email → Confirm email = OFF')
    console.warn('   Or confirm email via link, then run: node scripts/reset-credentials.mjs --email='+ADMIN_EMAIL+' --password="'+ADMIN_PASSWORD+'"')
  } else {
    console.log('✅ Auto-logged in – creating profile...')
    // use session token
    const authed = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: `Bearer ${su.session.access_token}` } }, auth: { persistSession: false } })
    const { data: school, error: se2 } = await authed.from('schools').insert({ name: SCHOOL_NAME }).select().single()
    if (se2) { console.error('❌ school:', se2.message); process.exit(1) }
    const { error: pe } = await authed.from('user_profiles').insert({ id: su.user.id, email: ADMIN_EMAIL, full_name: 'Owner Developer', role: 'admin', school_id: school.id })
    if (pe) { console.error('❌ profile:', pe.message); process.exit(1) }
    await authed.from('subscriptions').insert({ school_id: school.id, plan_id: 'basic', status: 'trialing' })
    console.log('✅ Profile + subscription created')
  }
  const ok = await verifyLogin()
  console.log(ok ? '\n✅ Done – try logging in' : '\n⚠️ Created but verify failed')
}
