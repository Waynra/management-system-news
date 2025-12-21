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
    const isValidationError = Boolean(error.isJoi);
    const statusCode = isValidationError ? 400 : 500;
    if (!isValidationError) {
      console.error("addNewsController error:", error.message);
    }
    return res.status(statusCode).json({
      status: "error",
      message: isValidationError ? error.message : "Internal server error",
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
    const isValidationError = Boolean(error.isJoi);
    const statusCode = isValidationError ? 400 : 500;
    if (!isValidationError) {
      console.error("searchController error:", error.message);
    }
    return res.status(statusCode).json({
      status: "error",
      message: isValidationError ? error.message : "Internal server error",
    });
  }
};

export const getNewsController = async (req, res) => {
  try {
    newsFilterValidation(req.query);
    const dataResponse = await getNewsHelper(req.query);
    return res.status(200).json(dataResponse);
  } catch (error) {
    const isValidationError = Boolean(error.isJoi);
    const statusCode = isValidationError ? 400 : 500;
    if (!isValidationError) {
      console.error("getNewsController error:", error.message);
    }
    return res.status(statusCode).json({
      status: "error",
      message: isValidationError ? error.message : "Internal server error",
    });
  }
};
