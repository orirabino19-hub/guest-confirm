import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0'

Deno.serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { fieldId } = await req.json()

    if (!fieldId) {
      return new Response(
        JSON.stringify({ error: 'Field ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Update the field to active
    const { data, error } = await supabase
      .from('custom_fields_config')
      .update({ 
        is_active: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', fieldId)
      .select()
      .single()

    if (error) throw error

    return new Response(
      JSON.stringify({ success: true, data }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
