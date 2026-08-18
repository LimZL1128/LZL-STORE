import { supabase } from "./supabase.js";


const orderContainer =
  document.getElementById(
    "orderContainer"
  );

const cartCount =
  document.getElementById(
    "cartCount"
  );

const cartButton =
  document.getElementById(
    "cartButton"
  );

const accountButton =
  document.getElementById(
    "accountButton"
  );


const params =
  new URLSearchParams(
    window.location.search
  );


const orderId =
  params.get("id");


let cart = JSON.parse(
  localStorage.getItem(
    "lzl_cart"
  ) || "[]"
);


function escapeHTML(value) {

  return String(
    value ?? ""
  )
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );

}


function updateCartCount() {

  if (cartCount) {

    cartCount.textContent =
      cart.reduce(
        (
          total,
          item
        ) =>
          total +
          Number(
            item.quantity || 1
          ),
        0
      );

  }

}


function formatDate(value) {

  if (!value) {
    return "Not available";
  }


  return new Date(
    value
  ).toLocaleString(
    "en-MY",
    {
      dateStyle:
        "long",

      timeStyle:
        "short"
    }
  );

}


function getStatusData(status) {

  const value =
    String(
      status || "pending"
    ).toLowerCase();


  if (
    value === "paid"
  ) {

    return {
      title:
        "Payment Confirmed",

      text:
        "Your payment has been verified. LZL Store will prepare your order next.",

      className:
        "paid",

      icon:
        "✓"
    };

  }


  if (
    value === "processing"
  ) {

    return {
      title:
        "Order Processing",

      text:
        "Your Roblox Limited delivery is currently being prepared.",

      className:
        "processing",

      icon:
        "→"
    };

  }


  if (
    value === "completed"
  ) {

    return {
      title:
        "Order Completed",

      text:
        "Your Roblox Limited delivery has been completed.",

      className:
        "completed",

      icon:
        "✓"
    };

  }


  if (
    value === "cancelled"
  ) {

    return {
      title:
        "Order Cancelled",

      text:
        "This order has been cancelled.",

      className:
        "cancelled",

      icon:
        "×"
    };

  }


  return {
    title:
      "Waiting for Payment Verification",

    text:
      "Your payment submission is waiting for verification by LZL Store.",

    className:
      "pending",

    icon:
      "●"
  };

}


