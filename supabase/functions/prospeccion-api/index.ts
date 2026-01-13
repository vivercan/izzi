// supabase/functions/prospeccion-api/index.ts
// Edge Function para hacer llamadas a Apollo y Hunter evitando CORS

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// API Keys desde secrets de Supabase
const APOLLO_API_KEY = Deno.env.get('APOLLO_API_KEY') || ''
const HUNTER_API_KEY = Deno.env.get('HUNTER_API_KEY') || ''

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, params } = await req.json()

    // ═══════════════════════════════════════════════════════════════════════
    // APOLLO - Buscar contactos
    // ═══════════════════════════════════════════════════════════════════════
    if (action === 'apollo_search') {
      const response = await fetch('https://api.apollo.io/v1/mixed_people/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify({
          api_key: APOLLO_API_KEY,
          page: params.page || 1,
          per_page: params.per_page || 100,
          organization_locations: params.locations || ['Mexico'],
          person_titles: params.titles || [],
          q_organization_name: params.company_name || undefined,
          contact_email_status: ['verified', 'likely_valid']
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Apollo Error:', errorText)
        return new Response(
          JSON.stringify({ error: 'Error en Apollo API', details: errorText }),
          { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const data = await response.json()
      
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

      return new Response(
        JSON.stringify({ success: true, contacts, total: data.pagination?.total_entries || contacts.length }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ═══════════════════════════════════════════════════════════════════════
    // HUNTER - Buscar por dominio
    // ═══════════════════════════════════════════════════════════════════════
    if (action === 'hunter_domain_search') {
      const domains = params.domains || []
      const allContacts: any[] = []

      for (const domain of domains.slice(0, 5)) { // Limitar a 5 dominios
        try {
          const response = await fetch(
            `https://api.hunter.io/v2/domain-search?domain=${domain}&api_key=${HUNTER_API_KEY}&limit=10`
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
          
          // Rate limiting entre requests
          await new Promise(resolve => setTimeout(resolve, 300))
        } catch (err) {
          console.error(`Error fetching ${domain}:`, err)
        }
      }

      return new Response(
        JSON.stringify({ success: true, contacts: allContacts }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ═══════════════════════════════════════════════════════════════════════
    // HUNTER - Verificar email
    // ═══════════════════════════════════════════════════════════════════════
    if (action === 'hunter_verify_email') {
      const email = params.email
      
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

    // Acción no reconocida
    return new Response(
      JSON.stringify({ error: 'Acción no válida' }),
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
