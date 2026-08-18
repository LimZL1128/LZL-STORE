import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  base: "/LZL-STORE/",

  build: {
    rolldownOptions: {
      input: {
        main: resolve(import.meta.dirname, "index.html"),

        store: resolve(
          import.meta.dirname,
          "html/store.html"
        ),

        login: resolve(
          import.meta.dirname,
          "html/login.html"
        ),

        admin: resolve(
          import.meta.dirname,
          "html/admin.html"
        ),

        adminOrders: resolve(
          import.meta.dirname,
          "html/admin-orders.html"
        ),

        account: resolve(
          import.meta.dirname,
          "html/account.html"
        ),

        cart: resolve(
          import.meta.dirname,
          "html/cart.html"
        ),

        checkout: resolve(
          import.meta.dirname,
          "html/checkout.html"
        ),

        order: resolve(
          import.meta.dirname,
          "html/order.html"
        ),

        orders: resolve(
          import.meta.dirname,
          "html/orders.html"
        ),

        product: resolve(
          import.meta.dirname,
          "html/product.html"
        )
      }
    }
  }
});