async function getCurrentUser() {

  const {
    data: {
      user
    },
    error
  } =
    await supabase.auth.getUser();


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


async function loadOrder(user) {

  if (!orderId) {

    orderContainer.innerHTML = `

      <div class="order-error">

        <h2>
          Order not found
        </h2>

        <p>
          No order ID was provided.
        </p>

        <a
          href="./account.html#myOrders"
        >
          Back to My Orders
        </a>

      </div>

    `;

    return;

  }


  const {
    data: order,
    error
  } =
    await supabase
      .from("orders")
      .select(`

        id,
        user_id,
        roblox_username,
        total,
        status,
        created_at,

        payment_method,
        payment_reference,
        payment_submitted_at,
        payment_verified_at,

        delivery_proof_url,
        delivery_proof_uploaded_at,

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
      .eq(
        "id",
        orderId
      )
      .eq(
        "user_id",
        user.id
      )
      .single();


  if (
    error ||
    !order
  ) {

    console.error(
      error
    );


    orderContainer.innerHTML = `

      <div class="order-error">

        <h2>
          Order unavailable
        </h2>

        <p>
          This order does not exist or does not belong to your account.
        </p>

        <a
          href="./account.html#myOrders"
        >
          Back to My Orders
        </a>

      </div>

    `;

    return;

  }


  renderOrder(
    order
  );

}


function buildDeliveryProof(
  order
) {

  if (
    order.delivery_proof_url
  ) {

    return `

      <section class="order-card">

        <div class="order-card-header">

          <p>
            DELIVERY PROOF
          </p>

          <h2>
            Delivery Screenshot
          </h2>

        </div>


        <div class="delivery-proof-content">

          <div class="delivery-proof-frame">

            <a
              href="${escapeHTML(
                order.delivery_proof_url
              )}"
              target="_blank"
              rel="noopener noreferrer"
            >

              <img
                src="${escapeHTML(
                  order.delivery_proof_url
                )}"
                class="delivery-proof-image"
                alt="LZL Store delivery proof"
              >

            </a>


            <div class="delivery-proof-meta">

              <div>

                <span>
                  Proof Status
                </span>

                <strong>
                  Delivery Proof Uploaded
                </strong>

              </div>


              <div>

                <span>
                  Uploaded
                </span>

                <strong>
                  ${escapeHTML(
                    formatDate(
                      order.delivery_proof_uploaded_at
                    )
                  )}
                </strong>

              </div>


              <a
                href="${escapeHTML(
                  order.delivery_proof_url
                )}"
                target="_blank"
                rel="noopener noreferrer"
                class="open-proof-button"
              >
                Open Full Screenshot
              </a>

            </div>

          </div>

        </div>

      </section>

    `;

  }


  if (
    order.status ===
    "processing"
  ) {

    return `

      <section class="order-card">

        <div class="order-card-header">

          <p>
            DELIVERY PROOF
          </p>

          <h2>
            Delivery Screenshot
          </h2>

        </div>


        <div class="delivery-proof-waiting">

          LZL Store is processing your delivery. Proof will appear here after delivery.

        </div>

      </section>

    `;

  }


  return "";

}


function renderOrder(order) {

  document.title =
    `LZL Store | Order ${order.id.slice(
      0,
      8
    )}`;


  const status =
    getStatusData(
      order.status
    );


  const items =
    order.order_items ||
    [];


  const totalQuantity =
    items.reduce(
      (
        total,
        item
      ) =>
        total +
        Number(
          item.quantity || 0
        ),
      0
    );


  const itemsHTML =
    items.map(
      item => {

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
              <div class="order-no-image">
                NO IMAGE
              </div>
            `;


        const itemTotal =
          Number(
            item.price
          ) *
          Number(
            item.quantity
          );


        return `

          <div class="order-product">

            <div class="order-product-image">

              ${image}

            </div>


            <div class="order-product-info">

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


            <strong class="order-product-price">

              RM ${itemTotal.toFixed(
                2
              )}

            </strong>

          </div>

        `;

      }
    ).join("");


  const paymentReference =
    order.payment_reference ||
    "Not submitted";


  const paymentSubmitted =
    order.payment_submitted_at

      ? formatDate(
          order.payment_submitted_at
        )

      : "Not submitted";


  const paymentVerified =
    order.payment_verified_at

      ? formatDate(
          order.payment_verified_at
        )

      : "Waiting for verification";


  const robloxUsername =
    order.roblox_username ||
    "Not provided";


  const proofHTML =
    buildDeliveryProof(
      order
    );


  orderContainer.innerHTML = `

    <section class="order-hero">

      <div>

        <p class="order-eyebrow">
          ORDER
        </p>

        <h1>
          Order Details
        </h1>

        <p class="order-id">
          ${escapeHTML(
            order.id
          )}
        </p>

      </div>


      <div class="order-date">

        ${escapeHTML(
          formatDate(
            order.created_at
          )
        )}

      </div>

    </section>


    <section
      class="order-status-card status-${escapeHTML(
        status.className
      )}"
    >

      <div class="status-icon">

        ${escapeHTML(
          status.icon
        )}

      </div>


      <div>

        <strong>
          ${escapeHTML(
            status.title
          )}
        </strong>

        <p>
          ${escapeHTML(
            status.text
          )}
        </p>

      </div>

    </section>


    <section class="order-grid">


      <div class="order-main">


        <section class="order-card">

          <div class="order-card-header">

            <p>
              ITEMS
            </p>

            <h2>
              Products
            </h2>

          </div>


          <div class="order-products">

            ${itemsHTML}

          </div>

        </section>


        <section class="order-card">

          <div class="order-card-header">

            <p>
              DELIVERY ACCOUNT
            </p>

            <h2>
              Roblox Account
            </h2>

          </div>


          <div class="delivery-account">

            <div class="delivery-account-box">

              <div>

                <span>
                  Roblox Username
                </span>

                <strong>
                  ${escapeHTML(
                    robloxUsername
                  )}
                </strong>

              </div>

            </div>

          </div>

        </section>


        <section class="order-card">

          <div class="order-card-header">

            <p>
              PAYMENT
            </p>

            <h2>
              Touch 'n Go eWallet
            </h2>

          </div>


          <div class="payment-details">


            <div>

              <span>
                Payment Method
              </span>

              <strong>
                TNG eWallet
              </strong>

            </div>


            <div>

              <span>
                Payment Status
              </span>

              <strong>
                ${escapeHTML(
                  status.title
                )}
              </strong>

            </div>


            <div>

              <span>
                Transaction Reference
              </span>

              <strong class="payment-reference-value">

                ${escapeHTML(
                  paymentReference
                )}

              </strong>

            </div>


            <div>

              <span>
                Submitted
              </span>

              <strong>

                ${escapeHTML(
                  paymentSubmitted
                )}

              </strong>

            </div>


            <div>

              <span>
                Verified
              </span>

              <strong>

                ${escapeHTML(
                  paymentVerified
                )}

              </strong>

            </div>


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


          </div>

        </section>


        ${proofHTML}


      </div>


      <aside class="order-summary">

        <p class="order-eyebrow">
          SUMMARY
        </p>

        <h2>
          Order Summary
        </h2>


        <div class="summary-line">

          <span>
            Items
          </span>

          <strong>
            ${totalQuantity}
          </strong>

        </div>


        <div class="summary-divider">
        </div>


        <div class="summary-total">

          <span>
            Total
          </span>

          <strong>

            RM ${Number(
              order.total || 0
            ).toFixed(2)}

          </strong>

        </div>


        <div class="summary-status">

          ${escapeHTML(
            status.title
          )}

        </div>


        <a
          href="./account.html#myOrders"
          class="orders-link"
        >
          My Orders
        </a>

      </aside>


    </section>

  `;

}


if (
  cartButton
) {

  cartButton.addEventListener(
    "click",
    () => {

      window.location.href =
        "./cart.html";

    }
  );

}


if (
  accountButton
) {

  accountButton.addEventListener(
    "click",
    () => {

      window.location.href =
        "./account.html";

    }
  );

}


async function start() {

  updateCartCount();


  const user =
    await getCurrentUser();


  if (!user) {
    return;
  }


  await loadOrder(
    user
  );

}


start();