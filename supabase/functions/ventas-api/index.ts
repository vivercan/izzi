// Edge Function: ventas-api
// Consulta datos de ventas + análisis IA con Claude API

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VentasQuery {
  action: "stats" | "top_clientes" | "by_periodo" | "by_segmento" | "by_empresa" | "ai_analysis" | "ultima_actualizacion";
  periodo?: { inicio: string; fin: string };
  year?: number;
  month?: number;
  limit?: number;
  pregunta?: string; // Para análisis IA
}

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    const body: VentasQuery = await req.json();

    let result: any = {};

    switch (body.action) {
      // ============================================================
      // ÚLTIMA ACTUALIZACIÓN
      // ============================================================
      case "ultima_actualizacion": {
        const { data } = await supabase
          .from("ventas_maestro")
          .select("fecha_factura")
          .order("fecha_factura", { ascending: false })
          .limit(1)
          .single();
        
        result = {
          ultima_fecha: data?.fecha_factura,
          mensaje: `Datos actualizados al: ${new Date(data?.fecha_factura).toLocaleDateString('es-MX')}`
        };
        break;
      }

      // ============================================================
      // ESTADÍSTICAS GENERALES
      // ============================================================
      case "stats": {
        const { data: total } = await supabase
          .from("ventas_maestro")
          .select("id_viaje, ventas", { count: "exact" });

        const totalVentas = total?.reduce((sum, r) => sum + (r.ventas || 0), 0) || 0;
        const totalViajes = total?.length || 0;

        // Por segmento
        const { data: porSegmento } = await supabase
          .from("ventas_maestro")
          .select("segmento, ventas");

        const segmentos = porSegmento?.reduce((acc: any, r) => {
          const seg = r.segmento || "SIN_SEGMENTO";
          if (!acc[seg]) acc[seg] = { viajes: 0, ventas: 0 };
          acc[seg].viajes++;
          acc[seg].ventas += r.ventas || 0;
          return acc;
        }, {});

        // Por empresa
        const { data: porEmpresa } = await supabase
          .from("ventas_maestro")
          .select("empresa, ventas");

        const empresas = porEmpresa?.reduce((acc: any, r) => {
          const emp = r.empresa || "SIN_EMPRESA";
          if (!acc[emp]) acc[emp] = { viajes: 0, ventas: 0 };
          acc[emp].viajes++;
          acc[emp].ventas += r.ventas || 0;
          return acc;
        }, {});

        result = {
          total_viajes: totalViajes,
          total_ventas: totalVentas,
          por_segmento: segmentos,
          por_empresa: empresas
        };
        break;
      }

      // ============================================================
      // TOP CLIENTES
      // ============================================================
      case "top_clientes": {
        const limit = body.limit || 10;
        let query = supabase
          .from("ventas_maestro")
          .select("cliente_consolidado, ventas");

        // Filtro por período si se especifica
        if (body.periodo) {
          query = query
            .gte("fecha_factura", body.periodo.inicio)
            .lte("fecha_factura", body.periodo.fin);
        }

        if (body.year) {
          const inicio = `${body.year}-01-01`;
          const fin = `${body.year}-12-31`;
          query = query.gte("fecha_factura", inicio).lte("fecha_factura", fin);
        }

        const { data } = await query;

        // Agrupar por cliente
        const clientes = data?.reduce((acc: any, r) => {
          const cliente = r.cliente_consolidado || "SIN_CLIENTE";
          if (!acc[cliente]) acc[cliente] = { viajes: 0, ventas: 0 };
          acc[cliente].viajes++;
          acc[cliente].ventas += r.ventas || 0;
          return acc;
        }, {});

        // Ordenar y limitar
        const topClientes = Object.entries(clientes || {})
          .map(([nombre, stats]: [string, any]) => ({ nombre, ...stats }))
          .sort((a, b) => b.ventas - a.ventas)
          .slice(0, limit);

        result = { top_clientes: topClientes };
        break;
      }

      // ============================================================
      // POR PERÍODO (año/mes)
      // ============================================================
      case "by_periodo": {
        let query = supabase.from("ventas_maestro").select("fecha_factura, ventas, segmento");

        if (body.year) {
          const inicio = `${body.year}-01-01`;
          const fin = `${body.year}-12-31`;
          query = query.gte("fecha_factura", inicio).lte("fecha_factura", fin);
        }

        const { data } = await query;

        // Agrupar por mes
        const porMes = data?.reduce((acc: any, r) => {
          const fecha = new Date(r.fecha_factura);
          const mes = fecha.getMonth() + 1;
          const key = `${fecha.getFullYear()}-${String(mes).padStart(2, '0')}`;
          if (!acc[key]) acc[key] = { viajes: 0, ventas: 0, impex: 0, dedicado: 0 };
          acc[key].viajes++;
          acc[key].ventas += r.ventas || 0;
          if (r.segmento === "IMPEX") acc[key].impex += r.ventas || 0;
          if (r.segmento === "DEDICADO") acc[key].dedicado += r.ventas || 0;
          return acc;
        }, {});

        result = { por_mes: porMes };
        break;
      }

      // ============================================================
      // POR SEGMENTO
      // ============================================================
      case "by_segmento": {
        let query = supabase.from("ventas_maestro").select("segmento, cliente_consolidado, ventas");

        if (body.year) {
          const inicio = `${body.year}-01-01`;
          const fin = `${body.year}-12-31`;
          query = query.gte("fecha_factura", inicio).lte("fecha_factura", fin);
        }

        const { data } = await query;

        const resultado: any = { IMPEX: { total: 0, clientes: {} }, DEDICADO: { total: 0, clientes: {} } };

        data?.forEach((r) => {
          const seg = r.segmento || "DEDICADO";
          const cliente = r.cliente_consolidado || "SIN_CLIENTE";
          resultado[seg].total += r.ventas || 0;
          if (!resultado[seg].clientes[cliente]) resultado[seg].clientes[cliente] = 0;
          resultado[seg].clientes[cliente] += r.ventas || 0;
        });

        result = resultado;
        break;
      }

      // ============================================================
      // POR EMPRESA
      // ============================================================
      case "by_empresa": {
        let query = supabase.from("ventas_maestro").select("empresa, segmento, ventas");

        if (body.year) {
          const inicio = `${body.year}-01-01`;
          const fin = `${body.year}-12-31`;
          query = query.gte("fecha_factura", inicio).lte("fecha_factura", fin);
        }

        const { data } = await query;

        const empresas: any = {};
        data?.forEach((r) => {
          const emp = r.empresa || "SIN_EMPRESA";
          if (!empresas[emp]) empresas[emp] = { viajes: 0, ventas: 0, impex: 0, dedicado: 0 };
          empresas[emp].viajes++;
          empresas[emp].ventas += r.ventas || 0;
          if (r.segmento === "IMPEX") empresas[emp].impex += r.ventas || 0;
          if (r.segmento === "DEDICADO") empresas[emp].dedicado += r.ventas || 0;
        });

        result = { empresas };
        break;
      }

      // ============================================================
      // ANÁLISIS IA CON CLAUDE
      // ============================================================
      case "ai_analysis": {
        if (!anthropicKey) {
          result = { error: "API de Claude no configurada" };
          break;
        }

        // Obtener contexto de datos para Claude
        const { data: statsData } = await supabase
          .from("ventas_maestro")
          .select("cliente_consolidado, segmento, empresa, ventas, fecha_factura");

        // Calcular métricas para contexto
        const totalVentas = statsData?.reduce((sum, r) => sum + (r.ventas || 0), 0) || 0;
        const totalViajes = statsData?.length || 0;

        // Top 10 clientes
        const clienteStats: any = {};
        statsData?.forEach((r) => {
          const c = r.cliente_consolidado || "OTROS";
          if (!clienteStats[c]) clienteStats[c] = 0;
          clienteStats[c] += r.ventas || 0;
        });
        const top10 = Object.entries(clienteStats)
          .sort((a: any, b: any) => b[1] - a[1])
          .slice(0, 10);

        // Por segmento
        const segStats: any = { IMPEX: 0, DEDICADO: 0 };
        statsData?.forEach((r) => {
          segStats[r.segmento || "DEDICADO"] += r.ventas || 0;
        });

        // Por empresa
        const empStats: any = {};
        statsData?.forEach((r) => {
          const e = r.empresa || "OTROS";
          if (!empStats[e]) empStats[e] = 0;
          empStats[e] += r.ventas || 0;
        });

        const contexto = `
DATOS DE VENTAS GRUPO LOMA (TROB/WE/SHI):
- Total viajes: ${totalViajes.toLocaleString()}
- Total ventas: $${totalVentas.toLocaleString()} MXN

TOP 10 CLIENTES:
${top10.map(([c, v]: any, i) => `${i + 1}. ${c}: $${v.toLocaleString()}`).join("\n")}

POR SEGMENTO:
- IMPEX: $${segStats.IMPEX.toLocaleString()} MXN
- DEDICADO: $${segStats.DEDICADO.toLocaleString()} MXN

POR EMPRESA:
${Object.entries(empStats).map(([e, v]: any) => `- ${e}: $${v.toLocaleString()}`).join("\n")}
`;

        // Llamar a Claude API
        const claudeResponse = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": anthropicKey,
            "anthropic-version": "2023-06-01"
          },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1024,
            system: `Eres un analista de datos experto en logística y transporte. 
Analiza los datos de ventas de Grupo Loma (empresas TROB, WE, SHI) y responde preguntas de negocio.
Sé conciso, directo y proporciona insights accionables.
Responde siempre en español.`,
            messages: [
              {
                role: "user",
                content: `${contexto}\n\nPREGUNTA DEL USUARIO: ${body.pregunta}`
              }
            ]
          })
        });

        const claudeData = await claudeResponse.json();
        const respuestaIA = claudeData.content?.[0]?.text || "No se pudo generar análisis";

        result = {
          pregunta: body.pregunta,
          respuesta: respuestaIA,
          contexto_usado: {
            total_viajes: totalViajes,
            total_ventas: totalVentas,
            top_clientes: top10.length
          }
        };
        break;
      }

      default:
        result = { error: "Acción no válida" };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500
    });
  }
});
