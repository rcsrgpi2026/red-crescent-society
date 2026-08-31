-- ============================================================
-- Performance & Query Optimization Indexes
--
-- Adds composite indexes for high-frequency public queries and
-- administrative search filters to ensure sub-millisecond lookups
-- under heavy concurrent traffic.
-- ============================================================

-- 1. Urgent Blood Donor Searches (blood_group + availability)
create index if not exists blood_donors_group_avail_idx
  on public.blood_donors (blood_group, availability);

-- 2. Blood Requests Filtering (blood_group + status)
create index if not exists blood_requests_group_status_idx
  on public.blood_requests (blood_group, status);

-- 3. Event Participant Lookups & Exports (event_id + status)
create index if not exists event_registrations_event_status_idx
  on public.event_registrations (event_id, status);

-- 4. Training Participant Status Queries (training_id + status)
create index if not exists training_participants_training_status_idx
  on public.training_participants (training_id, status);

-- 5. Fast Certificate Verification (verify_token)
create index if not exists certificates_verify_token_idx
  on public.certificates (verify_token);
