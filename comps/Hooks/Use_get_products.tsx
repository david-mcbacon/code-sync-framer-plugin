import { shopifyClient } from "../lib/Shopify_client.tsx";
import { useQuery } from "@tanstack/react-query";

export type ProductNode = {
  id: string;
  title: string;
  handle: string;
  featuredImage: { url: string; altText?: string | null } | null;
  variants: {
    edges: Array<{ node: { id: string } }>;
  };
};

type ProductsResponse = {
  data: {
    products: {
      edges: Array<{ node: ProductNode }>;
    };
  } | null;
  errors: Array<{ message: string }>;
};

// get also product variants ids
export const useGetProducts = () => {
  const productQuery = `#graphql
  query ProductsList($first: Int!) {
    products(first: $first) {
      edges {
        node {
          id
          title
          handle
          featuredImage { url altText }
          variants(first: 10) {
            edges {
              node {
                id
              }
            }
          }
        }
      }
    }
  }
  `;

  const { data, isLoading, error } = useQuery({
    queryKey: ["products"],
    queryFn: async (): Promise<ProductsResponse> =>
      await shopifyClient<ProductsResponse["data"]>({
        query: productQuery,
        variables: { first: 10 },
      }),
  });

  return { data, isLoading, error };
};
