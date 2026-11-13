-- Usta v3.3: несколько направлений у мастера и фото профиля
alter table public.masters
  add column categories text[] not null default '{}',
  add column avatar text check (avatar is null or (char_length(avatar) <= 60000 and avatar ~ '^/9j/[A-Za-z0-9+/=]+$'));
update public.masters set categories = array[category] where cardinality(categories) = 0;
alter table public.masters add constraint masters_categories_check check (
  cardinality(categories) between 1 and 5 and categories <@ array['roofer','mason','concrete','carpenter','welder','laborer','machinery','demolition','tiler','plasterer','painter','drywall','flooring','ceilings','windows','facade','electrician','plumber','heating','gas','aircon','well','furniture','locksmith','handyman','gardener','cleaning','mover','appliance','phone','computer','tv','mechanic','autoelectric','tire','bodywork','tailor','shoemaker','barber','cook','photo','other']::text[]);
create index masters_categories_gin on public.masters using gin (categories);

-- главная специальность = первая в списке (для старых экранов и сортировки)
create or replace function public.usta_sync_category() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.categories is null or cardinality(new.categories) = 0 then new.categories := array[new.category]; end if;
  if tg_op = 'UPDATE' and new.categories is not distinct from old.categories and new.category is distinct from old.category then
    new.categories := (array_prepend(new.category, array_remove(old.categories, new.category)))[1:5];
  end if;
  new.category := new.categories[1];
  return new;
end $$;
create trigger masters_sync_category before insert or update of categories, category on public.masters
  for each row execute function public.usta_sync_category();
revoke execute on function public.usta_sync_category() from public, anon, authenticated;

create or replace function public.register_master_v3(
  p_name text, p_phone text, p_password text, p_categories text[], p_region text, p_place text,
  p_district text, p_about text, p_experience int
) returns json language plpgsql security definer set search_path = '' as $$
declare v_id uuid; v_token uuid; v_cats text[];
begin
  if p_password is null or char_length(p_password) < 6 or char_length(p_password) > 72 then return json_build_object('error','bad_password'); end if;
  if p_region is null or coalesce(btrim(p_place),'') = '' then return json_build_object('error','loc'); end if;
  select array_agg(distinct c) into v_cats from unnest(coalesce(p_categories,'{}')) c;
  if v_cats is null or cardinality(v_cats) = 0 then return json_build_object('error','cats'); end if;
  -- порядок как выбрал мастер, без повторов
  select array_agg(c order by i) into v_cats from (select c, min(i) i from unnest(p_categories) with ordinality u(c,i) group by c) x;
  begin
    insert into public.masters (name, phone, category, categories, region, place, district, about, experience_years)
    values (btrim(p_name), p_phone, v_cats[1], v_cats, p_region, btrim(p_place), coalesce(btrim(p_district),''), coalesce(btrim(p_about),''), p_experience)
    returning id into v_id;
  exception
    when unique_violation then return json_build_object('error','phone_exists');
    when check_violation or not_null_violation then return json_build_object('error','bad_input');
  end;
  insert into public.master_auth (master_id, pass_hash) values (v_id, extensions.crypt(p_password, extensions.gen_salt('bf', 10)));
  insert into public.master_sessions (master_id) values (v_id) returning token into v_token;
  return json_build_object('token', v_token);
end $$;

create or replace function public.update_master_v3(
  p_token uuid, p_name text, p_categories text[], p_region text, p_place text, p_district text, p_about text, p_experience int
) returns json language plpgsql security definer set search_path = '' as $$
declare v_id uuid := public.usta_session_master(p_token); v_cats text[];
begin
  if v_id is null then return json_build_object('error','no_session'); end if;
  if p_region is null or coalesce(btrim(p_place),'') = '' then return json_build_object('error','loc'); end if;
  select array_agg(c order by i) into v_cats from (select c, min(i) i from unnest(coalesce(p_categories,'{}')) with ordinality u(c,i) group by c) x;
  if v_cats is null or cardinality(v_cats) = 0 then return json_build_object('error','cats'); end if;
  begin
    update public.masters set name = btrim(p_name), categories = v_cats, region = p_region, place = btrim(p_place),
      district = coalesce(btrim(p_district),''), about = coalesce(btrim(p_about),''), experience_years = p_experience, updated_at = now()
    where id = v_id;
  exception when check_violation or not_null_violation then return json_build_object('error','bad_input'); end;
  return json_build_object('ok', true);
end $$;

