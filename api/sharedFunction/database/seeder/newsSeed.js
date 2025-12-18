import sequelize from "../connection.js";
import News from "../models/News.js";
import esClient from "../../elastic/connection.js";

const ES_INDEX = process.env.ELASTICSEARCH_INDEX || "news";

const seedNews = async () => {
  try {
    await sequelize.authenticate();
    console.log("Seed: connected to Database");

    await News.sync();

    const seedData = [
      {
        title: "Harga BBM Naik Mulai Hari Ini",
        content:
          "Pemerintah resmi menaikkan harga BBM subsidi mulai hari ini sebagai bagian dari penyesuaian anggaran.",
        author: "Ahmad",
        source: "twitter",
        created_at: new Date(),
      },
      {
        title: "Cuaca Ekstrem Landa Jabodetabek",
        content:
          "Hujan deras disertai angin kencang melanda wilayah Jabodetabek sejak pagi hari.",
        author: "Budi",
        source: "detik",
        created_at: new Date(),
      },
      {
        title: "Startup Lokal Raih Pendanaan Seri A",
        content:
          "Sebuah startup teknologi lokal berhasil mengamankan pendanaan Seri A dari investor regional.",
        author: "Citra",
        source: "kompas",
        created_at: new Date(),
      },
      {
        title: "Timnas Indonesia Lolos ke Final",
        content:
          "Timnas Indonesia memastikan tiket final setelah menang dramatis di semifinal.",
        author: "Dewi",
        source: "twitter",
        created_at: new Date(),
      },
    ];

    const count = await News.count();
    if (count === 0) {
      await News.bulkCreate(seedData);
      console.log("Seed: DB seeded");
    } else {
      console.log("Seed: DB already has data, skip insert");
    }

    const newsList = await News.findAll();

    const indexExists = await esClient.indices.exists({ index: ES_INDEX });
    if (!indexExists) {
      await esClient.indices.create({
        index: ES_INDEX,
      });
      console.log("Seed: Elasticsearch index created");
    }

    for (const news of newsList) {
      await esClient.index({
        index: ES_INDEX,
        id: news.id.toString(),
        document: {
          title: news.title,
          content: news.content,
          author: news.author,
          source: news.source,
          created_at: news.created_at,
        },
      });
    }

    console.log("Seed: Elasticsearch indexed successfully");
  } catch (error) {
    console.error("Seed: Error:", error.message);
  } finally {
    await sequelize.close();
  }
};

export default seedNews;
