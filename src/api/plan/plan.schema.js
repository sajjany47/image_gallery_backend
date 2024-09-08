import * as Yup from "yup";

export const planSchema = Yup.object({
  name: Yup.string()
    .required("Name is required")
    .oneOf(["Bronze", "Silver", "Gold"]),
  price: Yup.string().required("Price is required"),
  description: Yup.string().required("Description is required"),
  features: Yup.array()
    .required("Features is required")
    .min(1, "Mimimum one features required"),
});
