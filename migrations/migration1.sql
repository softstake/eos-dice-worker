CREATE TABLE IF NOT EXISTS ${schema~}.bets (
    id bigint NOT NULL,
    bet_id bigint,
    game_id bigint,
    player_name text,
    player_seed text,
    house_seed_hash text,
    signature text,
    bet_amount real,
    roll_under bigint,
    random_roll bigint,
    referrer text,
    state smallint DEFAULT 0 NOT NULL,
    player_payout real DEFAULT 0 NOT NULL,
    referer_payout real DEFAULT 0 NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone DEFAULT (now())::timestamp without time zone
);

CREATE SEQUENCE ${schema~}.bets_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER TABLE ONLY ${schema~}.bets ALTER COLUMN id SET DEFAULT nextval('bets_id_seq'::regclass);

ALTER TABLE ONLY ${schema~}.bets
    ADD CONSTRAINT bets_bet_id_key UNIQUE (bet_id);

ALTER TABLE ONLY ${schema~}.bets
    ADD CONSTRAINT bets_game_id_key UNIQUE (game_id);

ALTER TABLE ONLY ${schema~}.bets
    ADD CONSTRAINT bets_pkey PRIMARY KEY (id);