create or replace function public.set_avatar(p_token uuid, p_data text) returns json
language plpgsql security definer set search_path = '' as $$
declare v_id uuid := public.usta_session_master(p_token);
begin
  if v_id is null then return json_build_object('error','no_session'); end if;
  begin
    update public.masters set avatar = nullif(p_data,''), updated_at = now() where id = v_id;
  exception when check_violation then return json_build_object('error','bad_photo'); end;
  return json_build_object('ok', true);
end $$;

-- заявки видны по всем направлениям мастера
create or replace function public.master_feed(p_token uuid) returns json
language plpgsql security definer set search_path = '' as $$
declare m public.masters; v_seen timestamptz; v_out json;
begin
  select * into m from public.masters where id = public.usta_session_master(p_token);
  if m.id is null then return json_build_object('error','no_session'); end if;
  select seen_at into v_seen from public.master_feed_seen where master_id = m.id;
  select coalesce(json_agg(x order by x.created_at desc), '[]'::json) into v_out from (
    select r.id, r.category, r.body, r.place, r.landmark, r.when_kind, r.budget, r.response_count, r.created_at, r.status,
      (r.photo is not null) as has_photo, (r.voice is not null) as has_voice,
      exists (select 1 from public.responses s where s.request_id = r.id and s.master_id = m.id) as responded,
      (r.created_at > coalesce(v_seen, 'epoch'::timestamptz)) as is_new
    from public.requests r
    where r.category = any(m.categories) and r.region = m.region and r.status = 'open' and r.created_at > now() - interval '30 days'
    order by r.created_at desc limit 100) x;
  insert into public.master_feed_seen (master_id, seen_at) values (m.id, now())
    on conflict (master_id) do update set seen_at = now();
  return json_build_object('items', v_out, 'active', public.usta_sub_active(m) and m.is_active,
    'sub_until', greatest(m.trial_until, coalesce(m.paid_until, m.trial_until)), 'trial', m.paid_until is null or m.paid_until < m.trial_until);
end $$;

create or replace function public.request_media(p_token uuid, p_id uuid) returns json
language sql security definer set search_path = '' stable as $$
  select json_build_object('photo', r.photo, 'voice', r.voice, 'voice_mime', r.voice_mime)
  from public.requests r
  where r.id = p_id and (
    r.client_id = public.usta_session_client(p_token)
    or exists (select 1 from public.masters m where m.id = public.usta_session_master(p_token) and r.category = any(m.categories) and m.region = r.region))
$$;

create or replace function public.respond_request(p_token uuid, p_id uuid, p_message text) returns json
language plpgsql security definer set search_path = '' as $$
declare m public.masters; r public.requests;
begin
  select * into m from public.masters where id = public.usta_session_master(p_token);
  if m.id is null then return json_build_object('error','no_session'); end if;
  if not (m.is_active and public.usta_sub_active(m)) then return json_build_object('error','no_sub'); end if;
  select * into r from public.requests where id = p_id for update;
  if r.id is null or r.status <> 'open' or not (r.category = any(m.categories)) or r.region <> m.region then return json_build_object('error','notfound'); end if;
  if exists (select 1 from public.responses where request_id = p_id and master_id = m.id) then return json_build_object('ok', true); end if;
  if r.response_count >= 5 then return json_build_object('error','full'); end if;
  begin
    insert into public.responses (request_id, master_id, message) values (p_id, m.id, coalesce(btrim(p_message),''));
  exception when check_violation then return json_build_object('error','bad_input'); end;
  update public.requests set response_count = response_count + 1 where id = p_id;
  return json_build_object('ok', true);
end $$;

create or replace function public.badges(p_token uuid) returns json
language plpgsql security definer set search_path = '' stable as $$
declare v_client uuid := public.usta_session_client(p_token); m public.masters; v_seen timestamptz;
begin
  if v_client is not null then
    return json_build_object('chats', (select count(*) from public.messages mm join public.requests r on r.id = mm.request_id
        left join public.thread_seen ts on ts.request_id = mm.request_id and ts.master_id = mm.master_id
        where r.client_id = v_client and not mm.from_client and mm.id > coalesce(ts.client_seen,0)),
      'requests', (select count(*) from public.requests where client_id = v_client and status = 'open' and response_count > 0 and chosen_master is null));
  end if;
  select * into m from public.masters where id = public.usta_session_master(p_token);
  if m.id is null then return json_build_object('error','no_session'); end if;
  select seen_at into v_seen from public.master_feed_seen where master_id = m.id;
  return json_build_object(
    'chats', (select count(*) from public.messages mm left join public.thread_seen ts on ts.request_id = mm.request_id and ts.master_id = mm.master_id
        where mm.master_id = m.id and mm.from_client and mm.id > coalesce(ts.master_seen,0)),
    'feed', (select count(*) from public.requests r where r.category = any(m.categories) and r.region = m.region and r.status = 'open'
        and r.created_at > greatest(coalesce(v_seen,'epoch'::timestamptz), now() - interval '30 days')),
    'sub_days', greatest(0, ceil(extract(epoch from (greatest(m.trial_until, coalesce(m.paid_until, m.trial_until)) - now())) / 86400)::int));
