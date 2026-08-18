import { supabase } from "./supabase.js";


const productsContainer =
  document.getElementById("productsContainer");

const cartCount =
  document.getElementById("cartCount");

const inventorySection =
  document.getElementById("inventorySection");

const inventoryEyebrow =
  document.getElementById("inventoryEyebrow");

const inventoryTitle =
  document.getElementById("inventoryTitle");

const inventoryDescription =
  document.getElementById("inventoryDescription");

const resultsCount =
  document.getElementById("resultsCount");

const activeFilterBadge =
  document.getElementById("activeFilterBadge");

const resetFiltersButton =
  document.getElementById("resetFiltersButton");

const storeNavButton =
  document.getElementById("storeNavButton");

const toyNavButton =
  document.getElementById("toyNavButton");

const gameNavButton =
  document.getElementById("gameNavButton");

const hotNavButton =
  document.getElementById("hotNavButton");

const newNavButton =
  document.getElementById("newNavButton");

const searchButton =
  document.getElementById("searchButton");

const cartButton =
  document.getElementById("cartButton");

const accountButton =
  document.getElementById("accountButton");

const shopNowButton =
  document.getElementById("shopNowButton");

const heroHotButton =
  document.getElementById("heroHotButton");

const sortButton =
  document.getElementById("sortButton");

const sortButtonText =
  document.getElementById("sortButtonText");

const searchPanel =
  document.getElementById("searchPanel");

const searchInput =
  document.getElementById("searchInput");

const clearSearchButton =
  document.getElementById("clearSearchButton");

const closeSearchButton =
  document.getElementById("closeSearchButton");

const toast =
  document.getElementById("toast");


let products = [];

let currentFilter = "all";

let currentSearch = "";

let newestFirst = true;

let toastTimer = null;


let cart =
  JSON.parse(
    localStorage.getItem("lzl_cart") ||
    "[]"
  );


function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function showToast(message) {
  if (!toast) {
    return;
  }

  clearTimeout(toastTimer);

  toast.textContent =
    message;

  toast.classList.add(
    "show"
  );

  toastTimer =
    setTimeout(() => {
      toast.classList.remove(
        "show"
      );
    }, 2200);
}


function updateCartCount() {
  if (!cartCount) {
    return;
  }

  const total =
    cart.reduce(
      (sum, item) => {
        return (
          sum +
          Number(
            item.quantity || 1
          )
        );
      },
      0
    );

  cartCount.textContent =
    total;
}


function saveCart() {
  localStorage.setItem(
    "lzl_cart",
    JSON.stringify(cart)
  );

  updateCartCount();
}


function scrollToInventory() {
  inventorySection?.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}


function setActiveFilterButtons() {
  document
    .querySelectorAll(
      ".store-nav-button"
    )
    .forEach(button => {
      button.classList.toggle(
        "active",
        button.dataset.filter ===
          currentFilter
      );
    });

  document
    .querySelectorAll(
      ".category-filter"
    )
    .forEach(button => {
      button.classList.toggle(
        "active",
        button.dataset.filter ===
          currentFilter
      );
    });
}


function getFilterLabel() {
  if (currentFilter === "toy") {
    return "Toy";
  }

  if (currentFilter === "game") {
    return "Game";
  }

  if (currentFilter === "hot") {
    return "Hot";
  }

  if (currentFilter === "new") {
    return "New";
  }

  return "All";
}


