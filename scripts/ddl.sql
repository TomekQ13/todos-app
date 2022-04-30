drop table if exists todos;
create table todos (
    id varchar primary key,
    "text" text,
    user_id varchar not null, 
    done boolean default false,
    added_dttm timestamp default now()

);

insert into todos (id, user_id, text)
values ('1', 'a45ed546-0328-443e-a2df-0e74a6544670', 'Write HTML');

insert into todos (id, user_id, text)
values ('2', 'a45ed546-0328-443e-a2df-0e74a6544670', 'Write CSS');

insert into todos (id, user_id, text)
values ('3', 'a45ed546-0328-443e-a2df-0e74a6544670', 'Our unique todo');