end $$;

-- аватар в откликах, чате и «Моих мастерах»
create or replace function public.request_detail(p_token uuid, p_id uuid) returns json
language sql security definer set search_path = '' stable as $$
  select json_build_object(
    'request', (select json_build_object('id',r.id,'category',r.category,'region',r.region,'place',r.place,'landmark',r.landmark,'body',r.body,
        'when_kind',r.when_kind,'budget',r.budget,'status',r.status,'chosen_master',r.chosen_master,'response_count',r.response_count,
        'created_at',r.created_at,'photo',r.photo,'voice',r.voice,'voice_mime',r.voice_mime) from public.requests r where r.id = p_id),
    'responses', coalesce((select json_agg(json_build_object('master_id',m.id,'name',m.name,'phone',m.phone,'category',m.category,'categories',m.categories,'experience_years',m.experience_years,
        'rating_sum',m.rating_sum,'rating_count',m.rating_count,'verified',m.verified,'place',m.place,'busy',m.busy,'boost_until',m.boost_until,'avatar',m.avatar,'message',s.message,'created_at',s.created_at,
        'unread',(select count(*) from public.messages mm where mm.request_id = p_id and mm.master_id = m.id and not mm.from_client
                  and mm.id > coalesce((select client_seen from public.thread_seen ts where ts.request_id = p_id and ts.master_id = m.id),0)))
        order by (coalesce(m.boost_until,'epoch') > now()) desc, s.created_at) from public.responses s join public.masters m on m.id = s.master_id where s.request_id = p_id), '[]'::json))
  where exists (select 1 from public.requests r where r.id = p_id and r.client_id = public.usta_session_client(p_token))
$$;

create or replace function public.my_masters(p_token uuid) returns json
language sql security definer set search_path = '' stable as $$
  select coalesce(json_agg(x), '[]'::json) from (
    select distinct on (m.id) m.id, m.name, m.phone, m.category, m.categories, m.place, m.district, m.experience_years, m.rating_sum, m.rating_count, m.verified, m.avatar,
      exists (select 1 from public.reviews rv where rv.client_id = r.client_id and rv.master_id = m.id) as reviewed
    from public.requests r join public.masters m on m.id = r.chosen_master
    where r.client_id = public.usta_session_client(p_token) and m.is_active
    order by m.id limit 30) x
$$;

create or replace function public.admin_list_masters_v3(p_token uuid) returns json
language plpgsql security definer set search_path = '' stable as $$
begin
  if not public.usta_is_admin(p_token) then return json_build_object('error','forbidden'); end if;
  return json_build_object('masters', coalesce((select json_agg(json_build_object('id',m.id,'name',m.name,'phone',m.phone,'category',m.category,'categories',m.categories,'region',m.region,
      'place',m.place,'district',m.district,'experience_years',m.experience_years,'is_active',m.is_active,'verified',m.verified,'accepting',m.accepting,'busy',m.busy,
      'rating_sum',m.rating_sum,'rating_count',m.rating_count,'boost_until',m.boost_until,'deleted_at',m.deleted_at,'avatar',m.avatar,
      'complaints',(select count(*) from public.complaints k where k.master_id = m.id and k.status = 'open'),
      'responses30',(select count(*) from public.responses s where s.master_id = m.id and s.created_at > now() - interval '30 days'),
      'sub_until',greatest(m.trial_until, coalesce(m.paid_until, m.trial_until)),'trial',(m.paid_until is null or m.paid_until < m.trial_until),'created_at',m.created_at)
      order by m.created_at desc) from public.masters m), '[]'::json),
    'clients', (select count(*) from public.clients), 'requests', (select count(*) from public.requests where created_at > now() - interval '30 days'),
    'complaints_open', (select count(*) from public.complaints where status = 'open'));
end $$;

do $$
declare f text;
begin
  foreach f in array array['public.register_master_v3(text,text,text,text[],text,text,text,text,int)','public.update_master_v3(uuid,text,text[],text,text,text,text,int)','public.set_avatar(uuid,text)'] loop
    execute format('revoke execute on function %s from public', f);
    execute format('grant execute on function %s to anon, authenticated', f);
  end loop;
end $$;
