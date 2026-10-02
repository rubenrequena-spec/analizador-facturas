-- Bucket público `tarifas`: PDFs comerciales (no datos personales) que se
-- enseñan en la página pública de inmobiliarias y a los colaboradores.
-- Lectura pública por URL; solo el personal activo puede subir y borrar.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('tarifas', 'tarifas', true, 10485760, array['application/pdf','image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy "staff sube tarifas" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'tarifas' and (select private.is_active_user()));

create policy "staff borra tarifas" on storage.objects
  for delete to authenticated
  using (bucket_id = 'tarifas' and (select private.is_active_user()));