function updateSectionText() {
  const label =
    getFilterLabel();

  activeFilterBadge.textContent =
    label;

  if (currentSearch) {
    inventoryEyebrow.textContent =
      "SEARCH";

    inventoryTitle.textContent =
      `Results for "${currentSearch}"`;

    inventoryDescription.textContent =
      "Listings starting with your search.";

    return;
  }

  if (currentFilter === "toy") {
    inventoryEyebrow.textContent =
      "TOY";

    inventoryTitle.textContent =
      "Toy Listings";

    inventoryDescription.textContent =
      "Browse products listed under Toy.";

    return;
  }

  if (currentFilter === "game") {
    inventoryEyebrow.textContent =
      "GAME";

    inventoryTitle.textContent =
      "Game Listings";

    inventoryDescription.textContent =
      "Browse products listed under Game.";

    return;
  }

  if (currentFilter === "hot") {
    inventoryEyebrow.textContent =
      "HOT PICKS";

    inventoryTitle.textContent =
      "Hot Products";

    inventoryDescription.textContent =
      "Listings marked Hot by LZL Store.";

    return;
  }

  if (currentFilter === "new") {
    inventoryEyebrow.textContent =
      "NEW";

    inventoryTitle.textContent =
      "Newest Products";

    inventoryDescription.textContent =
      "Recently added listings.";

    return;
  }

  inventoryEyebrow.textContent =
    "INVENTORY";

  inventoryTitle.textContent =
    "All Products";

  inventoryDescription.textContent =
    "Browse products currently available from LZL Store.";
}


function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}


function getFilteredProducts() {
  let visible =
    [...products];


  if (currentFilter === "toy") {
    visible =
      visible.filter(product => {
        return (
          normalizeText(
            product.category
          ) === "toy"
        );
      });
  }


  if (currentFilter === "game") {
    visible =
      visible.filter(product => {
        return (
          normalizeText(
            product.category
          ) === "game"
        );
      });
  }


  if (currentFilter === "hot") {
    visible =
      visible.filter(product => {
        return (
          product.is_hot === true
        );
      });
  }


  if (currentSearch) {
    const query =
      normalizeText(
        currentSearch
      );


    visible =
      visible.filter(product => {
        const name =
          normalizeText(
            product.name
          );


        return name.startsWith(
          query
        );
      });


    visible.sort(
      (productA, productB) => {
        const nameA =
          normalizeText(
            productA.name
          );

        const nameB =
          normalizeText(
            productB.name
          );


        return nameA.localeCompare(
          nameB
        );
      }
    );


    return visible;
  }


  visible.sort(
    (productA, productB) => {
      const dateA =
        new Date(
          productA.created_at || 0
        ).getTime();

      const dateB =
        new Date(
          productB.created_at || 0
        ).getTime();


      return newestFirst
        ? dateB - dateA
        : dateA - dateB;
    }
  );


  return visible;
}


function getEmptyMessage() {
  if (currentSearch) {
    return {
      title:
        "No Search Results",

      text:
        `No product starts with "${currentSearch}".`
    };
  }

  if (currentFilter === "toy") {
    return {
      title:
        "No Toy Products",

      text:
        "Toy listings will appear here."
    };
  }

  if (currentFilter === "game") {
    return {
      title:
        "No Game Products",

      text:
        "Game listings will appear here."
    };
  }

  if (currentFilter === "hot") {
    return {
      title:
        "No Hot Products",

      text:
        "Products marked Hot in Admin will appear here."
    };
  }

  if (currentFilter === "new") {
    return {
      title:
        "No New Products",

      text:
        "Recently created products will appear here."
    };
  }

  return {
    title:
      "No Products Available",

    text:
      "Check back later."
  };
}


