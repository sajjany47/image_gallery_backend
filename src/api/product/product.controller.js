import { StatusCodes } from "http-status-codes";
import { productSchema } from "./product.scheam.js";
import product from "./product.model.js";

export const ProductCreate = async (req, res) => {
  try {
    const validateProduct = await productSchema.validate(req.body);

    if (validateProduct) {
      const isValid = await product.findOne({
        name: validateProduct.name,
      });

      if (!isValid) {
        let productData = {
          name: validateProduct.name,
          type: validateProduct.type,
          url: validateProduct.url,
        };

        const createProduct = new product(productData);

        const saveProduct = await createProduct.save();

        res
          .status(StatusCodes.OK)
          .json({ message: "Product created successfully", data: saveProduct });
      } else {
        return res
          .status(StatusCodes.CONFLICT)
          .json({ message: "Product name already exists" });
      }
    }
  } catch (error) {
    res.status(StatusCodes.BAD_GATEWAY).json({
      message: error,
    });
  }
};

export const ProductList = async (req, res) => {
  try {
    const list = await product.find({});

    res
      .status(StatusCodes.OK)
      .json({ message: "Data fetched successfully", data: list });
  } catch (error) {
    res.status(StatusCodes.BAD_GATEWAY).json({ message: error.message });
  }
};
