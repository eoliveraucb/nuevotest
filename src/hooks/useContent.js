import { useContext } from "react";
import { ContentContext } from "../context/content-context.js";

export default function useContent() {
  return useContext(ContentContext);
}