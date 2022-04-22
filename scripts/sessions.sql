drop table if exists sessions;
create table sessions (
    id varchar primary key,
    valid_to timestamp not null,
    added_dttm timestamp not null default now()
);