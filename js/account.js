import { supabase } from "./supabase.js";

const accountInfo =
  document.getElementById("accountInfo");

const ordersContainer =
  document.getElementById("ordersContainer");

const cartCount =
  document.getElementById("cartCount");

const logoutButton =
  document.getElementById("logoutButton");

const cartButton =
  document.getElementById("cartButton");

let cart = JSON.parse(
  localStorage.getItem("lzl_cart") || "[]"
);


function escapeHTML(value) {

  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


function updateCartCount() {

  if (cartCount) {

    cartCount.textContent =
      cart.length;

  }

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


function statusLabel(status) {

  const value =
    String(status || "pending")
      .toLowerCase();


  const label =
    value.charAt(0).toUpperCase() +
    value.slice(1);


  return `
    <span
      class="account-order-status status-${escapeHTML(value)}"
    >
      ${escapeHTML(label)}
    </span>
  `;

}


async function getUser() {

  const {
    data: { user },
    error
  } = await supabase.auth.getUser();


  if (
    error ||
    !user
  ) {

    window.location.href =
      "./login.html";

    return null;

  }


  return user;

}


async function loadAccount(user) {

  const {
    data: profile,
    error
  } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();


  if (error) {

    console.error(error);

  }


  const role =
    profile?.role || "customer";


  const adminButton =
    role === "admin"

      ? `
        <div class="profile-admin-action">

          <a
            href="./admin.html"
            class="admin-panel-button"
          >
            Open Admin Panel
          </a>

        </div>
      `

      : "";


  accountInfo.innerHTML = `

    <div class="profile-row">

      <span>
        Email
      </span>

      <strong>
        ${escapeHTML(user.email)}
      </strong>

    </div>


    <div class="profile-row">

      <span>
        Account ID
      </span>

      <strong class="profile-id">
        ${escapeHTML(user.id)}
      </strong>

    </div>


    <div class="profile-row">

      <span>
        Role
      </span>

      <strong>
        ${escapeHTML(role)}
      </strong>

    </div>


    ${adminButton}

  `;

}


async function loadOrders(user) {

  ordersContainer.innerHTML = `
    <div class="orders-loading">
      Loading orders...
    </div>
  `;


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
          limited_id,
          thumbnail_url
        )
      )
    `)
    .eq("user_id", user.id)
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

        <h3>
          Unable to load orders
        </h3>

        <p>
          ${escapeHTML(error.message)}
        </p>

      </div>

    `;


    return;

  }


  const orderList =
    orders || [];


  if (!orderList.length) {

    ordersContainer.innerHTML = `

      <div class="orders-empty">

        <h3>
          No orders yet
        </h3>

        <p>
          Your purchases will appear here.
        </p>

        <a href="./store.html">
          Browse Products
        </a>

      </div>

    `;


    return;

  }


  ordersContainer.innerHTML =
    orderList.map(order => {

      const items =
        order.order_items || [];


      const itemsHTML =
        items.map(item => {

          const product =
            item.products;


          const image =
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
              `;


          const itemTotal =
            Number(item.price) *
            Number(item.quantity);


          return `

            <div class="account-order-product">

              <div class="account-order-image">
                ${image}
              </div>


              <div class="account-order-product-info">

                <strong>
                  ${escapeHTML(
                    product?.name ||
                    "Product"
                  )}
                </strong>

                <span>
                  Limited ID:
                  ${escapeHTML(
                    product?.limited_id ||
                    "N/A"
                  )}
                </span>

                <span>
                  Quantity:
                  ${Number(
                    item.quantity
                  )}
                </span>

              </div>


              <strong class="account-order-price">
                RM ${itemTotal.toFixed(2)}
              </strong>

            </div>

          `;

        }).join("");


      return `

        <article class="account-order-card">

          <div class="account-order-header">

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


          <div class="account-order-status-row">

            ${statusLabel(
              order.status
            )}

          </div>


          <div class="account-order-products">

            ${itemsHTML}

          </div>


          <div class="account-order-footer">

            <div>

              <span>
                Order Total
              </span>

              <strong>
                RM ${Number(
                  order.total || 0
                ).toFixed(2)}
              </strong>

            </div>


            <a
              href="./order.html?id=${encodeURIComponent(
                order.id
              )}"
              class="view-order-button"
            >
              View Order
            </a>

          </div>

        </article>

      `;

    }).join("");

}


if (cartButton) {

  cartButton.addEventListener(
    "click",
    () => {

      window.location.href =
        "./cart.html";

    }
  );

}


if (logoutButton) {

  logoutButton.addEventListener(
    "click",
    async () => {

      await supabase.auth.signOut();

      window.location.href =
        "./login.html";

    }
  );

}


async function start() {

  updateCartCount();


  const user =
    await getUser();


  if (!user) {
    return;
  }


  await loadAccount(user);

  await loadOrders(user);

}


start();