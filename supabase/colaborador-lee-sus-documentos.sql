-- Cada colaborador puede leer (abrir con enlace temporal) los documentos de su
-- empresa: api/upload-documento.js los guarda en documentos/colaborador/<colaborador_id>/.
-- Mismo criterio que "colaborador read propio" en inmobiliaria_documentos.
create policy "colaborador lee sus documentos" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'documentos'
    and (storage.foldername(name))[1] = 'colaborador'
    and (storage.foldername(name))[2] = (select private.colaborador_id_actual())::text
  );
