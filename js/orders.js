import { supabase } from "./supabase.js";

const ordersContainer =
  document.getElementById("ordersContainer");

const cartCount =
  document.getElementById("cartCount");


let cart = JSON.parse(
  localStorage.getItem("lzl_cart") || "[]"
);


function updateCartCount() {
  cartCount.textContent = cart.length;
}


function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function formatDate(value) {

  return new Date(value).toLocaleString(
    "en-MY",
    {
      dateStyle: "medium",
      timeStyle: "short"
    }
  );

}


function formatStatus(status) {

  const value =
    String(status || "pending")
      .toLowerCase();

  return `
    <span class="order-status status-${escapeHTML(value)}">
      ${escapeHTML(
        value.charAt(0).toUpperCase() +
        value.slice(1)
      )}
    </span>
  `;

}


async function loadOrders() {

  ordersContainer.innerHTML = `
    <div class="loading-state">
      <p>Loading orders...</p>
    </div>
  `;


  const {
    data: {
      user
    }
  } =
    await supabase.auth.getUser();


  if (!user) {

    ordersContainer.innerHTML = `

      <div class="orders-empty">

        <h2>
          Sign in required
        </h2>

        <p>
          Sign in to view your orders.
        </p>

        <a href="./login.html">
          Sign In
        </a>

      </div>

    `;

    return;
  }


  const {
    data: orders,
    error
  } = await supabase

    .from("orders")

    .select(`
      id,
      total,
      status,
      created_at,
      order_items (
        id,
        quantity,
        price,
        product_id,
        products (
          name,
          thumbnail_url,
          limited_id
        )
      )
    `)

    .eq(
      "user_id",
      user.id
    )

    .order(
      "created_at",
      {
        ascending: false
      }
    );


  if (error) {

    console.error(error);


    ordersContainer.innerHTML = `

      <div class="orders-empty">

        <h2>
          Unable to load orders
        </h2>

        <p>
          ${escapeHTML(
            error.message
          )}
        </p>

      </div>

    `;

    return;
  }


  if (!orders || !orders.length) {

    ordersContainer.innerHTML = `

      <div class="orders-empty">

        <h2>
          No orders yet
        </h2>

        <p>
          Your purchases will appear here.
        </p>

        <a href="./store.html">
          Browse Limiteds
        </a>

      </div>

    `;

    return;
  }


  ordersContainer.innerHTML =
    orders.map(order => {

      const items =
        order.order_items || [];


      const itemHTML =
        items.map(item => {

          const product =
            item.products;


          return `

            <div class="order-product">

              <div class="order-product-image">

                ${
                  product?.thumbnail_url
                    ? `
                      <img
                        src="${escapeHTML(
                          product.thumbnail_url
                        )}"
                        alt="${escapeHTML(
                          product.name
                        )}"
                      >
                    `
                    : `
                      <div class="no-image">
                        NO IMAGE
                      </div>
                    `
                }

              </div>


              <div class="order-product-info">

                <h3>
                  ${escapeHTML(
                    product?.name ||
                    "Product"
                  )}
                </h3>

                <span>
                  Limited ID:
                  ${escapeHTML(
                    product?.limited_id ||
                    "N/A"
                  )}
                </span>

                <span>
                  Quantity:
                  ${item.quantity}
                </span>

              </div>


              <strong>
                RM ${(
                  Number(item.price) *
                  Number(item.quantity)
                ).toFixed(2)}
              </strong>

            </div>

          `;

        }).join("");


      return `

        <article class="order-card">

          <div class="order-card-header">

            <div>

              <span class="order-label">
                ORDER ID
              </span>

              <strong class="order-id">
                ${escapeHTML(
                  order.id
                )}
              </strong>

            </div>


            <div class="order-date">

              ${formatDate(
                order.created_at
              )}

            </div>

          </div>


          <div class="order-status-row">

            ${formatStatus(
              order.status
            )}

          </div>


          <div class="order-products">

            ${itemHTML}

          </div>


          <div class="order-card-footer">

            <span>
              Order Total
            </span>

            <strong>
              RM ${Number(
                order.total
              ).toFixed(2)}
            </strong>

          </div>

        </article>

      `;

    }).join("");

}


document
  .getElementById("cartButton")
  .addEventListener(
    "click",
    () => {

      window.location.href =
        "./cart.html";

    }
  );


document
  .getElementById("accountButton")
  .addEventListener(
    "click",
    () => {

      window.location.href =
        "./orders.html";

    }
  );


updateCartCount();

loadOrders();