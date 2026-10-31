create table public.notebook_notes (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null,
  title text not null default '',
  body text not null default '',
  topic_slug text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.notebook_notes enable row level security;
create policy notebook_notes_select on public.notebook_notes for select to authenticated using (auth.uid() = student_id);
create policy notebook_notes_insert on public.notebook_notes for insert to authenticated with check (auth.uid() = student_id);
create policy notebook_notes_update on public.notebook_notes for update to authenticated using (auth.uid() = student_id) with check (auth.uid() = student_id);
create policy notebook_notes_delete on public.notebook_notes for delete to authenticated using (auth.uid() = student_id);
grant select, insert, update, delete on public.notebook_notes to authenticated;

create table public.planner_tasks (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null,
  title text not null,
  subject text not null default '',
  due_date date,
  done boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.planner_tasks enable row level security;
create policy planner_tasks_select on public.planner_tasks for select to authenticated using (auth.uid() = student_id);
create policy planner_tasks_insert on public.planner_tasks for insert to authenticated with check (auth.uid() = student_id);
create policy planner_tasks_update on public.planner_tasks for update to authenticated using (auth.uid() = student_id) with check (auth.uid() = student_id);
create policy planner_tasks_delete on public.planner_tasks for delete to authenticated using (auth.uid() = student_id);
grant select, insert, update, delete on public.planner_tasks to authenticated;

create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  student_id uuid not null,
  day date not null,
  present boolean not null default true,
  created_at timestamptz not null default now(),
  unique (classroom_id, student_id, day)
);
alter table public.attendance enable row level security;
create policy attendance_teacher_all on public.attendance for all to authenticated
  using (exists (select 1 from public.classrooms c where c.id = classroom_id and c.teacher_id = auth.uid()))
  with check (exists (select 1 from public.classrooms c where c.id = classroom_id and c.teacher_id = auth.uid()));
create policy attendance_student_read on public.attendance for select to authenticated using (auth.uid() = student_id);
grant select, insert, update, delete on public.attendance to authenticated;