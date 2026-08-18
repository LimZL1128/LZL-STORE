import { supabase } from "./supabase.js";

let products = [];
let currentUser = null;

const dashboardSection = document.getElementById("dashboardSection");
const productsSection = document.getElementById("productsSection");
const customersSection = document.getElementById("customersSection");
const settingsSection = document.getElementById("settingsSection");

const pageTitle = document.getElementById("pageTitle");

const productForm = document.getElementById("productForm");
const productModal = document.getElementById("productModal");
const productMessage = document.getElementById("productMessage");

const saveProductButton =
  document.getElementById("saveProductButton");

const productImageInput =
  document.getElementById("productImage");

const thumbnailUrlInput =
  document.getElementById("thumbnailUrl");

const productImagePreview =
  document.getElementById("productImagePreview");

const productImagePreviewImg =
  document.getElementById("productImagePreviewImg");

const productImageFileName =
  document.getElementById("productImageFileName");

const removeProductImageButton =
  document.getElementById("removeProductImageButton");


function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


async function protectAdminPage() {
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    window.location.href = "./login.html";
    return null;
  }

  const {
    data: profile,
    error
  } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (
    error ||
    !profile ||
    profile.role !== "admin"
  ) {
    await supabase.auth.signOut();

    window.location.href = "./login.html";

    return null;
  }

  currentUser = user;

  const adminEmail =
    document.getElementById("adminEmail");

  if (adminEmail) {
    adminEmail.textContent =
      user.email || "Admin";
  }

  return user;
}


function showSection(
  section,
  title,
  activeButton
) {
  [
    dashboardSection,
    productsSection,
    customersSection,
    settingsSection
  ].forEach(item => {
    item.classList.add("hidden");
  });

  section.classList.remove("hidden");

  pageTitle.textContent = title;

  document
    .querySelectorAll(
      ".sidebar-nav .nav-item"
    )
    .forEach(item => {
      item.classList.remove("active");
    });

  activeButton.classList.add("active");
}


async function loadStats() {
  const [
    {
      data: orders,
      error: ordersError
    },
    {
      data: profiles,
      error: profilesError
    }
  ] = await Promise.all([
    supabase
      .from("orders")
      .select("id,total,status"),

    supabase
      .from("profiles")
      .select("id,role")
  ]);

  if (ordersError) {
    console.error(ordersError);
  }

  if (profilesError) {
    console.error(profilesError);
  }

  const orderList =
    orders || [];

  const customerList =
    (profiles || []).filter(
      profile =>
        profile.role !== "admin"
    );

  const revenue =
    orderList.reduce(
      (total, order) => {
        const status =
          String(
            order.status || ""
          ).toLowerCase();

        if (
          status !== "paid" &&
          status !== "processing" &&
          status !== "completed"
        ) {
          return total;
        }

        return (
          total +
          Number(order.total || 0)
        );
      },
      0
    );

  document.getElementById(
    "orderCount"
  ).textContent =
    orderList.length;

  document.getElementById(
    "customerCount"
  ).textContent =
    customerList.length;

  document.getElementById(
    "revenueCount"
  ).textContent =
    `RM ${revenue.toFixed(2)}`;
}


async function loadProducts() {
  const {
    data,
    error
  } = await supabase
    .from("products")
    .select("*")
    .order(
      "created_at",
      {
        ascending: false
      }
    );

  if (error) {
    console.error(error);

    const errorHTML = `
      <div class="empty-state">

        <h4>
          Unable to load products
        </h4>

        <p>
          ${escapeHTML(error.message)}
        </p>

      </div>
    `;

    document.getElementById(
      "productsContainer"
    ).innerHTML =
      errorHTML;

    document.getElementById(
      "productsPageContainer"
    ).innerHTML =
      errorHTML;

    return;
  }

  products = data || [];

  document.getElementById(
    "productCount"
  ).textContent =
    products.length;

  renderProducts();
}


