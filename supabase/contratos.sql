-- Contratos que da de alta cada comercial (con la documentación que le pasan
-- inmobiliarias, colaboradores o el propio cliente). Cada comercial ve y crea
-- los suyos; el admin ve todos y gestiona el estado.
create table public.contratos (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  comercial_id uuid not null default auth.uid() references public.profiles(id),
  cliente text not null check (length(trim(cliente)) between 1 and 200),
  telefono text,
  email text,
  servicio text,
  origen text not null default 'directo' check (origen in ('directo', 'inmobiliaria', 'colaborador')),
  origen_nombre text,
  notas text,
  archivos jsonb not null default '[]',
  estado text not null default 'nuevo' check (estado in ('nuevo', 'en_tramite', 'completado'))
);
create index contratos_comercial_idx on public.contratos (comercial_id, created_at desc);
alter table public.contratos enable row level security;

create policy "comercial crea los suyos" on public.contratos
  for insert to authenticated
  with check (comercial_id = (select auth.uid()) and (select private.is_active_user()));
create policy "comercial lee los suyos, admin todos" on public.contratos
  for select to authenticated
  using ((comercial_id = (select auth.uid()) and (select private.is_active_user())) or (select private.is_admin()));
create policy "admin actualiza" on public.contratos
  for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admin borra" on public.contratos
  for delete to authenticated
  using ((select private.is_admin()));

-- Inmobiliarias y colaboradores: solo el admin (antes, cualquier usuario interno).
drop policy "staff read" on public.inmobiliaria_documentos;
drop policy "staff update" on public.inmobiliaria_documentos;
create policy "admin read" on public.inmobiliaria_documentos
  for select to authenticated using ((select private.is_admin()));
create policy "admin update" on public.inmobiliaria_documentos
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
drop policy "staff read" on public.colaboradores;
create policy "admin read" on public.colaboradores
  for select to authenticated using ((select private.is_admin()));
drop policy "staff read" on public.colaborador_usuarios;
create policy "admin read" on public.colaborador_usuarios
  for select to authenticated using ((select private.is_admin()));

-- Archivos del bucket privado `documentos`: el admin lee todo; cada comercial
-- solo la carpeta de sus contratos (contratos/<su id>/, la asigna
-- api/upload-documento.js). Las facturas del wizard siguen como estaban.
drop policy "staff read facturas y documentos" on storage.objects;
create policy "staff read facturas" on storage.objects
  for select to authenticated
  using (bucket_id = 'facturas' and (select private.is_active_user()));
create policy "admin read documentos" on storage.objects
  for select to authenticated
  using (bucket_id = 'documentos' and (select private.is_admin()));
create policy "comercial lee sus contratos" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'documentos'
    and (storage.foldername(name))[1] = 'contratos'
    and (storage.foldername(name))[2] = (select auth.uid())::text
    and (select private.is_active_user())
  );
