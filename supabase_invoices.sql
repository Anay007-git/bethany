-- 4. INVOICES TABLE
-- Stores immutable bill breakdown for auditability
create table invoices (
  id uuid primary key default uuid_generate_v4(),
  booking_id uuid references bookings(id),
  invoice_number text not null, -- e.g., INV-2026-001
  issue_date date default CURRENT_DATE,
  due_date date,
  items jsonb not null, -- Array of { description, quantity, unit_price, total }
  subtotal decimal(10,2) not null,
  tax_amount decimal(10,2) default 0,
  total_amount decimal(10,2) not null,
  status text check (status in ('issued', 'paid', 'cancelled')) default 'issued',
  created_at timestamp with time zone default now()
);

-- RLS Policies for Invoices
alter table invoices enable row level security;

-- Allow public insert (triggered by booking creation)
create policy "Allow public insert invoices" on invoices for insert with check (true);

-- Allow public read (for bill view)
create policy "Allow public read invoices" on invoices for select using (true);
