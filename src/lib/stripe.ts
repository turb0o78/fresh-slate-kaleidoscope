import { loadStripe } from '@stripe/stripe-js';
import { supabase } from './supabase';
import type { SubscriptionPlan } from './types';

// Initialize Stripe as a promise
let stripePromise: Promise<any> | null = null;

export function getStripe() {
  if (!stripePromise) {
    stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
}

export async function createCheckoutSession(priceId: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get the plan details
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('*')
      .eq('id', priceId)
      .single();

    if (planError || !plan) {
      throw new Error('Invalid plan selected');
    }

    // Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id: user.id,
        product_id: plan.id,
        quantity: 1,
        total_amount: plan.price / 100,
        status: 'pending',
      })
      .select()
      .single();

    if (paymentError) throw paymentError;

    // Create Stripe checkout session
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        userId: user.id,
        planId: plan.id,
        paymentId: payment.id,
        customerEmail: user.email,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create checkout session');
    }

    const { url } = await response.json();
    window.location.href = url;
  } catch (err) {
    console.error('Error creating checkout session:', err);
    throw err;
  }
}

export async function getCurrentPlan() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: userPlan, error } = await supabase
      .from('user_plans')
      .select(`
        *,
        plan:plans(*)
      `)
      .eq('user_id', user.id)
      .eq('active', true)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;
    return userPlan;
  } catch (error) {
    console.error('Error getting current plan:', error);
    return null;
  }
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(price / 100);
}