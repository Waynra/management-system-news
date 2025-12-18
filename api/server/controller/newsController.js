import {
  addNewsHelper,
  getNewsHelper,
  searchHelper,
} from "../helper/newsHelper.js";
import {
  newsFilterValidation,
  newsPayloadValidation,
  newsQueryValidation,
} from "../helper/validationHelper.js";

export const addNewsController = async (req, res) => {
  try {
    newsPayloadValidation(req.body);
    const { id } = await addNewsHelper(req.body);
    return res.status(201).json({
      status: "ok",
      message: "News stored and queued",
      id,
    });
  } catch (error) {
    return res.status(400).json({
      status: "failed",
      message: error.message,
    });
  }
};

export const searchController = async (req, res) => {
  try {
    newsQueryValidation(req.query);
    const { query } = req.query;
    const dataResponse = await searchHelper(query);
    return res.status(200).json(dataResponse);
  } catch (error) {
    return res.status(400).json({
      status: "failed",
      message: error.message,
    });
  }
};

export const getNewsController = async (req, res) => {
  try {
    newsFilterValidation(req.query);
    const dataResponse = await getNewsHelper(req.query);
    return res.status(200).json(dataResponse);
  } catch (error) {
    return res.status(400).json({
      status: "failed",
      message: error.message,
    });
  }
};
