import { makeHeadTermRoute } from "@/components/headTermRoute";

const route = makeHeadTermRoute("cv-academique");
export const dynamicParams = false;
export const generateStaticParams = route.generateStaticParams;
export const generateMetadata = route.generateMetadata;
export default route.Page;
