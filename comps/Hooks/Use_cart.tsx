import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { shopifyClient } from "../lib/Shopify_client.tsx";
import {
  getCartIdFromStorage,
  saveCartIdToStorage,
} from "../lib/utils/Cart_local_storage.tsx";

/**
 * Query keys used for cart operations
 * Export this to use in other files for query invalidation
 */
export const CART_QUERY_KEYS = {
  /** Base cart query key */
  all: ["cart"] as const,
  /** Cart query key with specific cart ID */
  byId: (cartId?: string) => ["cart", cartId] as const,
} as const;

export interface CartItem {
  id: string;
  quantity: number;
  merchandise: {
    id: string;
    product: {
      id: string;
      title: string;
      handle: string;
      featuredImage: {
        url: string;
        altText: string;
      };
    };
    price: {
      amount: string;
      currencyCode: string;
    };
  };
}

export interface CartData {
  id: string;
  createdAt: string;
  updatedAt: string;
  checkoutUrl: string;
  lines: {
    edges: {
      node: CartItem;
    }[];
    pageInfo: {
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  };
  cost: {
    totalAmount: {
      amount: string;
      currencyCode: string;
    };
    subtotalAmount: {
      amount: string;
      currencyCode: string;
    };
    totalTaxAmount: {
      amount: string;
      currencyCode: string;
    };
  };
}

export type CartResponse = {
  data: {
    cart: CartData | null;
    cartCreate?: {
      cart: CartData;
    };
    cartLinesAdd?: {
      cart: CartData;
    };
    cartLinesUpdate?: {
      cart: CartData;
    };
    cartLinesRemove?: {
      cart: CartData;
    };
  } | null;
  errors: Array<{ message: string }>;
};

/**
 * Hook to create or get existing cart
 * Checks local storage first, creates new cart if none exists
 */
export const useCreateCart = () => {
  const cartCreateQuery = `#graphql
    mutation cartCreate {
      cartCreate {
        cart {
          id
          createdAt
          updatedAt
          checkoutUrl
          lines(first: 100) {
            edges {
              node {
                id
                quantity
                merchandise {
                  ... on ProductVariant {
                    id
                    product {
                      id
                      title
                      handle
                      featuredImage {
                        url
                        altText
                      }
                    }
                    price {
                      amount
                      currencyCode
                    }
                  }
                }
              }
            }
            pageInfo {
              hasNextPage
              hasPreviousPage
            }
          }
          cost {
            totalAmount {
              amount
              currencyCode
            }
            subtotalAmount {
              amount
              currencyCode
            }
            totalTaxAmount {
              amount
              currencyCode
            }
          }
        }
      }
    }
  `;

  const { data, isLoading, error } = useQuery({
    queryKey: CART_QUERY_KEYS.all,
    queryFn: async (): Promise<CartResponse> => {
      // Check if we already have a cart ID in local storage
      const existingCartId = getCartIdFromStorage();

      if (existingCartId) {
        // If we have a cart ID, try to get the existing cart
        const getCartQuery = `#graphql
          query getCart($cartId: ID!) {
            cart(id: $cartId) {
              id
              createdAt
              updatedAt
              checkoutUrl
              lines(first: 100) {
                edges {
                  node {
                    id
                    quantity
                    merchandise {
                      ... on ProductVariant {
                        id
                        product {
                          id
                          title
                          handle
                          featuredImage {
                            url
                            altText
                          }
                        }
                        price {
                          amount
                          currencyCode
                        }
                      }
                    }
                  }
                }
                pageInfo {
                  hasNextPage
                  hasPreviousPage
                }
              }
              cost {
                totalAmount {
                  amount
                  currencyCode
                }
                subtotalAmount {
                  amount
                  currencyCode
                }
                totalTaxAmount {
                  amount
                  currencyCode
                }
              }
            }
          }
        `;

        const result = await shopifyClient<CartResponse["data"]>({
          query: getCartQuery,
          variables: { cartId: existingCartId },
        });

        // If cart doesn't exist (likely expired), create a new one
        if (result.data?.cart === null) {
          const createResult = await shopifyClient<CartResponse["data"]>({
            query: cartCreateQuery,
          });

          if (createResult.data?.cartCreate?.cart?.id) {
            saveCartIdToStorage(createResult.data.cartCreate.cart.id);
          }

          return createResult;
        }

        return result;
      } else {
        // No cart ID in storage, create a new cart
        const result = await shopifyClient<CartResponse["data"]>({
          query: cartCreateQuery,
        });

        if (result.data?.cartCreate?.cart?.id) {
          saveCartIdToStorage(result.data.cartCreate.cart.id);
        }

        return result;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return { data, isLoading, error };
};

/**
 * Hook to add products to cart
 */
export const useAddToCart = () => {
  const queryClient = useQueryClient();

  const addToCartMutation = `#graphql
    mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
      cartLinesAdd(cartId: $cartId, lines: $lines) {
        cart {
          id
          createdAt
          updatedAt
          checkoutUrl
          lines(first: 100) {
            edges {
              node {
                id
                quantity
                merchandise {
                  ... on ProductVariant {
                    id
                    product {
                      id
                      title
                      handle
                      featuredImage {
                        url
                        altText
                      }
                    }
                    price {
                      amount
                      currencyCode
                    }
                  }
                }
              }
            }
            pageInfo {
              hasNextPage
              hasPreviousPage
            }
          }
          cost {
            totalAmount {
              amount
              currencyCode
            }
            subtotalAmount {
              amount
              currencyCode
            }
            totalTaxAmount {
              amount
              currencyCode
            }
          }
        }
      }
    }
  `;

  const mutation = useMutation({
    mutationFn: async ({
      cartId,
      variantId,
      quantity = 1,
    }: {
      cartId: string;
      variantId: string;
      quantity?: number;
    }): Promise<CartResponse> => {
      return await shopifyClient<CartResponse["data"]>({
        query: addToCartMutation,
        variables: {
          cartId,
          lines: [{ merchandiseId: variantId, quantity }],
        },
      });
    },
    onSuccess: (data) => {
      // Invalidate and refetch cart queries
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEYS.all });
      queryClient.invalidateQueries({
        queryKey: CART_QUERY_KEYS.byId(data.data?.cartLinesAdd?.cart?.id),
      });
    },
  });

  return {
    addToCart: mutation.mutate,
    addToCartAsync: mutation.mutateAsync,
    isAdding: mutation.isPending,
    error: mutation.error,
  };
};

/**
 * Hook to get cart contents
 */
export const useGetCart = (cartId?: string) => {
  const getCartQuery = `#graphql
    query getCart($cartId: ID!) {
      cart(id: $cartId) {
        id
        createdAt
        updatedAt
        checkoutUrl
        lines(first: 100) {
          edges {
            node {
              id
              quantity
              merchandise {
                ... on ProductVariant {
                  id
                  product {
                    id
                    title
                    handle
                    featuredImage {
                      url
                      altText
                    }
                  }
                  price {
                    amount
                    currencyCode
                  }
                }
              }
            }
          }
          pageInfo {
            hasNextPage
            hasPreviousPage
          }
        }
        cost {
          totalAmount {
            amount
            currencyCode
          }
          subtotalAmount {
            amount
            currencyCode
          }
          totalTaxAmount {
            amount
            currencyCode
          }
        }
      }
    }
  `;

  const { data, isLoading, error } = useQuery({
    queryKey: CART_QUERY_KEYS.byId(cartId),
    queryFn: async (): Promise<CartResponse> =>
      await shopifyClient<CartResponse["data"]>({
        query: getCartQuery,
        variables: { cartId },
      }),
    enabled: !!cartId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  return { data, isLoading, error };
};

/**
 * Hook for cart mutations (update quantity, remove items)
 */
export const useCartMutations = () => {
  const queryClient = useQueryClient();

  // Update cart line quantity
  const updateQuantityMutation = `#graphql
    mutation cartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
      cartLinesUpdate(cartId: $cartId, lines: $lines) {
        cart {
          id
          createdAt
          updatedAt
          checkoutUrl
          lines(first: 100) {
            edges {
              node {
                id
                quantity
                merchandise {
                  ... on ProductVariant {
                    id
                    product {
                      id
                      title
                      handle
                      featuredImage {
                        url
                        altText
                      }
                    }
                    price {
                      amount
                      currencyCode
                    }
                  }
                }
              }
            }
            pageInfo {
              hasNextPage
              hasPreviousPage
            }
          }
          cost {
            totalAmount {
              amount
              currencyCode
            }
            subtotalAmount {
              amount
              currencyCode
            }
            totalTaxAmount {
              amount
              currencyCode
            }
          }
        }
      }
    }
  `;

  const updateQuantity = useMutation({
    mutationFn: async ({
      cartId,
      lineId,
      quantity,
    }: {
      cartId: string;
      lineId: string;
      quantity: number;
    }): Promise<CartResponse> => {
      return await shopifyClient<CartResponse["data"]>({
        query: updateQuantityMutation,
        variables: {
          cartId,
          lines: [{ id: lineId, quantity }],
        },
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEYS.all });
      queryClient.invalidateQueries({
        queryKey: CART_QUERY_KEYS.byId(data.data?.cartLinesUpdate?.cart?.id),
      });
    },
  });

  // Remove cart line
  const removeLineMutation = `#graphql
    mutation cartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
      cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
        cart {
          id
          createdAt
          updatedAt
          checkoutUrl
          lines(first: 100) {
            edges {
              node {
                id
                quantity
                merchandise {
                  ... on ProductVariant {
                    id
                    product {
                      id
                      title
                      handle
                      featuredImage {
                        url
                        altText
                      }
                    }
                    price {
                      amount
                      currencyCode
                    }
                  }
                }
              }
            }
            pageInfo {
              hasNextPage
              hasPreviousPage
            }
          }
          cost {
            totalAmount {
              amount
              currencyCode
            }
            subtotalAmount {
              amount
              currencyCode
            }
            totalTaxAmount {
              amount
              currencyCode
            }
          }
        }
      }
    }
  `;

  const removeLine = useMutation({
    mutationFn: async ({
      cartId,
      lineId,
    }: {
      cartId: string;
      lineId: string;
    }): Promise<CartResponse> => {
      return await shopifyClient<CartResponse["data"]>({
        query: removeLineMutation,
        variables: {
          cartId,
          lineIds: [lineId],
        },
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEYS.all });
      queryClient.invalidateQueries({
        queryKey: CART_QUERY_KEYS.byId(data.data?.cartLinesRemove?.cart?.id),
      });
    },
  });

  return {
    updateQuantity: {
      mutate: updateQuantity.mutate,
      mutateAsync: updateQuantity.mutateAsync,
      isPending: updateQuantity.isPending,
      error: updateQuantity.error,
    },
    removeLine: {
      mutate: removeLine.mutate,
      mutateAsync: removeLine.mutateAsync,
      isPending: removeLine.isPending,
      error: removeLine.error,
    },
  };
};

/**
 * Utility hook that combines cart creation and management
 */
export const useCart = () => {
  const {
    data: cartData,
    isLoading: isCreatingCart,
    error: cartError,
  } = useCreateCart();

  const cart = cartData?.data?.cart || cartData?.data?.cartCreate?.cart || null;
  const cartId = cart?.id || getCartIdFromStorage();

  const {
    addToCart,
    addToCartAsync,
    isAdding,
    error: addError,
  } = useAddToCart();
  const { updateQuantity, removeLine } = useCartMutations();

  return {
    cart,
    cartId,
    isLoading: isCreatingCart,
    isAdding,
    error: cartError || addError,
    addToCart: (variantId: string, quantity: number = 1) => {
      if (cartId) {
        addToCart({ cartId, variantId, quantity });
      }
    },
    addToCartAsync: (variantId: string, quantity: number = 1) => {
      if (cartId) {
        return addToCartAsync({ cartId, variantId, quantity });
      }
    },
    updateQuantity: (lineId: string, quantity: number) => {
      if (cartId) {
        updateQuantity.mutate({ cartId, lineId, quantity });
      }
    },
    removeLine: (lineId: string) => {
      if (cartId) {
        removeLine.mutate({ cartId, lineId });
      }
    },
  };
};
