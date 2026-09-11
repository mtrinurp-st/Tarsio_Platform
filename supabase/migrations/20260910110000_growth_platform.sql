-- Tarsio Growth v2. Additive migration; legacy quest/journal rows are retained.
-- Reward/account mutations are transactional RPCs. Journals have owner-only RLS.
-- Operational DB owners/service-role can access plaintext JSON: this is NOT E2EE.

REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (display_name, avatar_url, language_pref) ON public.profiles TO authenticated;

CREATE TABLE public.growth_accounts (
 user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
 state jsonb NOT NULL DEFAULT '{}'::jsonb,
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.growth_content (
 id text PRIMARY KEY,
 unit_id integer NOT NULL CHECK(unit_id BETWEEN 1 AND 7),
 schema_json jsonb NOT NULL CHECK(jsonb_typeof(schema_json)='object'),
 published boolean NOT NULL DEFAULT false,
 sort_order integer NOT NULL DEFAULT 0,
 revision integer NOT NULL DEFAULT 1,
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.growth_progress (
 user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 lesson_id text NOT NULL REFERENCES public.growth_content(id),
 payload jsonb NOT NULL,
 completed_at timestamptz,
 initial_session text NOT NULL,
 resumed boolean NOT NULL DEFAULT false,
 updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(user_id,lesson_id)
);
CREATE TABLE public.growth_xp_ledger (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 event_key text NOT NULL,
 xp integer NOT NULL CHECK(xp>=0),
 gems integer NOT NULL DEFAULT 0 CHECK(gems>=0),
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(user_id,event_key)
);
CREATE TABLE public.growth_content_revisions (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 lesson_id text NOT NULL REFERENCES public.growth_content(id),
 revision integer NOT NULL,
 schema_json jsonb NOT NULL,
 editor_id uuid NOT NULL REFERENCES public.profiles(id),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.growth_squads (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 name text NOT NULL CHECK(length(name) BETWEEN 3 AND 40),
 code text UNIQUE NOT NULL DEFAULT upper(substr(replace(gen_random_uuid()::text,'-',''),1,10)),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.growth_squad_members (
 user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
 squad_id uuid NOT NULL REFERENCES public.growth_squads(id) ON DELETE CASCADE,
 joined_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.growth_kudos (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 recipient_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 squad_id uuid NOT NULL REFERENCES public.growth_squads(id) ON DELETE CASCADE,
 created_at timestamptz NOT NULL DEFAULT now(),
 CHECK(sender_id<>recipient_id)
);
CREATE TABLE public.growth_squad_posts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 squad_id uuid NOT NULL REFERENCES public.growth_squads(id) ON DELETE CASCADE,
 body text NOT NULL CHECK(length(body) BETWEEN 1 AND 1000),
 week date NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(user_id,squad_id,week)
);
CREATE TABLE public.growth_league_members (
 user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 week date NOT NULL,
 tier integer NOT NULL DEFAULT 1 CHECK(tier BETWEEN 1 AND 5),
 cohort integer NOT NULL,
 PRIMARY KEY(user_id,week)
);
CREATE INDEX growth_ledger_user_time ON public.growth_xp_ledger(user_id,created_at);
CREATE INDEX growth_members_squad ON public.growth_squad_members(squad_id);
CREATE INDEX growth_league_cohort ON public.growth_league_members(week,tier,cohort);

ALTER TABLE public.growth_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.growth_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.growth_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.growth_xp_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.growth_content_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.growth_squads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.growth_squad_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.growth_kudos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.growth_squad_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.growth_league_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY growth_own_account ON public.growth_accounts FOR SELECT TO authenticated USING(auth.uid()=user_id);
CREATE POLICY growth_own_progress ON public.growth_progress FOR SELECT TO authenticated USING(auth.uid()=user_id);
CREATE POLICY growth_own_ledger ON public.growth_xp_ledger FOR SELECT TO authenticated USING(auth.uid()=user_id);
CREATE POLICY growth_read_content ON public.growth_content FOR SELECT TO anon,authenticated USING(published OR EXISTS(SELECT 1 FROM public.profiles WHERE id=auth.uid() AND role='admin'));
-- No client INSERT/UPDATE/DELETE grants, including for admins; use validated RPCs.
REVOKE ALL ON public.growth_accounts,public.growth_progress,public.growth_xp_ledger,public.growth_content,public.growth_content_revisions,public.growth_squads,public.growth_squad_members,public.growth_kudos,public.growth_squad_posts,public.growth_league_members FROM anon,authenticated;
GRANT SELECT ON public.growth_accounts,public.growth_progress,public.growth_xp_ledger TO authenticated;
GRANT SELECT ON public.growth_content TO anon,authenticated;

CREATE FUNCTION public.growth_load() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE u uuid:=auth.uid(); s jsonb; p jsonb; profile public.profiles;
BEGIN
 IF u IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
 SELECT * INTO profile FROM public.profiles WHERE id=u;
 INSERT INTO public.growth_accounts(user_id,state) VALUES(u,jsonb_build_object('name',coalesce(profile.display_name,'Penjelajah'),'onboarded',false,'goal',5,'startUnit',1,'freeRoam',false,'dark',false,'publicProfile',false,'xp',coalesce(profile.xp_total,0),'gems',0,'freezes',0,'streak',0,'longest',0,'lastDay','','events','{}'::jsonb,'moods','{}'::jsonb,'actions','{}'::jsonb,'cosmetic','original','notifications',true)) ON CONFLICT DO NOTHING;
 SELECT state INTO s FROM public.growth_accounts WHERE user_id=u;
 SELECT coalesce(jsonb_object_agg(lesson_id,payload || CASE WHEN completed_at IS NOT NULL THEN jsonb_build_object('completedAt',completed_at) ELSE '{}'::jsonb END),'{}'::jsonb) INTO p FROM public.growth_progress WHERE user_id=u;
 RETURN s||jsonb_build_object('progress',p);
END $$;

CREATE FUNCTION public.growth_settings(p_settings jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE u uuid:=auth.uid(); s jsonb; k text;
BEGIN
 PERFORM public.growth_load();
 SELECT state INTO s FROM public.growth_accounts WHERE user_id=u FOR UPDATE;
 IF octet_length(p_settings::text)>20000 THEN RAISE EXCEPTION 'Settings too large'; END IF;
 FOR k IN SELECT jsonb_object_keys(p_settings) LOOP
  IF k NOT IN ('name','goal','startUnit','onboarded','freeRoam','dark','publicProfile','notifications','actions') THEN RAISE EXCEPTION 'Field not editable'; END IF;
 END LOOP;
 IF p_settings?'name' AND (jsonb_typeof(p_settings->'name')<>'string' OR length(trim(p_settings->>'name')) NOT BETWEEN 2 AND 40) THEN RAISE EXCEPTION 'Invalid name'; END IF;
 IF p_settings?'goal' AND (p_settings->>'goal')::int NOT IN (5,10,15) THEN RAISE EXCEPTION 'Invalid daily goal'; END IF;
 IF p_settings?'startUnit' AND (p_settings->>'startUnit')::int NOT BETWEEN 1 AND 7 THEN RAISE EXCEPTION 'Invalid start unit'; END IF;
 FOR k IN SELECT unnest(ARRAY['onboarded','freeRoam','dark','publicProfile','notifications']) LOOP
  IF p_settings?k AND jsonb_typeof(p_settings->k)<>'boolean' THEN RAISE EXCEPTION 'Invalid boolean'; END IF;
 END LOOP;
 -- Onboarding cannot forge activity records or quest eligibility.
 IF p_settings?'actions' THEN
  s:=jsonb_set(s,'{actions}',coalesce(s->'actions','{}')||jsonb_build_object('reason',left(coalesce(p_settings#>>'{actions,reason}',''),1000),'onboardingMood',left(coalesce(p_settings#>>'{actions,onboardingMood}',''),100)));
 END IF;
 s:=s||(p_settings-'actions');
 UPDATE public.growth_accounts SET state=s,updated_at=now() WHERE user_id=u;
 IF p_settings?'name' THEN UPDATE public.profiles SET display_name=p_settings->>'name' WHERE id=u; END IF;
 RETURN public.growth_load();
END $$;

CREATE FUNCTION public.growth_lesson_allowed(p_lesson_id text,p_state jsonb) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE content public.growth_content; prior integer;
BEGIN
 SELECT * INTO content FROM public.growth_content WHERE id=p_lesson_id AND published;
 IF NOT FOUND THEN RETURN false; END IF;
 IF coalesce((p_state->>'freeRoam')::boolean,false) OR EXISTS(SELECT 1 FROM public.growth_progress WHERE user_id=auth.uid() AND lesson_id=p_lesson_id AND completed_at IS NOT NULL) THEN RETURN true; END IF;
 IF content.unit_id<>1 AND content.unit_id<>coalesce((p_state->>'startUnit')::int,1) AND EXISTS(SELECT 1 FROM public.growth_content c WHERE c.unit_id=content.unit_id-1 AND c.published AND NOT EXISTS(SELECT 1 FROM public.growth_progress p WHERE p.user_id=auth.uid() AND p.lesson_id=c.id AND p.completed_at IS NOT NULL)) THEN RETURN false; END IF;
 SELECT count(*) INTO prior FROM public.growth_content c WHERE c.unit_id=content.unit_id AND c.published AND c.sort_order<content.sort_order AND NOT EXISTS(SELECT 1 FROM public.growth_progress p WHERE p.user_id=auth.uid() AND p.lesson_id=c.id AND p.completed_at IS NOT NULL);
 RETURN prior=0;
END $$;

CREATE FUNCTION public.growth_save_progress(p_lesson_id text,p_progress jsonb) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE u uuid:=auth.uid(); s jsonb; schema jsonb; clean jsonb;
BEGIN
 PERFORM public.growth_load();
 SELECT state INTO s FROM public.growth_accounts WHERE user_id=u FOR UPDATE;
 IF NOT public.growth_lesson_allowed(p_lesson_id,s) THEN RAISE EXCEPTION 'Selesaikan langkah sebelumnya terlebih dahulu'; END IF;
 SELECT schema_json INTO schema FROM public.growth_content WHERE id=p_lesson_id;
 IF jsonb_typeof(p_progress->'answers')<>'object' OR octet_length(p_progress::text)>150000 OR length(coalesce(p_progress->>'sessionId','')) NOT BETWEEN 1 AND 100 THEN RAISE EXCEPTION 'Invalid draft'; END IF;
 IF coalesce((p_progress->>'step')::int,-1)<0 OR (p_progress->>'step')::int>=jsonb_array_length(schema->'steps') THEN RAISE EXCEPTION 'Invalid step'; END IF;
 clean:=jsonb_build_object('answers',p_progress->'answers','step',(p_progress->>'step')::int,'sessionId',p_progress->>'sessionId','startedAt',now(),'updatedAt',now());
 INSERT INTO public.growth_progress(user_id,lesson_id,payload,initial_session) VALUES(u,p_lesson_id,clean,p_progress->>'sessionId') ON CONFLICT(user_id,lesson_id) DO UPDATE SET payload=clean||jsonb_build_object('startedAt',growth_progress.payload->'startedAt'),resumed=growth_progress.resumed OR growth_progress.initial_session<>p_progress->>'sessionId',updated_at=now();
END $$;

CREATE FUNCTION public.growth_validate_answers(p_schema jsonb,p_answers jsonb) RETURNS void LANGUAGE plpgsql SET search_path=public AS $$
DECLARE st jsonb; f jsonb; v jsonb; item jsonb; kind text; filled integer;
BEGIN
 FOR st IN SELECT value FROM jsonb_array_elements(p_schema->'steps') LOOP
  FOR f IN SELECT value FROM jsonb_array_elements(st->'fields') LOOP
   v:=p_answers->(f->>'id');kind:=f->>'kind';
   IF coalesce((f->>'required')::boolean,false) AND (v IS NULL OR v='null'::jsonb OR v='""'::jsonb OR v='[]'::jsonb OR (jsonb_typeof(v)='string' AND length(trim(v#>>'{}'))=0) OR (kind='check' AND v<>'true'::jsonb)) THEN RAISE EXCEPTION 'Lengkapi %',f->>'label'; END IF;
   IF v IS NULL OR v='""'::jsonb THEN CONTINUE; END IF;
   IF kind IN ('number','range') THEN
    IF jsonb_typeof(v)<>'number' THEN RAISE EXCEPTION 'Invalid numeric answer'; END IF;
    IF (f?'min' AND (v#>>'{}')::numeric<(f->>'min')::numeric) OR (f?'max' AND (v#>>'{}')::numeric>(f->>'max')::numeric) THEN RAISE EXCEPTION 'Answer outside limits'; END IF;
   ELSIF kind='multi' THEN
    IF jsonb_typeof(v)<>'array' THEN RAISE EXCEPTION 'Invalid multiple choice'; END IF;
    FOR item IN SELECT value FROM jsonb_array_elements(v) LOOP IF NOT (f->'options')@>jsonb_build_array(item) THEN RAISE EXCEPTION 'Invalid option'; END IF; END LOOP;
   ELSIF kind='choice' THEN
    IF NOT (f->'options')@>jsonb_build_array(v) THEN RAISE EXCEPTION 'Invalid option'; END IF;
   ELSIF kind='check' THEN
    IF jsonb_typeof(v)<>'boolean' THEN RAISE EXCEPTION 'Invalid checkbox'; END IF;
   ELSE
    IF jsonb_typeof(v)<>'string' OR length(v#>>'{}')>5000 THEN RAISE EXCEPTION 'Invalid text answer'; END IF;
    IF kind='date' THEN PERFORM (v#>>'{}')::date; END IF;
   END IF;
  END LOOP;
  IF st->>'widget'='budget' AND coalesce((p_answers->>'needs')::numeric,0)+coalesce((p_answers->>'wants')::numeric,0)+coalesce((p_answers->>'saving')::numeric,0)<>100 THEN RAISE EXCEPTION 'Total anggaran harus 100%%'; END IF;
 END LOOP;
 IF p_schema->>'id'='2-2' THEN SELECT count(*) INTO filled FROM jsonb_each_text(p_answers) WHERE key~'^action[0-5]$' AND length(trim(value))>0; IF filled<2 THEN RAISE EXCEPTION 'Isi minimal dua aksi'; END IF; END IF;
 IF p_schema->>'id'='7-2' THEN FOR filled IN 0..2 LOOP IF (length(trim(coalesce(p_answers->>('after'||filled),'')))>0)<>(length(trim(coalesce(p_answers->>('habit'||filled),'')))>0) THEN RAISE EXCEPTION 'Lengkapi pasangan kebiasaan'; END IF; END LOOP; END IF;
END $$;

CREATE FUNCTION public.growth_action(p_action jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE u uuid:=auth.uid(); s jsonb; d text:=(now() AT TIME ZONE 'Asia/Jakarta')::date::text; t text:=p_action->>'type'; xp integer:=0; gems integer:=0; ek text; lesson text; pr public.growth_progress; sc jsonb; st integer; freeze_count integer; diff integer; missed integer; last text; k text; inserted integer;
BEGIN
 PERFORM public.growth_load();SELECT state INTO s FROM public.growth_accounts WHERE user_id=u FOR UPDATE;
 IF octet_length(p_action::text)>20000 THEN RAISE EXCEPTION 'Action too large'; END IF;
 IF t='mood' THEN
  IF p_action->>'value' NOT IN ('Tenang','Bersemangat','Lelah','Banyak pikiran','Penuh harapan') THEN RAISE EXCEPTION 'Invalid mood'; END IF;
  s:=jsonb_set(s,ARRAY['moods',d],p_action->'value',true);
 ELSIF t='complete' THEN
  lesson:=p_action->>'lessonId';
  IF NOT public.growth_lesson_allowed(lesson,s) THEN RAISE EXCEPTION 'Quest belum terbuka'; END IF;
  SELECT * INTO pr FROM public.growth_progress WHERE user_id=u AND lesson_id=lesson FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Simpan draf dahulu'; END IF;
  IF pr.completed_at IS NOT NULL THEN RETURN public.growth_load(); END IF;
  SELECT schema_json INTO sc FROM public.growth_content WHERE id=lesson;
  PERFORM public.growth_validate_answers(sc,pr.payload->'answers');
  xp:=50+CASE WHEN NOT pr.resumed AND pr.initial_session=p_action->>'sessionId' THEN 10 ELSE 0 END;
  ek:='lesson:'||lesson||':'||d;
  UPDATE public.growth_progress SET completed_at=now() WHERE user_id=u AND lesson_id=lesson;
 ELSIF t='claim' THEN
  k:=p_action->>'questId';ek:='quest:'||k||':'||d;
  IF k='mood' AND s->'moods'?d THEN xp:=10;gems:=2;
  ELSIF k='lesson' AND EXISTS(SELECT 1 FROM public.growth_progress WHERE user_id=u AND (completed_at AT TIME ZONE 'Asia/Jakarta')::date=d::date) THEN xp:=15;gems:=3;
  ELSIF k='reflection' AND length(trim(coalesce(s#>>ARRAY['actions','reflection:'||d],'')))>0 THEN xp:=10;gems:=2;
  ELSE RAISE EXCEPTION 'Selesaikan misi terlebih dahulu'; END IF;
 ELSIF t='buy' THEN
  IF p_action->>'item'='freeze' THEN
   IF (s->>'freezes')::int>=2 THEN RAISE EXCEPTION 'Maksimal dua Streak Freeze'; END IF;
   IF (s->>'gems')::int<20 THEN RAISE EXCEPTION 'Gems belum cukup'; END IF;
   s:=s||jsonb_build_object('freezes',(s->>'freezes')::int+1,'gems',(s->>'gems')::int-20);
  ELSIF p_action->>'item'='explorer' THEN
   IF s->>'cosmetic'='explorer' THEN RAISE EXCEPTION 'Aksesori sudah dimiliki'; END IF;
   IF (s->>'gems')::int<35 THEN RAISE EXCEPTION 'Gems belum cukup'; END IF;
   s:=s||jsonb_build_object('cosmetic','explorer','gems',(s->>'gems')::int-35);
  ELSE RAISE EXCEPTION 'Invalid item'; END IF;
 ELSIF t='action' THEN
  k:=p_action->>'key';
  IF NOT (k~'^reflection:[0-9]{4}-[0-9]{2}-[0-9]{2}$' OR k~'^plan:[0-5]$' OR k~'^week:([1-9]|1[0-3])$' OR k~'^detox:[1-7]$' OR k='career') OR length(coalesce(p_action->>'value',''))>5000 THEN RAISE EXCEPTION 'Invalid activity'; END IF;
  IF k LIKE 'reflection:%' AND k<>'reflection:'||d THEN RAISE EXCEPTION 'Use current date'; END IF;
  s:=jsonb_set(s,ARRAY['actions',k],p_action->'value',true);
  IF k LIKE 'plan:%' AND p_action->>'value'='Perlu waktu' THEN s:=jsonb_set(s,ARRAY['actions','planDue:'||split_part(k,':',2)],to_jsonb(now()+interval '24 hours'),true);END IF;
 ELSE RAISE EXCEPTION 'Invalid action'; END IF;
 IF ek IS NOT NULL THEN
  INSERT INTO public.growth_xp_ledger(user_id,event_key,xp,gems) VALUES(u,ek,xp,gems) ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS inserted=ROW_COUNT;
  IF inserted=0 THEN RETURN public.growth_load(); END IF;
  s:=s||jsonb_build_object('xp',(s->>'xp')::int+xp,'gems',(s->>'gems')::int+gems);
  s:=jsonb_set(s,ARRAY['events',ek],to_jsonb(xp),true);
 END IF;
 -- Calendar days use Asia/Jakarta, not elapsed 24-hour windows. Buying is not activity.
 IF t<>'buy' AND coalesce(s->>'lastDay','')<>d THEN
  last:=s->>'lastDay';freeze_count:=(s->>'freezes')::int;st:=(s->>'streak')::int;
  IF last<>'' THEN diff:=d::date-last::date;missed:=greatest(0,diff-1);ELSE missed:=999;END IF;
  IF last<>'' AND missed<=freeze_count THEN freeze_count:=freeze_count-missed;st:=st+1;ELSE st:=1;END IF;
  s:=s||jsonb_build_object('freezes',freeze_count,'streak',st,'longest',greatest((s->>'longest')::int,st),'lastDay',d);
  IF st IN (3,7,30) THEN
   gems:=CASE st WHEN 30 THEN 50 WHEN 7 THEN 20 ELSE 10 END;
   INSERT INTO public.growth_xp_ledger(user_id,event_key,xp,gems) VALUES(u,'milestone:'||d,0,gems) ON CONFLICT DO NOTHING;
   GET DIAGNOSTICS inserted=ROW_COUNT;
   IF inserted=1 THEN s:=jsonb_set(s,'{gems}',to_jsonb((s->>'gems')::int+gems));s:=jsonb_set(s,ARRAY['events','milestone:'||d],'0'::jsonb,true);END IF;
  END IF;
 END IF;
 UPDATE public.growth_accounts SET state=s,updated_at=now() WHERE user_id=u;
 RETURN public.growth_load();
END $$;

CREATE FUNCTION public.growth_save_content(p_content jsonb) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE cid text:=p_content->>'id'; st jsonb; f jsonb; ids text[]:='{}'; ord integer;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=auth.uid() AND role='admin') THEN RAISE EXCEPTION 'Admin only'; END IF;
 IF octet_length(p_content::text)>150000 OR cid !~ '^[a-zA-Z0-9_-]{1,80}$' OR length(trim(p_content->>'title')) NOT BETWEEN 1 AND 150 OR length(trim(p_content->>'description')) NOT BETWEEN 1 AND 1000 OR (p_content->>'unit')::int NOT BETWEEN 1 AND 7 OR (p_content->>'minutes')::int NOT BETWEEN 1 AND 30 OR jsonb_typeof(p_content->'published')<>'boolean' OR jsonb_typeof(p_content->'steps')<>'array' OR jsonb_array_length(p_content->'steps') NOT BETWEEN 1 AND 30 THEN RAISE EXCEPTION 'Invalid content'; END IF;
 FOR st IN SELECT value FROM jsonb_array_elements(p_content->'steps') LOOP
  IF length(trim(st->>'title')) NOT BETWEEN 1 AND 200 OR jsonb_typeof(st->'fields')<>'array' OR jsonb_array_length(st->'fields') NOT BETWEEN 1 AND 50 THEN RAISE EXCEPTION 'Invalid step'; END IF;
  FOR f IN SELECT value FROM jsonb_array_elements(st->'fields') LOOP
   IF coalesce(f->>'id','')='' OR f->>'id'=ANY(ids) OR length(trim(f->>'label')) NOT BETWEEN 1 AND 500 OR f->>'kind' NOT IN ('textarea','text','number','range','choice','multi','check','date') THEN RAISE EXCEPTION 'Invalid field'; END IF;
   IF f->>'kind' IN ('choice','multi') AND (jsonb_typeof(f->'options')<>'array' OR jsonb_array_length(f->'options')=0) THEN RAISE EXCEPTION 'Options required'; END IF;
   IF f?'min' AND f?'max' AND (f->>'min')::numeric>(f->>'max')::numeric THEN RAISE EXCEPTION 'Invalid range'; END IF;
   ids:=array_append(ids,f->>'id');
  END LOOP;
 END LOOP;
 SELECT coalesce(max(sort_order),0)+1 INTO ord FROM public.growth_content;
 INSERT INTO public.growth_content(id,unit_id,schema_json,published,sort_order) VALUES(cid,(p_content->>'unit')::int,p_content,(p_content->>'published')::boolean,ord) ON CONFLICT(id) DO UPDATE SET unit_id=excluded.unit_id,schema_json=excluded.schema_json,published=excluded.published,revision=growth_content.revision+1,updated_at=now();
 INSERT INTO public.growth_content_revisions(lesson_id,revision,schema_json,editor_id) SELECT id,revision,schema_json,auth.uid() FROM public.growth_content WHERE id=cid;
END $$;

CREATE FUNCTION public.growth_assign_league() RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE u uuid:=auth.uid(); w date:=date_trunc('week',now() AT TIME ZONE 'Asia/Jakarta')::date; prior public.growth_league_members; t int:=1; c int; place int; total int;
BEGIN
 IF u IS NULL OR NOT EXISTS(SELECT 1 FROM public.growth_accounts WHERE user_id=u AND state->>'publicProfile'='true') THEN RETURN; END IF;
 PERFORM pg_advisory_xact_lock(hashtext('growth_league:'||w));
 IF EXISTS(SELECT 1 FROM public.growth_league_members WHERE user_id=u AND week=w) THEN RETURN; END IF;
 SELECT * INTO prior FROM public.growth_league_members WHERE user_id=u AND week=w-7;
 IF FOUND THEN
  t:=prior.tier;
  SELECT position,participants INTO place,total FROM (
   SELECT m.user_id,rank() OVER(ORDER BY coalesce(sum(x.xp),0) DESC) AS position,count(*) OVER() AS participants
   FROM public.growth_league_members m LEFT JOIN public.growth_xp_ledger x ON x.user_id=m.user_id AND (x.created_at AT TIME ZONE 'Asia/Jakarta')::date>=w-7 AND (x.created_at AT TIME ZONE 'Asia/Jakarta')::date<w
   WHERE m.week=w-7 AND m.tier=prior.tier AND m.cohort=prior.cohort GROUP BY m.user_id
  ) ranked WHERE user_id=u;
  -- Avoid meaningless promotion/relegation in unfilled cohorts.
  IF total>=15 THEN IF place<=5 THEN t:=least(5,t+1);ELSIF place>total-5 THEN t:=greatest(1,t-1);END IF;END IF;
 END IF;
 SELECT count(*)/30 INTO c FROM public.growth_league_members WHERE week=w AND tier=t;
 INSERT INTO public.growth_league_members(user_id,week,tier,cohort) VALUES(u,w,t,c);
END $$;

CREATE FUNCTION public.growth_social() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE u uuid:=auth.uid(); sid uuid; squad jsonb; members jsonb; posts jsonb; league jsonb; m public.growth_league_members; w date:=date_trunc('week',now() AT TIME ZONE 'Asia/Jakarta')::date;
BEGIN
 PERFORM public.growth_load();PERFORM public.growth_assign_league();
 SELECT squad_id INTO sid FROM public.growth_squad_members WHERE user_id=u;
 SELECT jsonb_build_object('name',name,'code',code) INTO squad FROM public.growth_squads WHERE id=sid;
 SELECT coalesce(jsonb_agg(jsonb_build_object('id',sm.user_id,'name',coalesce(a.state->>'name','Penjelajah'),'xp',coalesce((a.state->>'xp')::int,0),'kudos',(SELECT count(*) FROM public.growth_kudos k WHERE k.recipient_id=sm.user_id AND k.squad_id=sid)) ORDER BY sm.joined_at),'[]'::jsonb) INTO members FROM public.growth_squad_members sm LEFT JOIN public.growth_accounts a ON a.user_id=sm.user_id WHERE sm.squad_id=sid;
 SELECT coalesce(jsonb_agg(jsonb_build_object('id',p.id,'name',coalesce(a.state->>'name','Penjelajah'),'body',p.body) ORDER BY p.created_at DESC),'[]'::jsonb) INTO posts FROM public.growth_squad_posts p LEFT JOIN public.growth_accounts a ON a.user_id=p.user_id WHERE p.squad_id=sid AND p.week=w;
 SELECT * INTO m FROM public.growth_league_members WHERE user_id=u AND week=w;
 SELECT coalesce(jsonb_agg(jsonb_build_object('name',name,'xp',xp) ORDER BY xp DESC),'[]'::jsonb) INTO league FROM (
  SELECT coalesce(a.state->>'name','Penjelajah') AS name,coalesce(sum(x.xp),0) AS xp
  FROM public.growth_league_members lm JOIN public.growth_accounts a ON a.user_id=lm.user_id AND a.state->>'publicProfile'='true'
  LEFT JOIN public.growth_xp_ledger x ON x.user_id=lm.user_id AND (x.created_at AT TIME ZONE 'Asia/Jakarta')::date>=w
  WHERE lm.week=w AND lm.tier=m.tier AND lm.cohort=m.cohort GROUP BY lm.user_id,a.state
 ) scores;
 RETURN jsonb_build_object('squad',squad,'members',members,'posts',posts,'league',league,'tier',(ARRAY['Tunas','Kuncup','Mekar','Berbunga','Berbuah'])[coalesce(m.tier,1)]);
END $$;

CREATE FUNCTION public.growth_social_action(p_action text,p_payload jsonb DEFAULT '{}'::jsonb) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE u uuid:=auth.uid(); sid uuid; target uuid; w date:=date_trunc('week',now() AT TIME ZONE 'Asia/Jakarta')::date; n int;
BEGIN
 PERFORM public.growth_load();
 -- Serialize membership changes/kudos per user, and membership capacity per squad.
 PERFORM 1 FROM public.growth_accounts WHERE user_id=u FOR UPDATE;
 SELECT squad_id INTO sid FROM public.growth_squad_members WHERE user_id=u;
 IF p_action IN ('create','join') THEN
  IF sid IS NOT NULL THEN RAISE EXCEPTION 'Keluar dari squad saat ini sebelum bergabung'; END IF;
  IF p_action='create' THEN
   IF length(trim(coalesce(p_payload->>'name',''))) NOT BETWEEN 3 AND 40 THEN RAISE EXCEPTION 'Nama squad 3–40 karakter'; END IF;
   INSERT INTO public.growth_squads(name) VALUES(trim(p_payload->>'name')) RETURNING id INTO sid;
  ELSE
   SELECT id INTO sid FROM public.growth_squads WHERE code=upper(trim(p_payload->>'code')) FOR UPDATE;
   IF sid IS NULL THEN RAISE EXCEPTION 'Kode squad tidak ditemukan'; END IF;
   SELECT count(*) INTO n FROM public.growth_squad_members WHERE squad_id=sid;
   IF n>=6 THEN RAISE EXCEPTION 'Squad sudah penuh'; END IF;
  END IF;
  INSERT INTO public.growth_squad_members(user_id,squad_id) VALUES(u,sid);
 ELSIF p_action='leave' THEN
  DELETE FROM public.growth_squad_members WHERE user_id=u;
  DELETE FROM public.growth_squad_posts WHERE user_id=u AND squad_id=sid;
 ELSIF p_action='kudos' THEN
  target:=(p_payload->>'recipient')::uuid;
  IF sid IS NULL OR target=u OR NOT EXISTS(SELECT 1 FROM public.growth_squad_members WHERE user_id=target AND squad_id=sid) THEN RAISE EXCEPTION 'Pilih teman satu squad'; END IF;
  SELECT count(*) INTO n FROM public.growth_kudos WHERE sender_id=u AND (created_at AT TIME ZONE 'Asia/Jakarta')::date=(now() AT TIME ZONE 'Asia/Jakarta')::date;
  IF n>=5 THEN RAISE EXCEPTION 'Lima kudos hari ini sudah terkirim. Kembali besok, ya.'; END IF;
  INSERT INTO public.growth_kudos(sender_id,recipient_id,squad_id) VALUES(u,target,sid);
 ELSIF p_action='post' THEN
  IF sid IS NULL THEN RAISE EXCEPTION 'Gabung squad terlebih dahulu'; END IF;
  IF length(trim(coalesce(p_payload->>'body',''))) NOT BETWEEN 1 AND 1000 THEN RAISE EXCEPTION 'Jawaban harus 1–1000 karakter'; END IF;
  INSERT INTO public.growth_squad_posts(user_id,squad_id,body,week) VALUES(u,sid,trim(p_payload->>'body'),w) ON CONFLICT(user_id,squad_id,week) DO UPDATE SET body=excluded.body,created_at=now();
 ELSE RAISE EXCEPTION 'Invalid social action'; END IF;
END $$;

-- Coarse aggregates only; no admin path to journal payloads.
CREATE FUNCTION public.growth_analytics() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE result jsonb;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=auth.uid() AND role='admin') THEN RAISE EXCEPTION 'Admin only'; END IF;
 SELECT jsonb_build_object('users',(SELECT count(*) FROM public.growth_accounts),'completedQuests',(SELECT count(*) FROM public.growth_progress WHERE completed_at IS NOT NULL),'activeThisWeek',(SELECT count(DISTINCT user_id) FROM public.growth_xp_ledger WHERE created_at>now()-interval '7 days')) INTO result;
 RETURN result;
END $$;

REVOKE ALL ON FUNCTION public.growth_load(),public.growth_settings(jsonb),public.growth_save_progress(text,jsonb),public.growth_action(jsonb),public.growth_save_content(jsonb),public.growth_social(),public.growth_social_action(text,jsonb),public.growth_analytics() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.growth_load(),public.growth_settings(jsonb),public.growth_save_progress(text,jsonb),public.growth_action(jsonb),public.growth_save_content(jsonb),public.growth_social(),public.growth_social_action(text,jsonb),public.growth_analytics() TO authenticated;
REVOKE ALL ON FUNCTION public.growth_lesson_allowed(text,jsonb),public.growth_validate_answers(jsonb,jsonb),public.growth_assign_league() FROM PUBLIC,anon,authenticated;