function getProductsHTML() {
  if (!products.length) {
    return `
      <div class="empty-state">

        <div class="empty-icon">
          +
        </div>

        <h4>
          No products yet
        </h4>

        <p>
          Add your first product to your store.
        </p>

      </div>
    `;
  }

  return products
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

      const category =
        String(
          product.category || "toy"
        ).toLowerCase();

      return `
        <article class="product-card">

          <div class="product-image">

            ${image}

            ${
              product.is_hot
                ? `
                  <span class="admin-hot-badge">
                    HOT
                  </span>
                `
                : ""
            }

          </div>


          <div class="product-info">

            <div class="product-top">

              <div>

                <h4>
                  ${escapeHTML(
                    product.name
                  )}
                </h4>

                <span class="product-id">
                  Product ID:
                  ${escapeHTML(
                    product.limited_id ||
                    "N/A"
                  )}
                </span>

              </div>


              <span
                class="status-badge ${escapeHTML(
                  product.status ||
                  "active"
                )}"
              >
                ${escapeHTML(
                  product.status ||
                  "active"
                )}
              </span>

            </div>


            <div class="product-meta-row">

              <span
                class="category-badge category-${escapeHTML(
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
                    <span class="hot-mini-badge">
                      Hot
                    </span>
                  `
                  : ""
              }

            </div>


            <div class="product-details">

              <div>

                <span>
                  Price
                </span>

                <strong>
                  RM ${Number(
                    product.price || 0
                  ).toFixed(2)}
                </strong>

              </div>


              <div>

                <span>
                  Stock
                </span>

                <strong>
                  ${Number(
                    product.stock || 0
                  )}
                </strong>

              </div>

            </div>


            <div class="product-actions">

              <button
                class="edit-product"
                data-id="${escapeHTML(
                  product.id
                )}"
                type="button"
              >
                Edit
              </button>

              <button
                class="delete-product"
                data-id="${escapeHTML(
                  product.id
                )}"
                type="button"
              >
                Delete
              </button>

            </div>

          </div>

        </article>
      `;
    })
    .join("");
}


function renderProducts() {
  const html =
    getProductsHTML();

  const dashboardContainer =
    document.getElementById(
      "productsContainer"
    );

  const productsPageContainer =
    document.getElementById(
      "productsPageContainer"
    );

  const className =
    products.length
      ? "products-container product-grid"
      : "products-container";

  dashboardContainer.className =
    className;

  productsPageContainer.className =
    className;

  dashboardContainer.innerHTML =
    html;

  productsPageContainer.innerHTML =
    html;

  bindProductButtons();
}


function bindProductButtons() {
  document
    .querySelectorAll(
      ".edit-product"
    )
    .forEach(button => {
      button.addEventListener(
        "click",
        () => {
          const product =
            products.find(
              item =>
                String(item.id) ===
                String(
                  button.dataset.id
                )
            );

          if (product) {
            openEditModal(product);
          }
        }
      );
    });

  document
    .querySelectorAll(
      ".delete-product"
    )
    .forEach(button => {
      button.addEventListener(
        "click",
        () => {
          deleteProduct(
            button.dataset.id
          );
        }
      );
    });
}


async function loadCustomers() {
  const container =
    document.getElementById(
      "customersContainer"
    );

  container.innerHTML = `
    <div class="empty-state">

      <h4>
        Loading customers...
      </h4>

    </div>
  `;

  const {
    data: profiles,
    error
  } = await supabase
    .from("profiles")
    .select("id,role");

  if (error) {
    container.innerHTML = `
      <div class="empty-state">

        <h4>
          Unable to load customers
        </h4>

        <p>
          ${escapeHTML(error.message)}
        </p>

      </div>
    `;

    return;
  }

  const customers =
    (profiles || []).filter(
      profile =>
        profile.role !== "admin"
    );

  if (!customers.length) {
    container.innerHTML = `
      <div class="empty-state">

        <h4>
          No customers yet
        </h4>

        <p>
          Customer accounts will appear here.
        </p>

      </div>
    `;

    return;
  }

  const {
    data: orders,
    error: ordersError
  } = await supabase
    .from("orders")
    .select(
      "id,user_id,total,status"
    );

  if (ordersError) {
    console.error(ordersError);
  }

  const orderList =
    orders || [];

  container.className =
    "products-container product-grid";

  container.innerHTML =
    customers
      .map(customer => {
        const customerOrders =
          orderList.filter(
            order =>
              String(
                order.user_id
              ) ===
              String(
                customer.id
              )
          );

        const totalSpent =
          customerOrders.reduce(
            (total, order) => {
              if (
                String(
                  order.status || ""
                ).toLowerCase() !==
                "completed"
              ) {
                return total;
              }

              return (
                total +
                Number(
                  order.total || 0
                )
              );
            },
            0
          );

        return `
          <article class="product-card">

            <div class="product-info">

              <div class="product-top">

                <div>

                  <h4>
                    Customer
                  </h4>

                  <span class="product-id">
                    ${escapeHTML(
                      customer.id
                    )}
                  </span>

                </div>

                <span class="status-badge active">
                  Customer
                </span>

              </div>


              <div class="product-details">

                <div>

                  <span>
                    Orders
                  </span>

                  <strong>
                    ${customerOrders.length}
                  </strong>

                </div>

                <div>

                  <span>
                    Completed Spend
                  </span>

                  <strong>
                    RM ${totalSpent.toFixed(
                      2
                    )}
                  </strong>

                </div>

              </div>

            </div>

          </article>
        `;
      })
      .join("");
}


async function deleteProduct(id) {
  const product =
    products.find(
      item =>
        String(item.id) ===
        String(id)
    );

  const productName =
    product?.name ||
    "this product";

  const confirmed =
    confirm(
      `Delete "${productName}" permanently?\n\nProducts connected to existing orders cannot be deleted.`
    );

  if (!confirmed) {
    return;
  }

  const {
    error
  } = await supabase
    .from("products")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(error);

    if (
      error.code === "23503" ||
      error.message.includes(
        "order_items_product_id_fkey"
      )
    ) {
      alert(
        "This product is connected to an existing order and cannot be deleted."
      );

      return;
    }

    alert(
      `Unable to delete product:\n${error.message}`
    );

    return;
  }

  await loadProducts();
}


function resetImagePreview() {
  if (productImageInput) {
    productImageInput.value = "";
  }

  if (thumbnailUrlInput) {
    thumbnailUrlInput.value = "";
  }

  if (productImagePreviewImg) {
    productImagePreviewImg.removeAttribute(
      "src"
    );
  }

  if (productImageFileName) {
    productImageFileName.textContent =
      "Current image";
  }

  productImagePreview?.classList.add(
    "hidden"
  );
}


function showImagePreview(
  url,
  fileName = "Current image"
) {
  if (!url) {
    resetImagePreview();
    return;
  }

  productImagePreviewImg.src =
    url;

  productImageFileName.textContent =
    fileName;

  productImagePreview.classList.remove(
    "hidden"
  );
}


function openCreateModal() {
  productForm.reset();

  document.getElementById(
    "editingProductId"
  ).value = "";

  document.getElementById(
    "productStatus"
  ).value = "active";

  document.getElementById(
    "category"
  ).value = "toy";

  document.getElementById(
    "isHot"
  ).checked = false;

  saveProductButton.textContent =
    "Create Product";

  productMessage.textContent = "";
  productMessage.style.color = "";

  resetImagePreview();

  productModal.classList.remove(
    "hidden"
  );
}


function openEditModal(product) {
  document.getElementById(
    "editingProductId"
  ).value =
    product.id;

  document.getElementById(
    "productName"
  ).value =
    product.name || "";

  document.getElementById(
    "limitedId"
  ).value =
    product.limited_id || "";

  document.getElementById(
    "description"
  ).value =
    product.description || "";

  document.getElementById(
    "price"
  ).value =
    product.price ?? "";

  document.getElementById(
    "stock"
  ).value =
    product.stock ?? "";

  const category =
    String(
      product.category || "toy"
    ).toLowerCase();

  document.getElementById(
    "category"
  ).value =
    category === "game"
      ? "game"
      : "toy";

  document.getElementById(
    "sellerName"
  ).value =
    product.seller_name || "";

  document.getElementById(
    "itemUrl"
  ).value =
    product.item_url || "";

  document.getElementById(
    "productStatus"
  ).value =
    product.status || "active";

  document.getElementById(
    "isHot"
  ).checked =
    product.is_hot === true;

  thumbnailUrlInput.value =
    product.thumbnail_url || "";

  productImageInput.value = "";

  if (product.thumbnail_url) {
    showImagePreview(
      product.thumbnail_url,
      "Current product image"
    );
  } else {
    productImagePreview.classList.add(
      "hidden"
    );
  }

  saveProductButton.textContent =
    "Save Changes";

  productMessage.textContent = "";
  productMessage.style.color = "";

  productModal.classList.remove(
    "hidden"
  );
}


function closeModal() {
  productModal.classList.add(
    "hidden"
  );

  productForm.reset();

  document.getElementById(
    "editingProductId"
  ).value = "";

  saveProductButton.textContent =
    "Create Product";

  productMessage.textContent = "";
  productMessage.style.color = "";

  resetImagePreview();
}


function getFileExtension(file) {
  const name =
    String(file.name || "");

  const extension =
    name.includes(".")
      ? name
          .split(".")
          .pop()
          .toLowerCase()
      : "";

  if (
    [
      "jpg",
      "jpeg",
      "png",
      "webp"
    ].includes(extension)
  ) {
    return extension;
  }

  if (
    file.type === "image/png"
  ) {
    return "png";
  }

  if (
    file.type === "image/webp"
  ) {
    return "webp";
  }

  return "jpg";
}


async function uploadProductImage(file) {
  if (!currentUser) {
    throw new Error(
      "Admin session not found."
    );
  }

  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp"
  ];

  if (
    !allowedTypes.includes(
      file.type
    )
  ) {
    throw new Error(
      "Use a JPG, PNG, or WEBP image."
    );
  }

  if (
    file.size >
    5 * 1024 * 1024
  ) {
    throw new Error(
      "Product image must stay below 5 MB."
    );
  }

  const extension =
    getFileExtension(file);

  const uniqueId =
    typeof crypto.randomUUID ===
    "function"
      ? crypto.randomUUID()
      : String(Date.now());

  const filePath =
    `${currentUser.id}/${Date.now()}-${uniqueId}.${extension}`;

  const {
    error: uploadError
  } = await supabase.storage
    .from("product-images")
    .upload(
      filePath,
      file,
      {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type
      }
    );

  if (uploadError) {
    throw uploadError;
  }

  const {
    data: publicData
  } = supabase.storage
    .from("product-images")
    .getPublicUrl(filePath);

  const publicUrl =
    publicData?.publicUrl;

  if (!publicUrl) {
    throw new Error(
      "Product image URL was not generated."
    );
  }

  return publicUrl;
}


async function saveProduct(event) {
  event.preventDefault();

  const editingId =
    document.getElementById(
      "editingProductId"
    ).value;

  productMessage.style.color = "";

  productMessage.textContent =
    productImageInput.files?.[0]
      ? "Uploading image..."
      : editingId
        ? "Saving changes..."
        : "Creating product...";

  saveProductButton.disabled = true;

  try {
    let imageUrl =
      thumbnailUrlInput.value.trim();

    const imageFile =
      productImageInput.files?.[0];

    if (imageFile) {
      imageUrl =
        await uploadProductImage(
          imageFile
        );
    }

    const productData = {
      name:
        document
          .getElementById(
            "productName"
          )
          .value.trim(),

      limited_id:
        document
          .getElementById(
            "limitedId"
          )
          .value.trim(),

      description:
        document
          .getElementById(
            "description"
          )
          .value.trim(),

      price:
        Number(
          document.getElementById(
            "price"
          ).value
        ),

      stock:
        Number(
          document.getElementById(
            "stock"
          ).value
        ),

      category:
        document.getElementById(
          "category"
        ).value,

      seller_name:
        document
          .getElementById(
            "sellerName"
          )
          .value.trim(),

      thumbnail_url:
        imageUrl,

      item_url:
        document
          .getElementById(
            "itemUrl"
          )
          .value.trim(),

      status:
        document.getElementById(
          "productStatus"
        ).value,

      is_hot:
        document.getElementById(
          "isHot"
        ).checked
    };

    let result;

    if (editingId) {
      result = await supabase
        .from("products")
        .update(productData)
        .eq(
          "id",
          editingId
        );
    } else {
      result = await supabase
        .from("products")
        .insert(productData);
    }

    if (result.error) {
      throw result.error;
    }

    productMessage.style.color =
      "#7cff9b";

    productMessage.textContent =
      editingId
        ? "Product updated successfully."
        : "Product created successfully.";

    await Promise.all([
      loadProducts(),
      loadStats()
    ]);

    setTimeout(
      closeModal,
      650
    );

  } catch (error) {
    console.error(error);

    productMessage.style.color =
      "#ff8f8f";

    productMessage.textContent =
      error.message ||
      "Unable to save product.";

  } finally {
    saveProductButton.disabled =
      false;
  }
}


function setupNavigation() {
  const dashboardNav =
    document.getElementById(
      "dashboardNav"
    );

  const productsNav =
    document.getElementById(
      "productsNav"
    );

  const customersNav =
    document.getElementById(
      "customersNav"
    );

  const settingsNav =
    document.getElementById(
      "settingsNav"
    );

  dashboardNav.addEventListener(
    "click",
    () => {
      showSection(
        dashboardSection,
        "Dashboard",
        dashboardNav
      );
    }
  );

  productsNav.addEventListener(
    "click",
    () => {
      showSection(
        productsSection,
        "Products",
        productsNav
      );
    }
  );

  customersNav.addEventListener(
    "click",
    async () => {
      showSection(
        customersSection,
        "Customers",
        customersNav
      );

      await loadCustomers();
    }
  );

  settingsNav.addEventListener(
    "click",
    () => {
      showSection(
        settingsSection,
        "Settings",
        settingsNav
      );
    }
  );
}


function setupImageUpload() {
  productImageInput.addEventListener(
    "change",
    () => {
      const file =
        productImageInput.files?.[0];

      if (!file) {
        return;
      }

      const previewUrl =
        URL.createObjectURL(file);

      showImagePreview(
        previewUrl,
        file.name
      );
    }
  );

  removeProductImageButton.addEventListener(
    "click",
    () => {
      resetImagePreview();
    }
  );
}


async function start() {
  const user =
    await protectAdminPage();

  if (!user) {
    return;
  }

  setupNavigation();
  setupImageUpload();

  document
    .getElementById(
      "createProductButton"
    )
    .addEventListener(
      "click",
      openCreateModal
    );

  document
    .getElementById(
      "createProductButtonSecondary"
    )
    .addEventListener(
      "click",
      openCreateModal
    );

  document
    .getElementById(
      "productsCreateButton"
    )
    .addEventListener(
      "click",
      openCreateModal
    );

  document
    .getElementById(
      "closeModalButton"
    )
    .addEventListener(
      "click",
      closeModal
    );

  document
    .getElementById(
      "cancelProductButton"
    )
    .addEventListener(
      "click",
      closeModal
    );

  document
    .getElementById(
      "modalOverlay"
    )
    .addEventListener(
      "click",
      closeModal
    );

  productForm.addEventListener(
    "submit",
    saveProduct
  );

  document
    .getElementById(
      "logoutButton"
    )
    .addEventListener(
      "click",
      async () => {
        await supabase.auth.signOut();

        window.location.href =
          "./login.html";
      }
    );

  await Promise.all([
    loadProducts(),
    loadStats()
  ]);
}


start();