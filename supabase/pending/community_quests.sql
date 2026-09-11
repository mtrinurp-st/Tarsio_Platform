-- STAGED SQL: promote with `supabase migration new community_quests` once
-- the project's CLI is available. Tested locally; not applied to a live project.
-- No core tables are replaced. Content JSON contains no participant answers.
CREATE TABLE public.user_created_quests (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 creator_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 content jsonb NOT NULL,
 revision integer NOT NULL DEFAULT 1,
 status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','pending_review','published','rejected','changes_requested','withdrawn','suspended')),
 reviewed_revision integer,
 reason text NOT NULL DEFAULT '',
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX user_created_quests_creator ON public.user_created_quests(creator_id,updated_at DESC);
CREATE INDEX user_created_quests_queue ON public.user_created_quests(status,updated_at);
CREATE TABLE public.quest_moderation_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), quest_id uuid NOT NULL REFERENCES public.user_created_quests(id) ON DELETE CASCADE,
 revision integer NOT NULL, actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
 action text NOT NULL, reason text NOT NULL, snapshot jsonb NOT NULL, checklist jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX quest_moderation_events_quest ON public.quest_moderation_events(quest_id,created_at);
CREATE TABLE public.quest_content_reports (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), quest_id uuid NOT NULL REFERENCES public.user_created_quests(id) ON DELETE CASCADE,
 revision integer NOT NULL, reporter_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 reason text NOT NULL CHECK (reason IN ('misinformation','privacy','harassment','unsafe_advice','other')),
 note text NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(quest_id,revision,reporter_id)
);
CREATE INDEX quest_content_reports_reporter ON public.quest_content_reports(reporter_id);
CREATE TABLE public.user_quest_responses (
 owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 quest_id uuid NOT NULL REFERENCES public.user_created_quests(id) ON DELETE CASCADE,
 revision integer NOT NULL, answers jsonb NOT NULL, completed_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(owner_id,quest_id,revision)
);
CREATE INDEX user_quest_responses_quest ON public.user_quest_responses(quest_id);
ALTER TABLE public.user_created_quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quest_moderation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quest_content_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_quest_responses ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.user_created_quests,public.quest_moderation_events,public.quest_content_reports,public.user_quest_responses FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.user_created_quests,public.user_quest_responses TO authenticated;
CREATE POLICY ugc_owner_read ON public.user_created_quests FOR SELECT TO authenticated USING(creator_id=(select auth.uid()));
CREATE POLICY ugc_answers_owner ON public.user_quest_responses FOR SELECT TO authenticated USING(owner_id=(select auth.uid()));

