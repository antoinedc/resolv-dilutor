-- Create points_stats table
create table if not exists public.points_stats (
    id bigint primary key generated always as identity,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    total_points bigint not null,
    min_points_needed integer not null
);

-- Add indexes
create index if not exists points_stats_created_at_idx on public.points_stats (created_at desc);

-- Set up RLS (Row Level Security)
alter table public.points_stats enable row level security;

-- Create policy to allow anyone to read points_stats
create policy "Allow public read access"
    on public.points_stats
    for select
    to anon
    using (true);

-- Create policy to allow only authenticated service role to insert
create policy "Allow service role to insert"
    on public.points_stats
    for insert
    to service_role
    using (true); 