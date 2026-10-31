CREATE OR REPLACE FUNCTION public.classroom_students(_classroom uuid)
RETURNS TABLE(student_id uuid, full_name text, joined_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not_signed_in'; END IF;
  IF NOT public.is_teacher_of(_classroom, auth.uid()) THEN RAISE EXCEPTION 'not_teacher'; END IF;
  RETURN QUERY
    SELECT cm.student_id, p.full_name, cm.joined_at
    FROM public.classroom_members cm
    LEFT JOIN public.profiles p ON p.id = cm.student_id
    WHERE cm.classroom_id = _classroom
    ORDER BY cm.joined_at;
END $function$;

GRANT EXECUTE ON FUNCTION public.classroom_students(uuid) TO authenticated;