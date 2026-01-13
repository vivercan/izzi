// supabase/functions/prospeccion-api/index.ts
// Edge Function para hacer llamadas a Apollo y Hunter evitando CORS
// Version 2 - Mejor manejo de errores

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Obtener API Keys desde secrets de Supabase
  const APOLLO_API_KEY = Deno.env.get('APOLLO_API_KEY')
  const HUNTER_API_KEY = Deno.env.get('HUNTER_API_KEY')

  console.log('=== PROSPECCION API CALLED ===')
  console.log('Apollo Key exists:', !!APOLLO_API_KEY)
  console.log('Hunter Key exists:', !!HUNTER_API_KEY)

  try {
    const body = await req.json()
    const { action, params } = body

    console.log('Action:', action)
    console.log('Params:', JSON.stringify(params))

    // ═══════════════════════════════════════════════════════════════════════
    // APOLLO - Buscar contactos
    // ═══════════════════════════════════════════════════════════════════════
    if (action === 'apollo_search') {
      if (!APOLLO_API_KEY) {
        console.error('APOLLO_API_KEY not configured in secrets')
        return new Response(
          JSON.stringify({ error: 'Apollo API Key no configurada en Supabase Secrets' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const apolloBody: any = {
        page: params?.page || 1,
        per_page: params?.per_page || 100,
        person_locations: params?.locations || ['Mexico'],
        person_titles: params?.titles || ['CEO', 'Director', 'Manager'],
        contact_email_status: ['verified', 'likely_valid']
      }

      // Agregar company_name si está definido
      if (params?.company_name) {
        apolloBody.q_organization_name = params.company_name
      }

      // Agregar keywords de organización si están definidos
      if (params?.keywords && params.keywords.length > 0) {
        apolloBody.q_organization_keyword_tags = params.keywords
      }

      // Agregar industrias si están definidas
      if (params?.industries && params.industries.length > 0) {
        apolloBody.organization_industry_tag_ids = params.industries
      }

      console.log('Apollo request body:', JSON.stringify(apolloBody))

      const response = await fetch('https://api.apollo.io/v1/mixed_people/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'X-Api-Key': APOLLO_API_KEY
        },
        body: JSON.stringify(apolloBody)
      })

      const responseText = await response.text()
      console.log('Apollo response status:', response.status)
      console.log('Apollo response:', responseText.substring(0, 500))

      if (!response.ok) {
        return new Response(
          JSON.stringify({ error: 'Error en Apollo API', details: responseText, status: response.status }),
          { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      let data
      try {
        data = JSON.parse(responseText)
      } catch (e) {
        return new Response(
          JSON.stringify({ error: 'Error parsing Apollo response', details: responseText }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      // Mapear a formato estándar
      const contacts = (data.people || []).map((p: any, idx: number) => ({
        id: `apollo-${idx}-${Date.now()}`,
        nombre: p.first_name || '',
        apellido: p.last_name || '',
        email: p.email || '',
        emailVerificado: p.email_status === 'verified',
        emailScore: p.email_status === 'verified' ? 100 : p.email_status === 'likely_valid' ? 80 : 50,
        empresa: p.organization?.name || '',
        industria: p.organization?.industry || '',
        puesto: p.title || '',
        ciudad: p.city || '',
        estado: p.state || '',
        pais: p.country || 'Mexico',
        linkedin: p.linkedin_url || '',
        telefono: p.phone_numbers?.[0]?.sanitized_number || '',
        fuente: 'apollo'
      }))

      console.log('Returning', contacts.length, 'contacts from Apollo')

      return new Response(
        JSON.stringify({ success: true, contacts, total: data.pagination?.total_entries || contacts.length }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ═══════════════════════════════════════════════════════════════════════
    // HUNTER - Buscar por dominio
    // ═══════════════════════════════════════════════════════════════════════
    if (action === 'hunter_domain_search') {
      if (!HUNTER_API_KEY) {
        console.error('HUNTER_API_KEY not configured in secrets')
        return new Response(
          JSON.stringify({ error: 'Hunter API Key no configurada en Supabase Secrets' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const domains = params?.domains || []
      console.log('Hunter searching domains:', domains)

      const allContacts: any[] = []

      for (const domain of domains.slice(0, 5)) {
        try {
          console.log('Fetching domain:', domain)
          const response = await fetch(
            `https://api.hunter.io/v2/domain-search?domain=${domain}&api_key=${HUNTER_API_KEY}&limit=10`
          )

          const responseText = await response.text()
          console.log(`Hunter response for ${domain}:`, response.status)

          if (response.ok) {
            const data = JSON.parse(responseText)
            const emails = data.data?.emails || []
            
            emails.forEach((e: any, idx: number) => {
              allContacts.push({
                id: `hunter-${domain}-${idx}-${Date.now()}`,
                nombre: e.first_name || '',
                apellido: e.last_name || '',
                email: e.value || '',
                emailVerificado: e.verification?.status === 'valid',
                emailScore: e.confidence || 0,
                empresa: data.data?.organization || domain,
                industria: data.data?.industry || '',
                puesto: e.position || '',
                ciudad: '',
                estado: '',
                pais: 'Mexico',
                linkedin: e.linkedin || '',
                telefono: e.phone_number || '',
                fuente: 'hunter'
              })
            })
          }
          
          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 300))
        } catch (err) {
          console.error(`Error fetching ${domain}:`, err)
        }
      }

      console.log('Returning', allContacts.length, 'contacts from Hunter')

      return new Response(
        JSON.stringify({ success: true, contacts: allContacts }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ═══════════════════════════════════════════════════════════════════════
    // HUNTER - Verificar email
    // ═══════════════════════════════════════════════════════════════════════
    if (action === 'hunter_verify_email') {
      if (!HUNTER_API_KEY) {
        return new Response(
          JSON.stringify({ success: false, valid: false, score: 0, error: 'Hunter API Key no configurada' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const email = params?.email
      console.log('Verifying email:', email)
      
      const response = await fetch(
        `https://api.hunter.io/v2/email-verifier?email=${encodeURIComponent(email)}&api_key=${HUNTER_API_KEY}`
      )

      if (response.ok) {
        const data = await response.json()
        return new Response(
          JSON.stringify({ 
            success: true, 
            valid: data.data?.status === 'valid',
            score: data.data?.score || 0
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ success: false, valid: false, score: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ═══════════════════════════════════════════════════════════════════════
    // TEST - Verificar que los secrets están configurados
    // ═══════════════════════════════════════════════════════════════════════
    if (action === 'test') {
      return new Response(
        JSON.stringify({ 
          success: true,
          apollo_configured: !!APOLLO_API_KEY,
          hunter_configured: !!HUNTER_API_KEY,
          apollo_key_preview: APOLLO_API_KEY ? APOLLO_API_KEY.substring(0, 5) + '...' : 'NOT SET',
          hunter_key_preview: HUNTER_API_KEY ? HUNTER_API_KEY.substring(0, 5) + '...' : 'NOT SET'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Acción no reconocida
    return new Response(
      JSON.stringify({ error: 'Acción no válida: ' + action }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error general:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Error interno' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
