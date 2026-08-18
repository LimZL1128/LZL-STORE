import { supabase } from "./supabase.js";

const checkoutItems =
  document.getElementById("checkoutItems");

const cartCount =
  document.getElementById("cartCount");

const customerStatus =
  document.getElementById("customerStatus");

const summaryItems =
  document.getElementById("summaryItems");

const summarySubtotal =
  document.getElementById("summarySubtotal");

const summaryTotal =
  document.getElementById("summaryTotal");

const tngAmount =
  document.getElementById("tngAmount");

const robloxUsername =
  document.getElementById("robloxUsername");

const paymentReference =
  document.getElementById("paymentReference");

const paymentConfirmed =
  document.getElementById("paymentConfirmed");

const placeOrderButton =
  document.getElementById("placeOrderButton");

const checkoutMessage =
  document.getElementById("checkoutMessage");

const cartButton =
  document.getElementById("cartButton");

const accountButton =
  document.getElementById("accountButton");


let cart = JSON.parse(
  localStorage.getItem("lzl_cart") || "[]"
);

let currentUser = null;
let orderCreated = false;


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


function getLocalSubtotal() {

  return cart.reduce(
    (total, item) =>
      total +
      Number(item.price || 0) *
      Number(item.quantity || 1),
    0
  );
}


function renderItems() {

  if (!cart.length) {

    checkoutItems.innerHTML = `
      <div class="checkout-empty">

        <h3>
          Your cart is empty.
        </h3>

        <p>
          Add a product before checkout.
        </p>

      </div>
    `;

    summaryItems.textContent =
      "0";

    summarySubtotal.textContent =
      "RM 0.00";

    summaryTotal.textContent =
      "RM 0.00";

    tngAmount.textContent =
      "RM 0.00";

    placeOrderButton.disabled =
      true;

    return;
  }


  checkoutItems.innerHTML =
    cart.map(item => {

      const quantity =
        Number(item.quantity || 1);

      const total =
        Number(item.price || 0) *
        quantity;

      const image =
        item.thumbnail_url
          ? `
            <img
              src="${escapeHTML(item.thumbnail_url)}"
              alt="${escapeHTML(item.name)}"
            >
          `
          : `
            <div>
              NO IMAGE
            </div>
          `;


      return `
        <div class="checkout-item">

          <div class="checkout-item-image">
            ${image}
          </div>

          <div class="checkout-item-info">

            <h3>
              ${escapeHTML(item.name)}
            </h3>

            <span>
              Quantity: ${quantity}
            </span>

          </div>

          <strong>
            RM ${total.toFixed(2)}
          </strong>

        </div>
      `;

    }).join("");


  const subtotal =
    getLocalSubtotal();


  summaryItems.textContent =
    cart.reduce(
      (total, item) =>
        total +
        Number(item.quantity || 1),
      0
    );


  summarySubtotal.textContent =
    `RM ${subtotal.toFixed(2)}`;


  summaryTotal.textContent =
    `RM ${subtotal.toFixed(2)}`;


  tngAmount.textContent =
    `RM ${subtotal.toFixed(2)}`;
}


async function checkCustomer() {

  const {
    data,
    error
  } = await supabase.auth.getUser();


  if (
    error ||
    !data.user
  ) {

    currentUser =
      null;

    customerStatus.innerHTML = `
      <div class="login-required">

        <h3>
          Customer account required
        </h3>

        <p>
          Sign in before placing your order.
        </p>

        <a href="./login.html">
          Sign In
        </a>

      </div>
    `;

    placeOrderButton.disabled =
      true;

    return;
  }


  currentUser =
    data.user;


  customerStatus.innerHTML = `
    <div class="customer-logged-in">

      <span>
        Signed in as
      </span>

      <strong>
        ${escapeHTML(currentUser.email)}
      </strong>

    </div>
  `;
}


