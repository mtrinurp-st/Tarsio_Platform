-- Reject private requests if the browser changed accounts while they were queued.
-- Deploy together with the updated client, which supplies an expected owner.


CREATE OR REPLACE FUNCTION public.growth_save_progress(p_lesson_id text,p_progress jsonb) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE u uuid:=auth.uid(); s jsonb; schema jsonb; clean jsonb;
BEGIN
 IF auth.uid() IS NULL OR p_progress->>'ownerId' IS DISTINCT FROM auth.uid()::text THEN RAISE EXCEPTION 'Akun telah berubah. Muat ulang sebelum menyimpan.'; END IF;
 PERFORM public.growth_load();
 SELECT state INTO s FROM public.growth_accounts WHERE user_id=u FOR UPDATE;
 IF NOT public.growth_lesson_allowed(p_lesson_id,s) THEN RAISE EXCEPTION 'Selesaikan langkah sebelumnya terlebih dahulu'; END IF;
 SELECT schema_json INTO schema FROM public.growth_content WHERE id=p_lesson_id;
 IF jsonb_typeof(p_progress->'answers')<>'object' OR octet_length(p_progress::text)>150000 OR length(coalesce(p_progress->>'sessionId','')) NOT BETWEEN 1 AND 100 THEN RAISE EXCEPTION 'Invalid draft'; END IF;
 IF coalesce((p_progress->>'step')::int,-1)<0 OR (p_progress->>'step')::int>=jsonb_array_length(schema->'steps') THEN RAISE EXCEPTION 'Invalid step'; END IF;
 clean:=jsonb_build_object('answers',p_progress->'answers','step',(p_progress->>'step')::int,'sessionId',p_progress->>'sessionId','startedAt',now(),'updatedAt',now());
 INSERT INTO public.growth_progress(user_id,lesson_id,payload,initial_session) VALUES(u,p_lesson_id,clean,p_progress->>'sessionId') ON CONFLICT(user_id,lesson_id) DO UPDATE SET payload=clean||jsonb_build_object('startedAt',growth_progress.payload->'startedAt'),resumed=growth_progress.resumed OR growth_progress.initial_session<>p_progress->>'sessionId',updated_at=now();
END $$;

CREATE OR REPLACE FUNCTION public.growth_action(p_action jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE u uuid:=auth.uid(); s jsonb; d text:=(now() AT TIME ZONE 'Asia/Jakarta')::date::text; t text:=p_action->>'type'; xp integer:=0; gems integer:=0; ek text; lesson text; pr public.growth_progress; sc jsonb; st integer; freeze_count integer; diff integer; missed integer; last text; k text; inserted integer;
BEGIN
 IF auth.uid() IS NULL OR p_action->>'expectedUserId' IS DISTINCT FROM auth.uid()::text THEN RAISE EXCEPTION 'Akun telah berubah. Muat ulang sebelum menyimpan.'; END IF;
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

CREATE OR REPLACE FUNCTION public.growth_settings(p_settings jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE u uuid:=auth.uid(); s jsonb; k text;
BEGIN
 IF auth.uid() IS NULL OR p_settings->>'expectedUserId' IS DISTINCT FROM auth.uid()::text THEN RAISE EXCEPTION 'Akun telah berubah. Muat ulang sebelum menyimpan.'; END IF;
 p_settings:=p_settings-'expectedUserId';
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
