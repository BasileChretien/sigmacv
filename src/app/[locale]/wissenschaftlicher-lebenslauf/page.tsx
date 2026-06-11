import { makeHeadTermRoute } from "@/components/headTermRoute";

const route = makeHeadTermRoute("wissenschaftlicher-lebenslauf");
export const dynamicParams = false;
export const generateStaticParams = route.generateStaticParams;
export const generateMetadata = route.generateMetadata;
export default route.Page;
