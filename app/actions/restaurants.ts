'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createRestaurantWithUser(formData: {
  name: string
  slug: string
  city: string
  email: string
  res_pass?: string
}) {
  const supabase = createAdminClient()

  // 1. Create the user in Auth
  // We use admin.createUser to bypass email confirmation and session persistence
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: formData.email,
    password: formData.res_pass || 'Temporary123!', // Auth API expects 'password' key
    email_confirm: true,
    user_metadata: {
      full_name: formData.name,
      role: 'restaurant_admin',
      res_pass: formData.res_pass
    }
  })

  if (authError) {
    return { error: authError.message }
  }

  const userId = authData.user.id

  // 2. Create the Profile manually (since we removed the trigger)
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      email: formData.email,
      full_name: formData.name,
      res_pass: formData.res_pass,
      role: 'restaurant_admin'
    })

  if (profileError) {
    await supabase.auth.admin.deleteUser(userId)
    return { error: `Profile Error: ${profileError.message}` }
  }

  // 3. Insert the restaurant
  const { data: restaurant, error: restaurantError } = await supabase
    .from('restaurants')
    .insert({
      name: formData.name,
      slug: formData.slug,
      city: formData.city,
      email: formData.email,
      res_pass: formData.res_pass,
      owner_id: userId,
      status: 'trial',
    })
    .select()
    .single()

  if (restaurantError) {
    // Cleanup
    await supabase.from('profiles').delete().eq('id', userId)
    await supabase.auth.admin.deleteUser(userId)
    return { error: `Restaurant Error: ${restaurantError.message}` }
  }

  // 4. Link profile to restaurant
  await supabase
    .from('profiles')
    .update({ restaurant_id: restaurant.id })
    .eq('id', userId)

  revalidatePath('/super-admin/restaurants')
  return { success: true, restaurant }
}