function renderProducts() {
  const visibleProducts =
    getFilteredProducts();

  setActiveFilterButtons();

  updateSectionText();

  resultsCount.textContent =
    `${visibleProducts.length} ${
      visibleProducts.length === 1
        ? "product"
        : "products"
    }`;

  resetFiltersButton.classList.toggle(
    "hidden",
    currentFilter === "all" &&
    !currentSearch
  );

  if (!visibleProducts.length) {
    const empty =
      getEmptyMessage();

    productsContainer.innerHTML = `
      <div class="empty-state">

        <h3>
          ${escapeHTML(
            empty.title
          )}
        </h3>

        <p>
          ${escapeHTML(
            empty.text
          )}
        </p>

      </div>
    `;

    return;
  }


  productsContainer.innerHTML =
    visibleProducts
      .map(product => {
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


        const soldOut =
          normalizeText(
            product.status
          ) === "sold_out" ||
          Number(
            product.stock || 0
          ) <= 0;


        const category =
          normalizeText(
            product.category || "toy"
          );


        const showNewBadge =
          currentFilter === "new";


        return `
          <article
            class="product-card"
            data-product-id="${escapeHTML(
              product.id
            )}"
          >

            <div class="product-image">

              ${image}

              <div class="product-badge-stack">

                <span
                  class="product-category category-${escapeHTML(
                    category
                  )}"
                >
                  ${escapeHTML(
                    category
                  )}
                </span>

                ${
                  product.is_hot
                    ? `
                      <span class="product-hot-badge">
                        HOT
                      </span>
                    `
                    : ""
                }

                ${
                  showNewBadge
                    ? `
                      <span class="product-new-badge">
                        NEW
                      </span>
                    `
                    : ""
                }

              </div>

            </div>


            <div class="product-card-content">

              <h3>
                ${escapeHTML(
                  product.name
                )}
              </h3>


              <span class="product-limited-id">

                Product ID:
                ${escapeHTML(
                  product.limited_id ||
                  "N/A"
                )}

              </span>


              ${
                product.description
                  ? `
                    <p class="product-description">
                      ${escapeHTML(
                        product.description
                      )}
                    </p>
                  `
                  : ""
              }


              <div class="product-card-bottom">

                <div>

                  <span class="product-price-label">
                    Price
                  </span>

                  <span class="product-price">

                    RM ${Number(
                      product.price || 0
                    ).toFixed(2)}

                  </span>

                </div>


                <span class="product-stock">

                  ${
                    soldOut
                      ? "Sold Out"
                      : `${Number(
                          product.stock || 0
                        )} available`
                  }

                </span>

              </div>


              <button
                class="product-buy-button"
                data-id="${escapeHTML(
                  product.id
                )}"
                type="button"
                ${
                  soldOut
                    ? "disabled"
                    : ""
                }
              >

                ${
                  soldOut
                    ? "Sold Out"
                    : "Add to Cart"
                }

              </button>

            </div>

          </article>
        `;
      })
      .join("");


  bindProductEvents();
}


function bindProductEvents() {
  document
    .querySelectorAll(
      ".product-buy-button"
    )
    .forEach(button => {
      button.addEventListener(
        "click",
        event => {
          event.stopPropagation();


          if (button.disabled) {
            return;
          }


          const product =
            products.find(item => {
              return (
                String(item.id) ===
                String(
                  button.dataset.id
                )
              );
            });


          if (!product) {
            return;
          }


          if (
            normalizeText(
              product.status
            ) !== "active" ||
            Number(
              product.stock || 0
            ) <= 0
          ) {
            showToast(
              "This product is unavailable."
            );

            return;
          }


          addToCart(product);
        }
      );
    });


  document
    .querySelectorAll(
      ".product-card"
    )
    .forEach(card => {
      card.addEventListener(
        "click",
        event => {
          if (
            event.target.closest(
              ".product-buy-button"
            )
          ) {
            return;
          }


          const productId =
            card.dataset.productId;


          if (!productId) {
            return;
          }


          window.location.href =
            `./product.html?id=${encodeURIComponent(
              productId
            )}`;
        }
      );
    });
}


function addToCart(product) {
  const existing =
    cart.find(item => {
      return (
        String(item.id) ===
        String(product.id)
      );
    });


  if (existing) {
    showToast(
      "This product is already in your cart."
    );

    return;
  }


  cart.push({
    id:
      product.id,

    name:
      product.name,

    price:
      Number(
        product.price || 0
      ),

    thumbnail_url:
      product.thumbnail_url,

    quantity:
      1
  });


  saveCart();


  showToast(
    `${product.name} added to cart.`
  );
}


async function loadProducts() {
  productsContainer.innerHTML = `
    <div class="loading-state">

      <div class="loading-spinner">
      </div>

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
      is_hot,
      created_at
    `)
    .in(
      "status",
      [
        "active",
        "sold_out"
      ]
    )
    .order(
      "created_at",
      {
        ascending: false
      }
    );


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


  products =
    data || [];


  renderProducts();
}


