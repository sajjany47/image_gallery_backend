import * as Yup from "yup";

export const userSchema = Yup.object({
  username: Yup.string().required("Username is required"),
  password: Yup.string().required("Password is required"),
  name: Yup.string().required("Name is required"),
  email: Yup.string().required("Email is required"),
});
