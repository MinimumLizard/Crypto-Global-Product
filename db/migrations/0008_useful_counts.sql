-- 0008: how many people found a page useful, for "N people found this lesson useful" (decision 0025).
--
-- The website still cannot read the feedback table (migration 0004); it can only call this function, which returns
-- one number: the senders whose latest vote on that page was "useful". Each sender counts once (by the keyed hash of
-- their address, never the address), and nothing is returned below a minimum, so a count is never shown when it is
-- small enough to be noise, and the figure shown is always the real one (Australian Consumer Law: no invented
-- social proof).

create function community.useful_count(p_page text) returns integer
language sql stable security definer set search_path = community, pg_temp as $$
  with latest as (
    select distinct on (client_key) useful
    from community.feedback
    where kind = 'page_vote' and page = p_page and client_key is not null
    order by client_key, received_at desc
  )
  select case when count(*) filter (where useful) >= 25 then (count(*) filter (where useful))::integer end
  from latest
$$;

revoke all on function community.useful_count(text) from public;
grant execute on function community.useful_count(text) to web_reader;
