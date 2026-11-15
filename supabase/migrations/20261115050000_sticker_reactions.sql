-- Yellow jacket sticker reactions. They live beside kudos and the three signal
-- reactions in the same table, so the existing grants and RLS policies cover them.
alter type public.reaction_type add value if not exists 'bee_love';
alter type public.reaction_type add value if not exists 'bee_clap';
alter type public.reaction_type add value if not exists 'bee_party';
alter type public.reaction_type add value if not exists 'bee_thumbs_up';
alter type public.reaction_type add value if not exists 'bee_ok';
alter type public.reaction_type add value if not exists 'bee_wow';
alter type public.reaction_type add value if not exists 'bee_curious';
alter type public.reaction_type add value if not exists 'bee_oof';
alter type public.reaction_type add value if not exists 'bee_cry';