function setFilter(
  filter,
  scroll = true
) {
  currentFilter =
    filter;

  currentSearch = "";


  if (searchInput) {
    searchInput.value = "";
  }


  clearSearchButton?.classList.add(
    "hidden"
  );


  if (filter === "new") {
    newestFirst = true;

    sortButtonText.textContent =
      "Latest";
  }


  renderProducts();


  const hash =
    filter === "all"
      ? ""
      : `#${filter}`;


  history.replaceState(
    null,
    "",
    `${window.location.pathname}${hash}`
  );


  if (scroll) {
    scrollToInventory();
  }
}


function openSearch() {
  searchPanel.classList.remove(
    "hidden"
  );


  setTimeout(
    () => {
      searchInput.focus();
    },
    50
  );
}


function closeSearch() {
  searchPanel.classList.add(
    "hidden"
  );
}


function clearSearch() {
  currentSearch = "";

  searchInput.value = "";

  clearSearchButton.classList.add(
    "hidden"
  );

  renderProducts();
}


storeNavButton.addEventListener(
  "click",
  () => {
    setFilter("all");
  }
);


toyNavButton.addEventListener(
  "click",
  () => {
    setFilter("toy");
  }
);


gameNavButton.addEventListener(
  "click",
  () => {
    setFilter("game");
  }
);


hotNavButton.addEventListener(
  "click",
  () => {
    setFilter("hot");
  }
);


newNavButton.addEventListener(
  "click",
  () => {
    setFilter("new");
  }
);


document
  .querySelectorAll(
    ".category-filter"
  )
  .forEach(button => {
    button.addEventListener(
      "click",
      () => {
        setFilter(
          button.dataset.filter
        );
      }
    );
  });


document
  .querySelectorAll(
    ".hero-category"
  )
  .forEach(button => {
    button.addEventListener(
      "click",
      () => {
        setFilter(
          button.dataset.category
        );
      }
    );
  });


shopNowButton.addEventListener(
  "click",
  () => {
    setFilter("all");
  }
);


heroHotButton.addEventListener(
  "click",
  () => {
    setFilter("hot");
  }
);


searchButton.addEventListener(
  "click",
  openSearch
);


closeSearchButton.addEventListener(
  "click",
  closeSearch
);


searchInput.addEventListener(
  "input",
  () => {
    currentSearch =
      normalizeText(
        searchInput.value
      );


    clearSearchButton.classList.toggle(
      "hidden",
      !currentSearch
    );


    renderProducts();
  }
);


searchInput.addEventListener(
  "keydown",
  event => {
    if (
      event.key === "Escape"
    ) {
      closeSearch();
    }
  }
);


clearSearchButton.addEventListener(
  "click",
  clearSearch
);


resetFiltersButton.addEventListener(
  "click",
  () => {
    currentSearch = "";

    searchInput.value = "";

    setFilter(
      "all"
    );
  }
);


sortButton.addEventListener(
  "click",
  () => {
    newestFirst =
      !newestFirst;


    sortButtonText.textContent =
      newestFirst
        ? "Latest"
        : "Oldest";


    renderProducts();
  }
);


cartButton.addEventListener(
  "click",
  () => {
    window.location.href =
      "./cart.html";
  }
);


accountButton.addEventListener(
  "click",
  () => {
    window.location.href =
      "./account.html";
  }
);


function loadInitialFilter() {
  const hash =
    window.location.hash
      .replace("#", "")
      .trim()
      .toLowerCase();


  const allowedFilters = [
    "toy",
    "game",
    "hot",
    "new"
  ];


  if (
    allowedFilters.includes(
      hash
    )
  ) {
    currentFilter =
      hash;
  } else {
    currentFilter =
      "all";
  }


  setActiveFilterButtons();
}


updateCartCount();

loadInitialFilter();

loadProducts();