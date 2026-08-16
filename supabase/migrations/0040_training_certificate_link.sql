-- ============================================================
-- Link training certificates to their training program.
--
-- Certificates issued from the training participants dialog now
-- record which training they belong to, so the admin training
-- page can show an accurate per-training certificate count.
-- Nullable + optional: certificates issued manually from the
-- general certificates page keep training_id = null.
-- ============================================================

alter table public.certificates
  add column if not exists training_id uuid references public.training (id) on delete set null;

create index if not exists certificates_training_idx on public.certificates (training_id);
