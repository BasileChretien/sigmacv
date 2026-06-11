import { makeHeadTermRoute } from "@/components/headTermRoute";

const route = makeHeadTermRoute("curriculo-academico");
export const dynamicParams = false;
export const generateStaticParams = route.generateStaticParams;
export const generateMetadata = route.generateMetadata;
export default route.Page;
