import { supabase } from "./supabase.js";


let products = [];
let currentUser = null;


const dashboardSection =
  document.getElementById("dashboardSection");

const productsSection =
  document.getElementById("productsSection");

const archiveSection =
  document.getElementById("archiveSection");

const customersSection =
  document.getElementById("customersSection");

const settingsSection =
  document.getElementById("settingsSection");

const pageTitle =
  document.getElementById("pageTitle");

const productForm =
  document.getElementById("productForm");

const productModal =
  document.getElementById("productModal");

const productMessage =
  document.getElementById("productMessage");

const saveProductButton =
  document.getElementById("saveProductButton");

const productImageInput =
  document.getElementById("productImage");

const thumbnailUrlInput =
  document.getElementById("thumbnailUrl");

const productImagePreview =
  document.getElementById(
    "productImagePreview"
  );

const productImagePreviewImg =
  document.getElementById(
    "productImagePreviewImg"
  );

const productImageFileName =
  document.getElementById(
    "productImageFileName"
  );

const removeProductImageButton =
  document.getElementById(
    "removeProductImageButton"
  );


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
    data: {
      user
    },
    error: userError
  } =
    await supabase.auth.getUser();


  if (
    userError ||
    !user
  ) {

    window.location.href =
      "./login.html";

    return null;
  }


  const {
    data: profile,
    error
  } =
    await supabase
      .from("profiles")
      .select("role")
      .eq(
        "id",
        user.id
      )
      .single();


  if (
    error ||
    !profile ||
    profile.role !== "admin"
  ) {

    await supabase.auth.signOut();

    window.location.href =
      "./login.html";

    return null;
  }


  currentUser =
    user;


  const adminEmail =
    document.getElementById(
      "adminEmail"
    );


  if (adminEmail) {

    adminEmail.textContent =
      user.email ||
      "Admin";
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
    archiveSection,
    customersSection,
    settingsSection
  ].forEach(item => {

    if (item) {

      item.classList.add(
        "hidden"
      );
    }

  });


  if (section) {

    section.classList.remove(
      "hidden"
    );
  }


  if (pageTitle) {

    pageTitle.textContent =
      title;
  }


  document
    .querySelectorAll(
      ".sidebar-nav .nav-item"
    )
    .forEach(item => {

      item.classList.remove(
        "active"
      );

    });


  if (activeButton) {

    activeButton.classList.add(
      "active"
    );
  }
}


function getActiveProducts() {

  return products.filter(
    product =>
      product.status !==
      "archived"
  );
}


function getArchivedProducts() {

  return products.filter(
    product =>
      product.status ===
      "archived"
  );
}


async function loadStats() {

  const [
    ordersResult,
    profilesResult
  ] =
    await Promise.all([

      supabase
        .from("orders")
        .select(
          "id,total,status"
        ),

      supabase
        .from("profiles")
        .select(
          "id,role"
        )

    ]);


  const orders =
    ordersResult.data ||
    [];


  const profiles =
    profilesResult.data ||
    [];


  const customers =
    profiles.filter(
      profile =>
        profile.role !==
        "admin"
    );


  const revenue =
    orders.reduce(
      (
        total,
        order
      ) => {

        const status =
          String(
            order.status ||
            ""
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
          Number(
            order.total ||
            0
          )
        );

      },
      0
    );


  const orderCount =
    document.getElementById(
      "orderCount"
    );

  const customerCount =
    document.getElementById(
      "customerCount"
    );

  const revenueCount =
    document.getElementById(
      "revenueCount"
    );


  if (orderCount) {

    orderCount.textContent =
      orders.length;
  }


  if (customerCount) {

    customerCount.textContent =
      customers.length;
  }


  if (revenueCount) {

    revenueCount.textContent =
      `RM ${revenue.toFixed(2)}`;
  }
}


async function loadProducts() {

  const {
    data,
    error
  } =
    await supabase
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

    return;
  }


  products =
    data ||
    [];


  updateProductCounts();

  renderProducts();

  renderArchive();
}


function updateProductCounts() {

  const activeProducts =
    getActiveProducts();

  const archivedProducts =
    getArchivedProducts();


  const productCount =
    document.getElementById(
      "productCount"
    );

  const archivedCount =
    document.getElementById(
      "archivedCount"
    );

  const archiveCountBadge =
    document.getElementById(
      "archiveCountBadge"
    );


  if (productCount) {

    productCount.textContent =
      activeProducts.length;
  }


  if (archivedCount) {

    archivedCount.textContent =
      archivedProducts.length;
  }


  if (archiveCountBadge) {

    archiveCountBadge.textContent =
      archivedProducts.length;
  }
}


