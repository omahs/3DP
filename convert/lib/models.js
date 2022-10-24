import { DataTypes, Sequelize } from "sequelize";

export const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: "balances.sqlite",
  logging: false,
});

export const Account = sequelize.define(
  "account",
  {
    address: DataTypes.STRING,
    amount: DataTypes.BIGINT,
    transfer_hash: DataTypes.STRING,
    is_received: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    indexes: [
      {
        unique: true,
        fields: ["address"],
      },
    ],
  }
);
