drop table if exists todos;
create table todos (
    id varchar primary key,
    "text" text,
    done boolean default false,
    added_dttm timestamp default now()

);

insert into todos (id, text)
values ('1', 'Write HTML');

insert into todos (id, text)
values ('2', 'Write CSS');

insert into todos (id, text)
values ('3', 'Our unique todo');
