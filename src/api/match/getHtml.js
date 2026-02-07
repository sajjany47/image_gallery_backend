import axios from "axios";
import { load } from "cheerio";
const GetHtml = async (url) => {
  try {
    if (!url) return null;

    const response = await axios.get(url, {
      timeout: 15000,
      validateStatus: (status) => status >= 200 && status < 400,
    });

    if (!response?.data) return null;

    const $ = load(response.data);
    return $;
  } catch (error) {
    // log error internally but return empty
    console.error("GetHtml Error:", error?.message || error);
    return null; // return empty instead of throwing
  }
};

export default GetHtml;