async function verifyProducts() {

  const productIds =
    cart.map(
      item => item.id
    );


  const {
    data: products,
    error
  } = await supabase
    .from("products")
    .select(`
      id,
      name,
      price,
      stock,
      status
    `)
    .in(
      "id",
      productIds
    );


  if (error) {

    console.error(error);

    return {
      success: false,
      message:
        "Unable to verify products."
    };
  }


  const verifiedItems = [];


  for (const cartItem of cart) {

    const product =
      products.find(
        item =>
          String(item.id) ===
          String(cartItem.id)
      );


    if (
      !product ||
      product.status !== "active"
    ) {

      return {
        success: false,
        message:
          `${cartItem.name} is unavailable.`
      };
    }


    const quantity =
      Number(
        cartItem.quantity || 1
      );


    if (
      quantity < 1 ||
      Number(product.stock) <
      quantity
    ) {

      return {
        success: false,
        message:
          `${product.name} does not have enough stock.`
      };
    }


    verifiedItems.push({
      id: product.id,
      name: product.name,
      quantity,
      price:
        Number(product.price)
    });
  }


  const total =
    verifiedItems.reduce(
      (sum, item) =>
        sum +
        item.price *
        item.quantity,
      0
    );


  return {
    success: true,
    items: verifiedItems,
    total
  };
}


async function placeOrder() {

  checkoutMessage.textContent =
    "";


  if (orderCreated) {
    return;
  }


  if (!currentUser) {

    checkoutMessage.textContent =
      "Sign in before placing your order.";

    return;
  }


  if (!cart.length) {

    checkoutMessage.textContent =
      "Your cart is empty.";

    return;
  }


  const username =
    robloxUsername.value.trim();


  if (
    username.length < 3
  ) {

    checkoutMessage.textContent =
      "Enter your Roblox username.";

    robloxUsername.focus();

    return;
  }


  const reference =
    paymentReference.value.trim();


  if (
    reference.length < 4
  ) {

    checkoutMessage.textContent =
      "Enter your TNG transaction reference.";

    paymentReference.focus();

    return;
  }


  if (
    !paymentConfirmed.checked
  ) {

    checkoutMessage.textContent =
      "Confirm your payment first.";

    return;
  }


  placeOrderButton.disabled =
    true;


  placeOrderButton.textContent =
    "Verifying Order...";


  const verification =
    await verifyProducts();


  if (
    !verification.success
  ) {

    checkoutMessage.textContent =
      verification.message;

    placeOrderButton.disabled =
      false;

    placeOrderButton.textContent =
      "Submit Payment & Place Order";

    return;
  }


  const submittedAt =
    new Date().toISOString();


  const {
    data: order,
    error: orderError
  } = await supabase
    .from("orders")
    .insert({

      user_id:
        currentUser.id,

      roblox_username:
        username,

      total:
        verification.total,

      status:
        "pending",

      payment_method:
        "tng",

      payment_reference:
        reference,

      payment_submitted_at:
        submittedAt

    })
    .select()
    .single();


  if (orderError) {

    console.error(orderError);

    checkoutMessage.textContent =
      orderError.message;

    placeOrderButton.disabled =
      false;

    placeOrderButton.textContent =
      "Submit Payment & Place Order";

    return;
  }


  const orderItems =
    verification.items.map(
      item => ({

        order_id:
          order.id,

        product_id:
          item.id,

        quantity:
          item.quantity,

        price:
          item.price

      })
    );


  const {
    error: itemsError
  } = await supabase
    .from("order_items")
    .insert(orderItems);


  if (itemsError) {

    console.error(itemsError);

    checkoutMessage.textContent =
      itemsError.message;

    return;
  }


  orderCreated =
    true;


  localStorage.removeItem(
    "lzl_cart"
  );


  cart = [];


  updateCartCount();


  checkoutMessage.innerHTML = `
    <div class="order-success">

      <div class="success-icon">
        ✓
      </div>

      <h3>
        Order submitted.
      </h3>

      <p>
        Roblox Username
      </p>

      <strong>
        ${escapeHTML(username)}
      </strong>

      <p>
        Order ID
      </p>

      <strong class="success-order-id">
        ${escapeHTML(order.id)}
      </strong>

      <p>
        TNG Reference
      </p>

      <strong>
        ${escapeHTML(reference)}
      </strong>

      <p class="success-note">
        Payment verification is pending.
      </p>

      <a
        href="./order.html?id=${encodeURIComponent(order.id)}"
        class="view-created-order"
      >
        View Order
      </a>

    </div>
  `;


  placeOrderButton.textContent =
    "Order Submitted";


  placeOrderButton.disabled =
    true;
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


if (accountButton) {

  accountButton.addEventListener(
    "click",
    () => {

      window.location.href =
        "./account.html";

    }
  );
}


if (placeOrderButton) {

  placeOrderButton.addEventListener(
    "click",
    placeOrder
  );
}


updateCartCount();

renderItems();

checkCustomer();