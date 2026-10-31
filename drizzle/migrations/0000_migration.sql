CREATE TYPE public.app_role AS ENUM ('student', 'teacher');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own profile read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own roles read" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Signup: create profile + the single role chosen at signup (student or teacher only).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r text := NEW.raw_user_meta_data->>'role';
BEGIN
  INSERT INTO public.profiles (id, full_name) VALUES (NEW.id, coalesce(NEW.raw_user_meta_data->>'full_name', ''));
  IF r NOT IN ('student', 'teacher') THEN r := 'student'; END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, r::public.app_role);
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.classrooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL,
  name text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 80),
  subject text NOT NULL DEFAULT '',
  code text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.classrooms TO authenticated;
GRANT ALL ON public.classrooms TO service_role;
ALTER TABLE public.classrooms ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.classroom_members (
  classroom_id uuid NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  student_id uuid NOT NULL,
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (classroom_id, student_id)
);
GRANT SELECT, DELETE ON public.classroom_members TO authenticated;
GRANT ALL ON public.classroom_members TO service_role;
ALTER TABLE public.classroom_members ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_teacher_of(_classroom uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.classrooms WHERE id = _classroom AND teacher_id = _user)
$$;
CREATE OR REPLACE FUNCTION public.is_member_of(_classroom uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.classroom_members WHERE classroom_id = _classroom AND student_id = _user)
$$;

CREATE POLICY "Teacher reads own classrooms" ON public.classrooms FOR SELECT TO authenticated USING (teacher_id = auth.uid() OR public.is_member_of(id, auth.uid()));
CREATE POLICY "Verified teachers create classrooms" ON public.classrooms FOR INSERT TO authenticated WITH CHECK (teacher_id = auth.uid() AND public.has_role(auth.uid(), 'teacher'));
CREATE POLICY "Teacher updates own classrooms" ON public.classrooms FOR UPDATE TO authenticated USING (teacher_id = auth.uid()) WITH CHECK (teacher_id = auth.uid());
CREATE POLICY "Teacher deletes own classrooms" ON public.classrooms FOR DELETE TO authenticated USING (teacher_id = auth.uid());

CREATE POLICY "Members visible to student and teacher" ON public.classroom_members FOR SELECT TO authenticated USING (student_id = auth.uid() OR public.is_teacher_of(classroom_id, auth.uid()));
CREATE POLICY "Student leaves or teacher removes" ON public.classroom_members FOR DELETE TO authenticated USING (student_id = auth.uid() OR public.is_teacher_of(classroom_id, auth.uid()));

-- Unique 6-char code, always generated server-side.
CREATE OR REPLACE FUNCTION public.set_classroom_code()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c text; chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
BEGIN
  LOOP
    c := '';
    FOR i IN 1..6 LOOP c := c || substr(chars, 1 + floor(random() * length(chars))::int, 1); END LOOP;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.classrooms WHERE code = c);
  END LOOP;
  NEW.code := c;
  RETURN NEW;
END $$;
CREATE TRIGGER classrooms_code BEFORE INSERT ON public.classrooms FOR EACH ROW EXECUTE FUNCTION public.set_classroom_code();

-- Students join by code; only this function can add memberships.
CREATE OR REPLACE FUNCTION public.join_classroom(_code text)
RETURNS TABLE (classroom_id uuid, classroom_name text, teacher_id uuid)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c public.classrooms;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not_signed_in'; END IF;
  IF NOT public.has_role(auth.uid(), 'student') THEN RAISE EXCEPTION 'not_student'; END IF;
  SELECT * INTO c FROM public.classrooms WHERE code = upper(trim(_code));
  IF c.id IS NULL THEN RAISE EXCEPTION 'invalid_code'; END IF;
  INSERT INTO public.classroom_members (classroom_id, student_id) VALUES (c.id, auth.uid()) ON CONFLICT DO NOTHING;
  RETURN QUERY SELECT c.id, c.name, c.teacher_id;
END $$;
REVOKE EXECUTE ON FUNCTION public.join_classroom(text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.join_classroom(text) TO authenticated;