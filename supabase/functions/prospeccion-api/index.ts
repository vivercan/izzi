// supabase/functions/prospeccion-api/index.ts
// Edge Function para Apollo y Hunter - VERSIÓN CORREGIDA

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const APOLLO_API_KEY = Deno.env.get('APOLLO_API_KEY')
  const HUNTER_API_KEY = Deno.env.get('HUNTER_API_KEY')

  console.log('=== PROSPECCION API v3 ===')

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
        return new Response(
          JSON.stringify({ error: 'Apollo API Key no configurada' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Construir el body según documentación oficial de Apollo
      // https://apolloio.github.io/apollo-api-docs/?shell#search-for-people
      const apolloBody: any = {
        page: params?.page || 1,
        per_page: params?.per_page || 100
      }

      // Ubicaciones de organización (formato: ["Querétaro, Mexico", "Aguascalientes, Mexico"])
      if (params?.locations && params.locations.length > 0) {
        apolloBody.organization_locations = params.locations
      }

      // Títulos/puestos de personas
      if (params?.titles && params.titles.length > 0) {
        apolloBody.person_titles = params.titles
      }

      // Búsqueda por nombre de empresa
      if (params?.company_name) {
        apolloBody.q_organization_name = params.company_name
      }

      // Keywords de industria (formato: ["agroindustrial", "automotive"])
      if (params?.keywords && params.keywords.length > 0) {
        apolloBody.q_organization_keyword_tags = params.keywords
      }

      // Solo emails verificados
      apolloBody.contact_email_status = ['verified', 'likely_valid']

      console.log('Apollo request body:', JSON.stringify(apolloBody, null, 2))

      const response = await fetch('https://api.apollo.io/api/v1/mixed_people/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': APOLLO_API_KEY,
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify(apolloBody)
      })

      const responseText = await response.text()
      console.log('Apollo response status:', response.status)
      console.log('Apollo response preview:', responseText.substring(0, 500))

      if (!response.ok) {
        return new Response(
          JSON.stringify({ 
            error: 'Error en Apollo API', 
            status: response.status,
            details: responseText 
          }),
          { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      let data
      try {
        data = JSON.parse(responseText)
      } catch (e) {
        return new Response(
          JSON.stringify({ error: 'Error parsing response', details: responseText }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
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
      console.log('Total available:', data.pagination?.total_entries)

      return new Response(
        JSON.stringify({ 
          success: true, 
          contacts, 
          total: data.pagination?.total_entries || contacts.length,
          page: data.pagination?.page,
          total_pages: data.pagination?.total_pages
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ═══════════════════════════════════════════════════════════════════════
    // HUNTER - Buscar por dominio
    // ═══════════════════════════════════════════════════════════════════════
    if (action === 'hunter_domain_search') {
      if (!HUNTER_API_KEY) {
        return new Response(
          JSON.stringify({ error: 'Hunter API Key no configurada' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const domains = params?.domains || []
      console.log('Hunter searching domains:', domains)

      const allContacts: any[] = []

      for (const domain of domains.slice(0, 10)) {
        try {
          console.log('Fetching domain:', domain)
          const response = await fetch(
            `https://api.hunter.io/v2/domain-search?domain=${domain}&api_key=${HUNTER_API_KEY}&limit=20`
          )

          if (response.ok) {
            const data = await response.json()
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
          
          await new Promise(resolve => setTimeout(resolve, 200))
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
          JSON.stringify({ success: false, valid: false, score: 0 }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const email = params?.email
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
    // TEST
    // ═══════════════════════════════════════════════════════════════════════
    if (action === 'test') {
      return new Response(
        JSON.stringify({ 
          success: true,
          version: 'v3',
          apollo_configured: !!APOLLO_API_KEY,
          hunter_configured: !!HUNTER_API_KEY
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Acción no válida: ' + action }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
