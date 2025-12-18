import { DataTypes } from "sequelize";
import sequelize from "../connection.js";

const News = sequelize.define(
  "News",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    author: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    source: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "news",
    timestamps: false,
    indexes: [
      {
        name: "idx_news_author",
        fields: ["author"],
      },
      {
        name: "idx_news_source",
        fields: ["source"],
      },
    ],
  }
);

export default News;
