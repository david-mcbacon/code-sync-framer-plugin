import React from "react";
import {
  useAddToCart,
  useCart,
  useCreateCart,
} from "./hooks-shopify/Use_cart.tsx";
import { getQueryClient } from "./lib/Tanstack_query_client.tsx";
import { QueryClientProvider } from "@tanstack/react-query";
import { CheckoutButton } from "./Checkout_button.tsx";

export default function CartExample() {
  const queryClient = getQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <CartExampleInner />
    </QueryClientProvider>
  );
}

/**
 * Example component showing how to use the cart hooks
 */
const CartExampleInner: React.FC = () => {
  const {
    cart,
    cartId,
    isLoading,
    isAdding,
    error,
    addToCart,
    addToCartAsync,
    updateQuantity,
    removeLine,
  } = useCart();

  // Example variant IDs (replace with real ones from your Shopify store)
  const exampleVariantIds = [
    "gid://shopify/ProductVariant/55218501550405",
    "gid://shopify/ProductVariant/55218501615941",
  ];

  const handleAddToCart = async (variantId: string) => {
    try {
      // Using the sync version
      addToCart(variantId, 1);
      console.log("Product added to cart");
    } catch (error) {
      console.error("Error adding to cart:", error);
    }
  };

  const handleAddToCartAsync = async (variantId: string) => {
    try {
      // Using the async version with error handling
      await addToCartAsync(variantId, 2);
      console.log("Product added to cart (async)");
    } catch (error) {
      console.error("Error adding to cart:", error);
    }
  };

  const handleUpdateQuantity = (lineId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeLine(lineId);
    } else {
      updateQuantity(lineId, newQuantity);
    }
  };

  if (isLoading) {
    return <div>Loading cart...</div>;
  }

  if (error) {
    return <div>Error loading cart: {error.message}</div>;
  }

  const cartItems = cart?.lines?.edges || [];
  const totalAmount = cart?.cost?.totalAmount;

  return (
    <div className="cart-example">
      <h2>Shopping Cart</h2>
      <p>Cart ID: {cartId}</p>

      {/* Cart Items */}
      <div className="cart-items">
        <h3>Items in Cart ({cartItems.length})</h3>
        {cartItems.length === 0 ? (
          <p>Your cart is empty</p>
        ) : (
          <ul>
            {cartItems.map(({ node: item }) => (
              <li key={item.id} className="cart-item">
                <div className="item-info">
                  <h4>{item.merchandise.product.title}</h4>
                  <img
                    src={item.merchandise.product.featuredImage?.url}
                    alt={item.merchandise.product.featuredImage?.altText}
                    style={{ width: 100, height: 100 }}
                  />
                  <p>
                    Price: {item.merchandise.price.amount}{" "}
                    {item.merchandise.price.currencyCode}
                  </p>
                  <p>Quantity: {item.quantity}</p>
                </div>
                <div className="item-actions">
                  <button
                    onClick={() =>
                      handleUpdateQuantity(item.id, item.quantity - 1)
                    }
                    disabled={item.quantity <= 1}
                  >
                    -
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    onClick={() =>
                      handleUpdateQuantity(item.id, item.quantity + 1)
                    }
                  >
                    +
                  </button>
                  <button
                    onClick={() => removeLine(item.id)}
                    className="remove-btn"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Cart Total */}
      {totalAmount && (
        <div className="cart-total">
          <h3>
            Total: {totalAmount.amount} {totalAmount.currencyCode}
          </h3>
        </div>
      )}

      {/* Add to Cart Examples */}
      <div className="add-to-cart-examples">
        <h3>Add Products to Cart</h3>
        <div className="example-buttons">
          <button
            onClick={() => handleAddToCart(exampleVariantIds[0])}
            disabled={isAdding}
          >
            {isAdding ? "Adding..." : "Add Product 1"}
          </button>
          <button
            onClick={() => handleAddToCartAsync(exampleVariantIds[1])}
            disabled={isAdding}
          >
            {isAdding ? "Adding..." : "Add Product 2 (Async)"}
          </button>
        </div>
      </div>

      {/* Cart Data Display */}
      <div
        className="cart-debug"
        style={{ display: "flex", flexDirection: "column", maxWidth: 300 }}
      >
        <h3>Cart Data (Debug)</h3>
        {/* <pre>{JSON.stringify(cart, null, 2)}</pre> */}
      </div>
      <CheckoutButton />
    </div>
  );
};

const cart = {
  id: "gid://shopify/Cart/hWN2MVg34V8Irww1KQoU1q4Z?key=f4d6749a880c46c4fb6ba68bab48179f",
  createdAt: "2025-08-29T14:11:48Z",
  updatedAt: "2025-08-29T14:16:52Z",
  lines: {
    edges: [
      {
        node: {
          id: "gid://shopify/CartLine/8da5b2e1-79ba-4692-af2d-f5e5d0c0eb9b?cart=hWN2MVg34V8Irww1KQoU1q4Z",
          quantity: 2,
          merchandise: {
            id: "gid://shopify/ProductVariant/55218501615941",
            product: {
              id: "gid://shopify/Product/15176684044613",
              title: "The Complete Snowboard",
              handle: "the-complete-snowboard",
              featuredImage: {
                url: "https://cdn.shopify.com/s/files/1/0967/3896/7877/files/Main_589fc064-24a2-4236-9eaf-13b2bd35d21d.jpg?v=1753365378",
                altText:
                  "Top and bottom view of a snowboard. The top view shows abstract circles and lines in shades of\n          teal. The bottom view shows abstract circles and lines in shades of purple and blue with the text “SHOPIFY”\n          in a sans serif typeface on top.",
              },
            },
            price: {
              amount: "699.95",
              currencyCode: "EUR",
            },
          },
        },
      },
    ],
    pageInfo: {
      hasNextPage: false,
      hasPreviousPage: false,
    },
  },
  cost: {
    totalAmount: {
      amount: "1399.9",
      currencyCode: "EUR",
    },
    subtotalAmount: {
      amount: "1399.9",
      currencyCode: "EUR",
    },
    totalTaxAmount: null,
  },
};

/**
 * Alternative: Using individual hooks for more granular control
 */
export const AdvancedCartExample: React.FC = () => {
  // You can also use individual hooks if you need more control
  const { data: cartData, isLoading: cartLoading } = useCreateCart();
  const { addToCart, isAdding } = useAddToCart();

  // Handle cart creation separately
  React.useEffect(() => {
    if (cartData?.data?.cartCreate?.cart?.id) {
      console.log("New cart created:", cartData.data.cartCreate.cart.id);
    }
  }, [cartData]);

  if (cartLoading) {
    return <div>Creating cart...</div>;
  }

  return (
    <div>
      <h2>Advanced Cart Example</h2>
      <button
        onClick={() =>
          addToCart({
            cartId:
              cartData?.data?.cart?.id ||
              cartData?.data?.cartCreate?.cart?.id ||
              "",
            variantId: "gid://shopify/ProductVariant/example",
            quantity: 1,
          })
        }
        disabled={isAdding}
      >
        Add Item (Advanced)
      </button>
    </div>
  );
};

/**
 * Hook usage patterns:
 *
 * 1. Simple cart management:
 *    const { cart, addToCart, updateQuantity, removeLine } = useCart();
 *
 * 2. Individual hook usage:
 *    const { data: cartData } = useCreateCart();
 *    const { addToCart } = useAddToCart();
 *    const { updateQuantity, removeLine } = useCartMutations();
 *
 * 3. Manual cart fetching:
 *    const { data: cartData } = useGetCart(cartId);
 *
 * The hooks automatically handle:
 * - Local storage persistence
 * - Cart creation if none exists
 * - Query invalidation and cache updates
 * - Error handling
 * - Loading states
 */