CREATE FUNCTION public.ugc_validate(c jsonb) RETURNS void LANGUAGE plpgsql SET search_path=public AS $$
DECLARE q jsonb; o jsonb;
BEGIN
 IF c IS NULL OR jsonb_typeof(c) IS DISTINCT FROM 'object' OR octet_length(c::text)>40000 THEN RAISE EXCEPTION 'INVALID_CONTENT'; END IF;
 IF jsonb_typeof(c->'title') IS DISTINCT FROM 'string' OR jsonb_typeof(c->'description') IS DISTINCT FROM 'string' OR jsonb_typeof(c->'sources') IS DISTINCT FROM 'string' THEN RAISE EXCEPTION 'INVALID_CONTENT'; END IF;
 IF coalesce(length(trim(c->>'title')),0) NOT BETWEEN 5 AND 100 OR coalesce(length(trim(c->>'description')),0) NOT BETWEEN 20 AND 800 OR coalesce(c->>'language','') NOT IN ('id','en') OR coalesce(c->>'category','') NOT IN ('reflection','habits','communication','wellbeing') OR coalesce((c->>'minutes')::int,0) NOT BETWEEN 3 AND 15 OR length(coalesce(c->>'sources',''))>2000 THEN RAISE EXCEPTION 'INVALID_CONTENT'; END IF;
 IF jsonb_typeof(c->'questions') IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'INVALID_QUESTIONS'; END IF;
 IF jsonb_array_length(c->'questions') NOT BETWEEN 1 AND 10 THEN RAISE EXCEPTION 'INVALID_QUESTIONS'; END IF;
 FOR q IN SELECT value FROM jsonb_array_elements(c->'questions') LOOP
  IF jsonb_typeof(q->'prompt') IS DISTINCT FROM 'string' THEN RAISE EXCEPTION 'INVALID_QUESTION'; END IF;
  IF coalesce(length(trim(q->>'prompt')),0) NOT BETWEEN 5 AND 300 OR coalesce(q->>'type','') NOT IN ('single_choice','multi_choice','scale','text') THEN RAISE EXCEPTION 'INVALID_QUESTION'; END IF;
  IF q->>'type' IN ('single_choice','multi_choice') THEN
   IF jsonb_typeof(q->'options') IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'INVALID_OPTIONS'; END IF;
   IF jsonb_array_length(q->'options') NOT BETWEEN 2 AND 6 OR (SELECT count(DISTINCT trim(value)) FROM jsonb_array_elements_text(q->'options'))<>jsonb_array_length(q->'options') THEN RAISE EXCEPTION 'INVALID_OPTIONS'; END IF;
   FOR o IN SELECT value FROM jsonb_array_elements(q->'options') LOOP
    IF jsonb_typeof(o)<>'string' OR length(trim(o#>>'{}')) NOT BETWEEN 1 AND 100 THEN RAISE EXCEPTION 'INVALID_OPTIONS'; END IF;
   END LOOP;
  END IF;
 END LOOP;
END $$;
REVOKE ALL ON FUNCTION public.ugc_validate(jsonb) FROM PUBLIC,anon,authenticated;

CREATE FUNCTION public.ugc_list(p_mode text DEFAULT 'published') RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE u uuid:=auth.uid(); result jsonb;
BEGIN
 IF u IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED'; END IF;
 IF p_mode NOT IN ('published','mine','review') THEN RAISE EXCEPTION 'INVALID_MODE'; END IF;
 IF p_mode='review' AND NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=u AND role='admin') THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
 SELECT coalesce(jsonb_agg(item ORDER BY changed DESC),'[]') INTO result FROM (
 SELECT q.updated_at changed, jsonb_build_object('id',q.id,'revision',q.revision,'status',q.status,'content',q.content,
 'reason',CASE WHEN p_mode='published' THEN '' ELSE q.reason END,
 'own',q.creator_id=u,
 'reports',CASE WHEN p_mode='review' THEN coalesce((SELECT jsonb_agg(jsonb_build_object('reason',r.reason,'note',r.note,'revision',r.revision)) FROM public.quest_content_reports r WHERE r.quest_id=q.id),'[]') ELSE '[]'::jsonb END) item
 FROM public.user_created_quests q WHERE
 (p_mode='published' AND q.status='published' AND q.reviewed_revision=q.revision) OR
 (p_mode='mine' AND q.creator_id=u) OR
 (p_mode='review' AND q.status IN ('pending_review','published','suspended'))
 ORDER BY q.updated_at DESC LIMIT 100
 ) records;
 RETURN result;
END $$;

CREATE FUNCTION public.ugc_mutate(p_action text,p_data jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE u uuid:=auth.uid(); q public.user_created_quests; new_id uuid; c jsonb; k text; question jsonb; answer jsonb; idx integer:=0;
BEGIN
 IF u IS NULL OR p_data->>'expectedUserId' IS DISTINCT FROM u::text THEN RAISE EXCEPTION 'ACCOUNT_CHANGED'; END IF;
 IF octet_length(p_data::text)>65000 THEN RAISE EXCEPTION 'PAYLOAD_TOO_LARGE'; END IF;
 -- Serialize per-actor creation/rate-limit checks without granting profile writes.
 PERFORM 1 FROM public.profiles WHERE id=u FOR UPDATE;
 IF p_action='save' AND NOT (p_data?'id') THEN
  IF (SELECT count(*) FROM public.user_created_quests WHERE creator_id=u AND created_at>now()-interval '1 day')>=10 THEN RAISE EXCEPTION 'RATE_LIMIT'; END IF;
  c:=p_data->'content';
  IF c IS NULL OR jsonb_typeof(c)<>'object' OR octet_length(c::text)>40000 THEN RAISE EXCEPTION 'INVALID_CONTENT'; END IF;
  INSERT INTO public.user_created_quests(creator_id,content) VALUES(u,c) RETURNING id INTO new_id;
  RETURN jsonb_build_object('id',new_id,'revision',1);
 END IF;
 SELECT * INTO q FROM public.user_created_quests WHERE id=(p_data->>'id')::uuid FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
 IF q.revision IS DISTINCT FROM (p_data->>'revision')::int THEN RAISE EXCEPTION 'REVISION_CONFLICT'; END IF;
 IF p_action IN ('save','submit','withdraw') THEN
  IF q.creator_id<>u THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  IF p_action='save' THEN
   IF q.status NOT IN ('draft','rejected','changes_requested','withdrawn') THEN RAISE EXCEPTION 'WITHDRAW_BEFORE_EDIT'; END IF;
   c:=p_data->'content';
   IF c IS NULL OR jsonb_typeof(c)<>'object' OR octet_length(c::text)>40000 THEN RAISE EXCEPTION 'INVALID_CONTENT'; END IF;
   UPDATE public.user_created_quests SET content=c,revision=revision+1,status='draft',reviewed_revision=NULL,reason='',updated_at=now() WHERE id=q.id;
  ELSIF p_action='submit' THEN
   IF q.status NOT IN ('draft','rejected','changes_requested','withdrawn') THEN RAISE EXCEPTION 'INVALID_TRANSITION'; END IF;
   IF p_data->'consent' IS DISTINCT FROM 'true'::jsonb THEN RAISE EXCEPTION 'CONSENT_REQUIRED'; END IF;
   PERFORM public.ugc_validate(q.content);
   IF coalesce((q.content->>'premium')::boolean,false) THEN RAISE EXCEPTION 'PREMIUM_CREATION_NOT_ENABLED'; END IF;
   UPDATE public.user_created_quests SET status='pending_review',updated_at=now() WHERE id=q.id;
  ELSE
   UPDATE public.user_created_quests SET status='withdrawn',updated_at=now() WHERE id=q.id;
  END IF;
 ELSIF p_action IN ('published','rejected','changes_requested','suspended') THEN
  IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=u AND role='admin') THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  IF q.creator_id=u THEN RAISE EXCEPTION 'SELF_REVIEW_FORBIDDEN'; END IF;
  IF (p_action='suspended' AND q.status<>'published') OR (p_action<>'suspended' AND q.status<>'pending_review') THEN RAISE EXCEPTION 'INVALID_TRANSITION'; END IF;
  IF coalesce(length(trim(p_data->>'reason')),0) NOT BETWEEN 10 AND 1000 THEN RAISE EXCEPTION 'REASON_REQUIRED'; END IF;
  IF p_action='published' THEN
   PERFORM public.ugc_validate(q.content);
   IF coalesce((q.content->>'premium')::boolean,false) THEN RAISE EXCEPTION 'PREMIUM_CREATION_NOT_ENABLED'; END IF;
   FOREACH k IN ARRAY ARRAY['objective','claims','privacy','respect','clarity','rights'] LOOP
    IF p_data#>ARRAY['checklist',k] IS DISTINCT FROM 'true'::jsonb THEN RAISE EXCEPTION 'CHECKLIST_REQUIRED'; END IF;
   END LOOP;
  END IF;
  UPDATE public.user_created_quests SET status=p_action,reason=p_data->>'reason',reviewed_revision=CASE WHEN p_action='published' THEN revision ELSE reviewed_revision END,updated_at=now() WHERE id=q.id;
 ELSIF p_action='report' THEN
  IF q.status<>'published' OR coalesce(length(p_data->>'note'),0)>1000 THEN RAISE EXCEPTION 'INVALID_REPORT'; END IF;
  INSERT INTO public.quest_content_reports(quest_id,revision,reporter_id,reason,note) VALUES(q.id,q.revision,u,p_data->>'reason',coalesce(p_data->>'note','')) ON CONFLICT DO NOTHING;
  RETURN jsonb_build_object('saved',true);
 ELSIF p_action='respond' THEN
  IF q.status<>'published' OR q.reviewed_revision IS DISTINCT FROM q.revision THEN RAISE EXCEPTION 'QUEST_UNAVAILABLE'; END IF;
  c:=p_data->'answers';
  IF jsonb_typeof(c) IS DISTINCT FROM 'object' OR octet_length(c::text)>55000 THEN RAISE EXCEPTION 'INVALID_ANSWERS'; END IF;
  FOR question IN SELECT value FROM jsonb_array_elements(q.content->'questions') LOOP
   answer:=c->idx::text;
   IF question->>'type'='text' AND (jsonb_typeof(answer) IS DISTINCT FROM 'string' OR coalesce(length(trim(answer#>>'{}')),0) NOT BETWEEN 1 AND 5000) THEN RAISE EXCEPTION 'INVALID_ANSWERS'; END IF;
   IF question->>'type'='scale' AND (jsonb_typeof(answer) IS DISTINCT FROM 'number' OR (answer#>>'{}')::numeric NOT BETWEEN 1 AND 5 OR (answer#>>'{}')::numeric<>trunc((answer#>>'{}')::numeric)) THEN RAISE EXCEPTION 'INVALID_ANSWERS'; END IF;
   IF question->>'type'='single_choice' AND (jsonb_typeof(answer) IS DISTINCT FROM 'string' OR NOT coalesce(question->'options' @> jsonb_build_array(answer),false)) THEN RAISE EXCEPTION 'INVALID_ANSWERS'; END IF;
   IF question->>'type'='multi_choice' THEN
    IF jsonb_typeof(answer) IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'INVALID_ANSWERS'; END IF;
    IF jsonb_array_length(answer)<1 OR NOT (question->'options' @> answer) OR (SELECT count(DISTINCT v) FROM jsonb_array_elements(answer) v)<>jsonb_array_length(answer) THEN RAISE EXCEPTION 'INVALID_ANSWERS'; END IF;
   END IF;
   idx:=idx+1;
  END LOOP;
  INSERT INTO public.user_quest_responses(owner_id,quest_id,revision,answers) VALUES(u,q.id,q.revision,c) ON CONFLICT(owner_id,quest_id,revision) DO UPDATE SET answers=excluded.answers,completed_at=now();
  RETURN jsonb_build_object('saved',true,'reward',0);
 ELSE RAISE EXCEPTION 'INVALID_ACTION';
 END IF;
 INSERT INTO public.quest_moderation_events(quest_id,revision,actor_id,action,reason,snapshot,checklist) VALUES(q.id,q.revision,u,p_action,left(coalesce(p_data->>'reason',''),1000),q.content,coalesce(p_data->'checklist','{}'));
 RETURN (SELECT jsonb_build_object('id',id,'revision',revision,'status',status) FROM public.user_created_quests WHERE id=q.id);
END $$;
REVOKE ALL ON FUNCTION public.ugc_list(text),public.ugc_mutate(text,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.ugc_list(text),public.ugc_mutate(text,jsonb) TO authenticated;
