CREATE TABLE public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL DEFAULT 'Chemistry',
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.quizzes TO authenticated;
GRANT ALL ON public.quizzes TO service_role;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in users read quizzes" ON public.quizzes FOR SELECT TO authenticated USING (true);

CREATE TABLE public.quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  idx INT NOT NULL,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_index INT NOT NULL,
  explanation TEXT NOT NULL DEFAULT '',
  UNIQUE (quiz_id, idx)
);
GRANT SELECT ON public.quiz_questions TO authenticated;
GRANT ALL ON public.quiz_questions TO service_role;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in users read quiz questions" ON public.quiz_questions FOR SELECT TO authenticated USING (true);

CREATE TABLE public.quiz_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  score INT NOT NULL,
  total INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.quiz_results TO authenticated;
GRANT ALL ON public.quiz_results TO service_role;
ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students save their own results" ON public.quiz_results FOR INSERT TO authenticated WITH CHECK (student_id = auth.uid() AND public.has_role(auth.uid(), 'student'));
CREATE POLICY "Students read own results, teachers read their classroom students" ON public.quiz_results FOR SELECT TO authenticated USING (
  student_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.classroom_members cm
    JOIN public.classrooms c ON c.id = cm.classroom_id
    WHERE cm.student_id = quiz_results.student_id AND c.teacher_id = auth.uid()
  )
);

CREATE TABLE public.topic_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  topic_slug TEXT NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, topic_slug)
);
GRANT SELECT, INSERT ON public.topic_progress TO authenticated;
GRANT ALL ON public.topic_progress TO service_role;
ALTER TABLE public.topic_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students read own topic progress" ON public.topic_progress FOR SELECT TO authenticated USING (student_id = auth.uid());
CREATE POLICY "Students save own topic progress" ON public.topic_progress FOR INSERT TO authenticated WITH CHECK (student_id = auth.uid() AND public.has_role(auth.uid(), 'student'));

CREATE TABLE public.quiz_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (classroom_id, quiz_id)
);
GRANT SELECT, INSERT, DELETE ON public.quiz_assignments TO authenticated;
GRANT ALL ON public.quiz_assignments TO service_role;
ALTER TABLE public.quiz_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers and member students read assignments" ON public.quiz_assignments FOR SELECT TO authenticated USING (public.is_teacher_of(classroom_id, auth.uid()) OR public.is_member_of(classroom_id, auth.uid()));
CREATE POLICY "Teachers assign quizzes to own classrooms" ON public.quiz_assignments FOR INSERT TO authenticated WITH CHECK (public.is_teacher_of(classroom_id, auth.uid()));
CREATE POLICY "Teachers remove assignments from own classrooms" ON public.quiz_assignments FOR DELETE TO authenticated USING (public.is_teacher_of(classroom_id, auth.uid()));

INSERT INTO public.quizzes (id, subject, title, description) VALUES
  ('00000000-0000-4000-8000-000000000001', 'Chemistry', 'Chemistry Basics', 'Atoms, symbols and everyday compounds — the building blocks of chemistry.'),
  ('00000000-0000-4000-8000-000000000002', 'Chemistry', 'Matter & Molecules', 'States of matter and how atoms join together into molecules.'),
  ('00000000-0000-4000-8000-000000000003', 'Biology', 'Life Science Starter', 'Cells, photosynthesis and the basics of living things.');

INSERT INTO public.quiz_questions (quiz_id, idx, question, options, correct_index, explanation) VALUES
  ('00000000-0000-4000-8000-000000000001', 1, 'What is the chemical formula for water?', '["CO₂", "H₂O", "O₂", "NaCl"]', 1, 'A water molecule is made of two hydrogen atoms bonded to one oxygen atom: H₂O.'),
  ('00000000-0000-4000-8000-000000000001', 2, 'Which gas do plants absorb from the air for photosynthesis?', '["Oxygen", "Carbon dioxide", "Nitrogen", "Hydrogen"]', 1, 'Plants take in carbon dioxide (CO₂) and water to make glucose, releasing oxygen.'),
  ('00000000-0000-4000-8000-000000000001', 3, 'What is the chemical formula of common table salt?', '["NaCl", "KCl", "CaCO₃", "HCl"]', 0, 'Table salt is sodium chloride: one sodium atom (Na) and one chlorine atom (Cl).'),
  ('00000000-0000-4000-8000-000000000001', 4, 'Atoms are made of protons, neutrons and…?', '["electrons", "photons", "molecules", "cells"]', 0, 'Every atom has a nucleus of protons and neutrons, with electrons moving around it.'),
  ('00000000-0000-4000-8000-000000000001', 5, 'Which of these is a compound?', '["Oxygen (O₂)", "Water (H₂O)", "Helium (He)", "Nitrogen (N₂)"]', 1, 'A compound contains two or more different elements chemically joined. Water has hydrogen and oxygen; O₂, He and N₂ are single elements.'),
  ('00000000-0000-4000-8000-000000000002', 1, 'Which state of matter has a fixed shape and a fixed volume?', '["Solid", "Liquid", "Gas", "Plasma"]', 0, 'In a solid, particles are packed tightly in fixed positions, so it keeps its own shape and volume.'),
  ('00000000-0000-4000-8000-000000000002', 2, 'A carbon dioxide molecule (CO₂) is made of…', '["1 carbon atom and 2 oxygen atoms", "2 carbon atoms and 1 oxygen atom", "1 calcium atom and 2 oxygen atoms", "1 carbon atom and 1 oxygen atom"]', 0, 'The formula CO₂ means one carbon atom bonded to two oxygen atoms.'),
  ('00000000-0000-4000-8000-000000000002', 3, 'What happens to water at 100°C at sea level?', '["It freezes", "It boils", "It condenses", "Nothing changes"]', 1, 'At 100°C (at sea-level pressure) water reaches its boiling point and turns into steam.'),
  ('00000000-0000-4000-8000-000000000002', 4, 'A molecule is…', '["two or more atoms bonded together", "a single proton", "a type of cell", "a kind of energy"]', 0, 'When two or more atoms join with chemical bonds, they form a molecule — like O₂ or H₂O.'),
  ('00000000-0000-4000-8000-000000000002', 5, 'Which formula belongs to glucose, the sugar plants make?', '["C₆H₁₂O₆", "CH₄", "NH₃", "H₂O₂"]', 0, 'Glucose is C₆H₁₂O₆: six carbon, twelve hydrogen and six oxygen atoms.'),
  ('00000000-0000-4000-8000-000000000003', 1, 'Which part of a cell contains its genetic material (DNA)?', '["Nucleus", "Cell wall", "Cytoplasm", "Membrane"]', 0, 'The nucleus is the control centre of the cell and stores its DNA.'),
  ('00000000-0000-4000-8000-000000000003', 2, 'Photosynthesis happens mainly in which part of a plant cell?', '["Chloroplasts", "Mitochondria", "Nucleus", "Vacuole"]', 0, 'Chloroplasts contain chlorophyll, the green pigment that captures sunlight for photosynthesis.'),
  ('00000000-0000-4000-8000-000000000003', 3, 'Which gas do plants release during photosynthesis?', '["Oxygen", "Carbon dioxide", "Nitrogen", "Methane"]', 0, 'Photosynthesis converts CO₂ and water into glucose and releases oxygen as a by-product.'),
  ('00000000-0000-4000-8000-000000000003', 4, 'What does the human heart pump around the body?', '["Blood", "Air", "Water only", "Food"]', 0, 'The heart is a muscular pump that moves blood, carrying oxygen and nutrients to every cell.');