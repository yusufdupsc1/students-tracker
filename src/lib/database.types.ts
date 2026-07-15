export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete'

export interface School {
  id: string
  name: string
  village?: string
  post_office?: string
  upazila?: string
  district?: string
  created_at: string
  updated_at: string
}

export interface UserProfile {
  id: string
  email: string
  full_name: string
  phone?: string
  role: 'admin' | 'teacher' | 'viewer'
  school_id: string
  created_at: string
  updated_at: string
}

export interface Subscription {
  id: string
  school_id: string
  plan_id: string
  status: SubscriptionStatus
  current_period_start: string
  current_period_end: string
  cancel_at_period_end: boolean
  created_at: string
  updated_at: string
}

export interface Plan {
  id: string
  name: string
  price_monthly_bdt: number
  price_yearly_bdt: number
  max_students: number
  features: string[]
  is_active: boolean
}

export interface Database {
  public: {
    Tables: {
      schools: {
        Row: School
        Insert: Omit<School, 'created_at' | 'updated_at'>
        Update: Partial<Omit<School, 'id' | 'created_at' | 'updated_at'>>
      }
      user_profiles: {
        Row: UserProfile
        Insert: Omit<UserProfile, 'created_at' | 'updated_at'>
        Update: Partial<Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>>
      }
      subscriptions: {
        Row: Subscription
        Insert: Omit<Subscription, 'created_at' | 'updated_at'>
        Update: Partial<Omit<Subscription, 'id' | 'created_at' | 'updated_at'>>
      }
      plans: {
        Row: Plan
        Insert: Omit<Plan, 'id'>
        Update: Partial<Omit<Plan, 'id'>>
      }
    }
  }
}
