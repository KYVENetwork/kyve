import { knex, Knex } from "knex";

export const connect = (): Knex => {
  return knex({
    client: "sqlite3",
    connection: {
      filename: "db.sqlite",
    },
    useNullAsDefault: true,
  });
};

export const start = async (knex: Knex) => {
  return knex.schema.createTableIfNotExists("contracts", (table) => {
    table.string("id", 64).notNullable();
    table.bigInteger("height");
    table.json("state");
    table.json("validity");
  });
}
