import { supabase } from "./supabase.js";

const cartContainer =
  document.getElementById(
    "cartContainer"
  );


let cart = JSON.parse(
  localStorage.getItem(
    "lzl_cart"
  ) || "[]"
);


function escapeHTML(value) {

  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function saveCart() {

  localStorage.setItem(
    "lzl_cart",
    JSON.stringify(cart)
  );
}


function renderCart() {

  if (!cart.length) {

    cartContainer.innerHTML = `

      <div class="cart-empty">

        <h2>
          Your cart is empty
        </h2>

        <p>
          Add a product before checking out.
        </p>

        <a
          href="./store.html"
          class="cart-shop-button"
        >
          Continue Shopping
        </a>

      </div>

    `;

    return;
  }


  let total = 0;


  const itemsHTML =
    cart.map((item, index) => {

      const price =
        Number(item.price) || 0;

      const quantity =
        Number(item.quantity) || 1;

      const itemTotal =
        price * quantity;

      total += itemTotal;


      const image =
        item.thumbnail_url

          ? `
            <img
              src="${escapeHTML(
                item.thumbnail_url
              )}"
              alt="${escapeHTML(
                item.name
              )}"
            >
          `

          : `
            <div class="cart-image-placeholder">
              NO IMAGE
            </div>
          `;


      return `

        <article class="cart-item">

          <div class="cart-item-image">
            ${image}
          </div>


          <div class="cart-item-info">

            <h3>
              ${escapeHTML(
                item.name
              )}
            </h3>

            <p>
              RM ${price.toFixed(2)}
            </p>

          </div>


          <div class="cart-item-quantity">

            <button
              class="quantity-button"
              data-action="minus"
              data-index="${index}"
              type="button"
            >
              −
            </button>

            <span>
              ${quantity}
            </span>

            <button
              class="quantity-button"
              data-action="plus"
              data-index="${index}"
              type="button"
            >
              +
            </button>

          </div>


          <strong class="cart-item-total">
            RM ${itemTotal.toFixed(2)}
          </strong>


          <button
            class="remove-cart-item"
            data-index="${index}"
            type="button"
          >
            Remove
          </button>

        </article>

      `;

    }).join("");


  cartContainer.innerHTML = `

    <div class="cart-list">

      ${itemsHTML}

    </div>


    <div class="cart-summary">

      <div class="cart-summary-row">

        <span>
          Items
        </span>

        <strong>
          ${cart.length}
        </strong>

      </div>


      <div class="cart-summary-row total">

        <span>
          Total
        </span>

        <strong>
          RM ${total.toFixed(2)}
        </strong>

      </div>


      <button
        id="checkoutButton"
        class="checkout-button"
        type="button"
      >
        Proceed to Checkout
      </button>

    </div>

  `;


  document
    .querySelectorAll(
      ".quantity-button"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const index =
            Number(
              button.dataset.index
            );

          const action =
            button.dataset.action;


          if (action === "plus") {

            cart[index].quantity += 1;

          }


          if (action === "minus") {

            cart[index].quantity -= 1;


            if (
              cart[index].quantity <= 0
            ) {

              cart.splice(
                index,
                1
              );

            }

          }


          saveCart();

          renderCart();

        }
      );

    });


  document
    .querySelectorAll(
      ".remove-cart-item"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const index =
            Number(
              button.dataset.index
            );


          cart.splice(
            index,
            1
          );


          saveCart();

          renderCart();

        }
      );

    });


  document
    .getElementById(
      "checkoutButton"
    )
    .addEventListener(
      "click",
      () => {

        window.location.href =
          "./checkout.html";

      }
    );
}


renderCart();