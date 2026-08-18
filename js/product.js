import { supabase } from "./supabase.js";

const productsContainer =
  document.getElementById("productsContainer");

const cartCount =
  document.getElementById("cartCount");

let products = [];

let cart = JSON.parse(
  localStorage.getItem("lzl_cart") || "[]"
);


function updateCartCount() {
  cartCount.textContent = cart.length;
}


function saveCart() {
  localStorage.setItem(
    "lzl_cart",
    JSON.stringify(cart)
  );

  updateCartCount();
}


function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function renderProducts() {

  if (!products.length) {

    productsContainer.innerHTML = `
      <div class="empty-state">

        <h3>
          No Limiteds Available
        </h3>

        <p>
          Check back later for new products.
        </p>

      </div>
    `;

    return;
  }


  productsContainer.innerHTML =
    products.map(product => {

      const image =
        product.thumbnail_url
          ? `
            <img
              src="${escapeHTML(
                product.thumbnail_url
              )}"
              alt="${escapeHTML(
                product.name
              )}"
              loading="lazy"
            >
          `
          : `
            <div class="product-image-placeholder">
              NO IMAGE
            </div>
          `;


      return `
        <article
          class="product-card"
          data-product-id="${product.id}"
        >

          <div
            class="product-image product-open"
            data-id="${product.id}"
          >

            ${image}

          </div>


          <div class="product-card-content">

            <h3
              class="product-open"
              data-id="${product.id}"
            >
              ${escapeHTML(
                product.name
              )}
            </h3>


            <span class="product-limited-id">
              Limited ID:
              ${escapeHTML(
                product.limited_id || "N/A"
              )}
            </span>


            <div class="product-card-bottom">

              <div>

                <span class="product-price-label">
                  Price
                </span>

                <span class="product-price">
                  RM ${Number(
                    product.price
                  ).toFixed(2)}
                </span>

              </div>


              <span class="product-stock">
                ${product.stock} available
              </span>

            </div>


            <button
              class="product-buy-button"
              data-id="${product.id}"
              type="button"
              ${product.stock <= 0 ? "disabled" : ""}
            >
              ${
                product.stock > 0
                  ? "Add to Cart"
                  : "Sold Out"
              }
            </button>

          </div>

        </article>
      `;

    }).join("");


  document
    .querySelectorAll(".product-open")
    .forEach(element => {

      element.addEventListener(
        "click",
        () => {

          const id =
            element.dataset.id;

          window.location.href =
            `./product.html?id=${encodeURIComponent(id)}`;

        }
      );

    });


  document
    .querySelectorAll(".product-buy-button")
    .forEach(button => {

      button.addEventListener(
        "click",
        event => {

          event.stopPropagation();

          const product =
            products.find(
              item =>
                String(item.id) ===
                String(button.dataset.id)
            );

          if (!product) {
            return;
          }

          addToCart(product);

        }
      );

    });
}


function addToCart(product) {

  const existing =
    cart.find(
      item =>
        String(item.id) ===
        String(product.id)
    );


  if (existing) {

    alert(
      "This product is already in your cart."
    );

    return;
  }


  cart.push({

    id: product.id,

    name: product.name,

    price: product.price,

    thumbnail_url:
      product.thumbnail_url,

    quantity: 1

  });


  saveCart();


  alert(
    `${product.name} added to cart.`
  );
}


async function loadProducts() {

  productsContainer.innerHTML = `
    <div class="loading-state">

      <div class="loading-spinner"></div>

      <p>
        Loading products...
      </p>

    </div>
  `;


  const {
    data,
    error
  } = await supabase

    .from("products")

    .select(`
      id,
      name,
      limited_id,
      description,
      price,
      stock,
      category,
      seller_name,
      thumbnail_url,
      item_url,
      status,
      created_at
    `)

    .eq("status", "active")

    .gt("stock", 0)

    .order("created_at", {
      ascending: false
    });


  if (error) {

    console.error(error);


    productsContainer.innerHTML = `
      <div class="empty-state">

        <h3>
          Unable to Load Store
        </h3>

        <p>
          ${escapeHTML(
            error.message
          )}
        </p>

      </div>
    `;

    return;
  }


  products = data || [];

  renderProducts();
}


document
  .getElementById("shopNowButton")
  .addEventListener(
    "click",
    () => {

      document
        .querySelector(".store-content")
        .scrollIntoView({
          behavior: "smooth"
        });

    }
  );


document
  .getElementById("cartButton")
  .addEventListener(
    "click",
    () => {

      alert(
        `Your cart contains ${cart.length} item(s).`
      );

    }
  );


document
  .getElementById("accountButton")
  .addEventListener(
    "click",
    () => {

      window.location.href =
        "./login.html";

    }
  );


updateCartCount();

loadProducts();