function getProductCardHTML(
  product
) {

  const category =
    String(
      product.category ||
      "toy"
    ).toLowerCase();


  const imageHTML =
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
    <article class="product-card">

      <div class="product-image">

        ${imageHTML}

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
                product.price ||
                0
              ).toFixed(2)}
            </strong>

          </div>


          <div>

            <span>
              Stock
            </span>

            <strong>
              ${Number(
                product.stock ||
                0
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
}


function renderProducts() {

  const visibleProducts =
    getActiveProducts();


  let html;


  if (!visibleProducts.length) {

    html = `
      <div class="empty-state">

        <div class="empty-icon">
          +
        </div>

        <h4>
          No products
        </h4>

        <p>
          Create a product or restore one from Archive.
        </p>

      </div>
    `;

  } else {

    html =
      visibleProducts
        .map(
          getProductCardHTML
        )
        .join("");
  }


  const dashboardContainer =
    document.getElementById(
      "productsContainer"
    );

  const productsPageContainer =
    document.getElementById(
      "productsPageContainer"
    );


  const className =
    visibleProducts.length
      ? "products-container product-grid"
      : "products-container";


  if (dashboardContainer) {

    dashboardContainer.className =
      className;

    dashboardContainer.innerHTML =
      html;
  }


  if (productsPageContainer) {

    productsPageContainer.className =
      className;

    productsPageContainer.innerHTML =
      html;
  }


  bindProductButtons();
}


function renderArchive() {

  const archivedProducts =
    getArchivedProducts();


  const container =
    document.getElementById(
      "archiveContainer"
    );


  if (!container) {

    return;
  }


  if (!archivedProducts.length) {

    container.className =
      "products-container";

    container.innerHTML = `
      <div class="empty-state">

        <h4>
          No archived listings
        </h4>

        <p>
          Archived products will appear here.
        </p>

      </div>
    `;

    return;
  }


  container.className =
    "products-container product-grid";


  container.innerHTML =
    archivedProducts
      .map(product => {

        const imageHTML =
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
          <article class="product-card">

            <div class="product-image">
              ${imageHTML}
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


                <span class="status-badge archived">
                  Archived
                </span>

              </div>


              <div class="product-details">

                <div>

                  <span>
                    Price
                  </span>

                  <strong>
                    RM ${Number(
                      product.price ||
                      0
                    ).toFixed(2)}
                  </strong>

                </div>


                <div>

                  <span>
                    Stock
                  </span>

                  <strong>
                    ${Number(
                      product.stock ||
                      0
                    )}
                  </strong>

                </div>

              </div>


              <div class="product-actions">

                <button
                  class="restore-product"
                  data-id="${escapeHTML(
                    product.id
                  )}"
                  type="button"
                >
                  Restore
                </button>


                <button
                  class="delete-archived-product"
                  data-id="${escapeHTML(
                    product.id
                  )}"
                  type="button"
                >
                  Delete Permanently
                </button>

              </div>

            </div>

          </article>
        `;

      })
      .join("");


  bindArchiveButtons();
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
                String(
                  item.id
                ) ===
                String(
                  button.dataset.id
                )
            );


          if (product) {

            openEditModal(
              product
            );
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


function bindArchiveButtons() {

  document
    .querySelectorAll(
      ".restore-product"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          restoreProduct(
            button.dataset.id
          );

        }
      );

    });


  document
    .querySelectorAll(
      ".delete-archived-product"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          deleteArchivedProduct(
            button.dataset.id
          );

        }
      );

    });
}


async function restoreProduct(
  id
) {

  const product =
    products.find(
      item =>
        String(item.id) ===
        String(id)
    );


  if (!product) {

    return;
  }


  const confirmed =
    confirm(
      `Restore "${product.name}" to the store?`
    );


  if (!confirmed) {

    return;
  }


  const {
    error
  } =
    await supabase
      .from("products")
      .update({
        status: "active"
      })
      .eq(
        "id",
        id
      );


  if (error) {

    alert(
      error.message
    );

    return;
  }


  await loadProducts();


  alert(
    `"${product.name}" restored.`
  );
}


async function getProductOrderCount(
  productId
) {

  const {
    data,
    error
  } =
    await supabase
      .from("order_items")
      .select("order_id")
      .eq(
        "product_id",
        productId
      );


  if (error) {

    throw error;
  }


  const orderIds =
    new Set(
      (data || [])
        .map(
          item =>
            item.order_id
        )
        .filter(Boolean)
    );


  return orderIds.size;
}


async function archiveProduct(
  id
) {

  const product =
    products.find(
      item =>
        String(item.id) ===
        String(id)
    );


  if (!product) {

    return;
  }


  const {
    error
  } =
    await supabase
      .from("products")
      .update({
        status: "archived",
        is_hot: false
      })
      .eq(
        "id",
        id
      );


  if (error) {

    throw error;
  }


  await loadProducts();


  alert(
    `"${product.name}" archived.`
  );
}


async function permanentlyDelete(
  id
) {

  const product =
    products.find(
      item =>
        String(item.id) ===
        String(id)
    );


  if (!product) {

    return;
  }


  const orderCount =
    await getProductOrderCount(
      id
    );


  let message =
    `Permanently delete "${product.name}"?`;


  if (orderCount > 0) {

    message +=
      `\n\nThis listing is connected to ${orderCount} order${orderCount === 1 ? "" : "s"}.`;

    message +=
      "\nLinked order item records will also be deleted.";
  }


  message +=
    "\n\nThis action cannot be reversed.";


  const confirmed =
    confirm(
      message
    );


  if (!confirmed) {

    return;
  }


  if (orderCount > 0) {

    const {
      error:
        orderItemsError
    } =
      await supabase
        .from("order_items")
        .delete()
        .eq(
          "product_id",
          id
        );


    if (orderItemsError) {

      throw orderItemsError;
    }
  }


  const {
    error
  } =
    await supabase
      .from("products")
      .delete()
      .eq(
        "id",
        id
      );


  if (error) {

    throw error;
  }


  await loadProducts();


  alert(
    `"${product.name}" permanently deleted.`
  );
}


async function deleteProduct(
  id
) {

  const product =
    products.find(
      item =>
        String(item.id) ===
        String(id)
    );


  if (!product) {

    return;
  }


  const choice =
    prompt(
      `Manage "${product.name}"\n\nType:\nARCHIVE to archive listing\nDELETE to permanently delete\nCANCEL to cancel`
    );


  if (!choice) {

    return;
  }


  const action =
    choice
      .trim()
      .toUpperCase();


  try {

    if (
      action === "ARCHIVE"
    ) {

      await archiveProduct(
        id
      );

      return;
    }


    if (
      action === "DELETE"
    ) {

      await permanentlyDelete(
        id
      );

      return;
    }

  } catch (error) {

    console.error(error);

    alert(
      error.message
    );
  }
}


async function deleteArchivedProduct(
  id
) {

  try {

    await permanentlyDelete(
      id
    );

  } catch (error) {

    console.error(error);

    alert(
      error.message
    );
  }
}


async function loadCustomers() {

  const container =
    document.getElementById(
      "customersContainer"
    );


  if (!container) {

    return;
  }


  const {
    data: profiles,
    error
  } =
    await supabase
      .from("profiles")
      .select(
        "id,role"
      );


  if (error) {

    container.innerHTML =
      error.message;

    return;
  }


  const customers =
    (profiles || [])
      .filter(
        profile =>
          profile.role !==
          "admin"
      );


  if (!customers.length) {

    container.innerHTML = `
      <div class="empty-state">

        <h4>
          No customers yet
        </h4>

      </div>
    `;

    return;
  }


  container.className =
    "products-container product-grid";


  container.innerHTML =
    customers
      .map(customer => `
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

          </div>

        </article>
      `)
      .join("");
}


function resetImagePreview() {

  if (productImageInput) {

    productImageInput.value =
      "";
  }


  if (thumbnailUrlInput) {

    thumbnailUrlInput.value =
      "";
  }


  if (productImagePreviewImg) {

    productImagePreviewImg
      .removeAttribute(
        "src"
      );
  }


  if (productImagePreview) {

    productImagePreview
      .classList.add(
        "hidden"
      );
  }
}


function showImagePreview(
  url,
  fileName =
    "Current image"
) {

  if (!url) {

    resetImagePreview();

    return;
  }


  productImagePreviewImg.src =
    url;

  productImageFileName.textContent =
    fileName;

  productImagePreview
    .classList.remove(
      "hidden"
    );
}


function openCreateModal() {

  productForm.reset();


  document.getElementById(
    "editingProductId"
  ).value =
    "";


  document.getElementById(
    "productStatus"
  ).value =
    "active";


  document.getElementById(
    "category"
  ).value =
    "toy";


  document.getElementById(
    "isHot"
  ).checked =
    false;


  saveProductButton.textContent =
    "Create Product";


  productMessage.textContent =
    "";


  resetImagePreview();


  productModal
    .classList.remove(
      "hidden"
    );
}


function openEditModal(
  product
) {

  document.getElementById(
    "editingProductId"
  ).value =
    product.id;


  document.getElementById(
    "productName"
  ).value =
    product.name ||
    "";


  document.getElementById(
    "limitedId"
  ).value =
    product.limited_id ||
    "";


  document.getElementById(
    "description"
  ).value =
    product.description ||
    "";


  document.getElementById(
    "price"
  ).value =
    product.price ??
    "";


  document.getElementById(
    "stock"
  ).value =
    product.stock ??
    "";


  document.getElementById(
    "category"
  ).value =
    product.category ||
    "toy";


  document.getElementById(
    "sellerName"
  ).value =
    product.seller_name ||
    "";


  document.getElementById(
    "itemUrl"
  ).value =
    product.item_url ||
    "";


  document.getElementById(
    "productStatus"
  ).value =
    product.status ||
    "active";


  document.getElementById(
    "isHot"
  ).checked =
    product.is_hot ===
    true;


  thumbnailUrlInput.value =
    product.thumbnail_url ||
    "";


  if (
    product.thumbnail_url
  ) {

    showImagePreview(
      product.thumbnail_url
    );

  } else {

    resetImagePreview();
  }


  saveProductButton.textContent =
    "Save Changes";


  productModal
    .classList.remove(
      "hidden"
    );
}


function closeModal() {

  productModal
    .classList.add(
      "hidden"
    );


  productForm.reset();

  resetImagePreview();
}


function getFileExtension(
  file
) {

  const extension =
    String(
      file.name ||
      ""
    )
      .split(".")
      .pop()
      .toLowerCase();


  if (
    [
      "jpg",
      "jpeg",
      "png",
      "webp"
    ].includes(
      extension
    )
  ) {

    return extension;
  }


  return "jpg";
}


async function uploadProductImage(
  file
) {

  if (!currentUser) {

    throw new Error(
      "Admin session not found."
    );
  }


  const extension =
    getFileExtension(
      file
    );


  const id =
    typeof crypto.randomUUID ===
    "function"
      ? crypto.randomUUID()
      : String(
          Date.now()
        );


  const filePath =
    `${currentUser.id}/${Date.now()}-${id}.${extension}`;


  const {
    error
  } =
    await supabase.storage
      .from(
        "product-images"
      )
      .upload(
        filePath,
        file
      );


  if (error) {

    throw error;
  }


  const {
    data
  } =
    supabase.storage
      .from(
        "product-images"
      )
      .getPublicUrl(
        filePath
      );


  return data.publicUrl;
}


async function saveProduct(
  event
) {

  event.preventDefault();


  const editingId =
    document.getElementById(
      "editingProductId"
    ).value;


  saveProductButton.disabled =
    true;


  try {

    let imageUrl =
      thumbnailUrlInput.value;


    const file =
      productImageInput
        .files?.[0];


    if (file) {

      imageUrl =
        await uploadProductImage(
          file
        );
    }


    const status =
      document.getElementById(
        "productStatus"
      ).value;


    const productData = {

      name:
        document.getElementById(
          "productName"
        ).value.trim(),

      limited_id:
        document.getElementById(
          "limitedId"
        ).value.trim(),

      description:
        document.getElementById(
          "description"
        ).value.trim(),

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
        document.getElementById(
          "sellerName"
        ).value.trim(),

      thumbnail_url:
        imageUrl,

      item_url:
        document.getElementById(
          "itemUrl"
        ).value.trim(),

      status,

      is_hot:
        status === "archived"
          ? false
          : document.getElementById(
              "isHot"
            ).checked
    };


    let result;


    if (editingId) {

      result =
        await supabase
          .from("products")
          .update(
            productData
          )
          .eq(
            "id",
            editingId
          );

    } else {

      result =
        await supabase
          .from("products")
          .insert(
            productData
          );
    }


    if (result.error) {

      throw result.error;
    }


    await loadProducts();


    productMessage.textContent =
      editingId
        ? "Product updated."
        : "Product created.";


    setTimeout(
      closeModal,
      500
    );

  } catch (error) {

    console.error(error);

    productMessage.textContent =
      error.message;

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

  const archiveNav =
    document.getElementById(
      "archiveNav"
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


  archiveNav.addEventListener(
    "click",
    () => {

      showSection(
        archiveSection,
        "Archive",
        archiveNav
      );


      renderArchive();

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

  productImageInput
    .addEventListener(
      "change",
      () => {

        const file =
          productImageInput
            .files?.[0];


        if (!file) {

          return;
        }


        showImagePreview(
          URL.createObjectURL(
            file
          ),
          file.name
        );

      }
    );


  removeProductImageButton
    .addEventListener(
      "click",
      resetImagePreview
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


  document.getElementById(
    "createProductButton"
  ).addEventListener(
    "click",
    openCreateModal
  );


  document.getElementById(
    "createProductButtonSecondary"
  ).addEventListener(
    "click",
    openCreateModal
  );


  document.getElementById(
    "productsCreateButton"
  ).addEventListener(
    "click",
    openCreateModal
  );


  document.getElementById(
    "closeModalButton"
  ).addEventListener(
    "click",
    closeModal
  );


  document.getElementById(
    "cancelProductButton"
  ).addEventListener(
    "click",
    closeModal
  );


  document.getElementById(
    "modalOverlay"
  ).addEventListener(
    "click",
    closeModal
  );


  productForm.addEventListener(
    "submit",
    saveProduct
  );


  document.getElementById(
    "logoutButton"
  ).addEventListener(
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