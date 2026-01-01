-- FX27 | GPS DIAG + FIX (Generated 20251222_182521)
-- OBJETIVO: Arreglar "Despacho Inteligente" (gps_tracking) cuando el cron/worker falla con 401 Missing authorization header.

-- A) Ver columnas reales de gps_tracking (para confirmar estructura)
select column_name, data_type
from information_schema.columns
where table_schema='public' and table_name='gps_tracking'
order by ordinal_position;

-- B) Señal rápida de "frescura" (sin casteos peligrosos)
select
  now() as now_db,
  max(timestamp_gps) as max_timestamp_gps_text,
  count(*) as rows
from public.gps_tracking;

-- C) Top 25 más recientes (si timestamp_gps viene en ISO, este ORDER funciona perfecto)
select economico, empresa, estatus, velocidad, ubicacion, timestamp_gps
from public.gps_tracking
order by timestamp_gps desc nulls last
limit 25;

-- D) Cron jobs que estén pegándole a widetech batch (para ubicar el viejo)
select jobid, schedule, active, substring(command,1,220) as command_220
from cron.job
where command ilike '%widetech/locations/batch%'
order by jobid desc;

-- E) Últimas respuestas HTTP (aquí estabas viendo los 401)
select id, status_code, substr(content,1,160) as content_160, created
from net._http_response
order by id desc
limit 30;

-- F) FIX: crear cron NUEVO con Authorization header (no borra el anterior)
-- NOTA: Si te marca "already exists", cambia el nombre del job (fx27_gps_worker_widetech_batch_v2).
select cron.schedule(
  'fx27_gps_worker_widetech_batch_v2',
  '*/3 * * * *',
  \$\ net.http_post(
        url := 'https://<TU-PROYECTO>.supabase.co/functions/v1/make-server-d84b50bb/widetech/locations/batch',
        headers := jsonb_build_object(
          'Content-Type','application/json',
          'Authorization','Bearer <PON_AQUI_TU_ANON_KEY>'
        ),
        body := '{}'::jsonb
      );\$\$
);

-- G) Para probar SIN esperar cron (opcional): dispara 1 vez el POST manualmente
-- select net.http_post(
--   url := 'https://<TU-PROYECTO>.supabase.co/functions/v1/make-server-d84b50bb/widetech/locations/batch',
--   headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer <PON_AQUI_TU_ANON_KEY>'),
--   body := '{}'::jsonb
-- );
