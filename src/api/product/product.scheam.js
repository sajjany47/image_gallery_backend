import * as Yup from "yup";

export const productSchema = Yup.object({
  type: Yup.string().required("Type is required").oneOf(["free", "premium"]),
  name: Yup.string().required("Name is required"),
  url: Yup.string().required("Image url is required"),
});
