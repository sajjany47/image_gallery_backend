import express from "express";
import {
  ProductCreate,
  ProductList,
} from "../api/product/product.controller.js";

const ProductRoutes = express.Router();

ProductRoutes.route("/create").post(ProductCreate);
ProductRoutes.route("/list").get(ProductList);

export default ProductRoutes;
