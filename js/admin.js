import { supabase } from "./supabase.js";


let products = [];
let currentUser = null;


const dashboardSection =
  document.getElementById(
    "dashboardSection"
  );

const productsSection =
  document.getElementById(
    "productsSection"
  );

const customersSection =
  document.getElementById(
    "customersSection"
  );

const settingsSection =
  document.getElementById(
    "settingsSection"
  );

const pageTitle =
  document.getElementById(
    "pageTitle"
  );

const productForm =
  document.getElementById(
    "productForm"
  );

const productModal =
  document.getElementById(
    "productModal"
  );

const productMessage =
  document.getElementById(
    "productMessage"
  );

const saveProductButton =
  document.getElementById(
    "saveProductButton"
  );

const productImageInput =
  document.getElementById(
    "productImage"
  );

const thumbnailUrlInput =
  document.getElementById(
    "thumbnailUrl"
  );

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


  currentUser = user;


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


  if (ordersResult.error) {

    console.error(
      ordersResult.error
    );
  }


  if (profilesResult.error) {

    console.error(
      profilesResult.error
    );
  }


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


    const errorHTML = `
      <div class="empty-state">

        <h4>
          Unable to load products
        </h4>

        <p>
          ${escapeHTML(
            error.message
          )}
        </p>

      </div>
    `;


    const dashboardContainer =
      document.getElementById(
        "productsContainer"
      );

    const pageContainer =
      document.getElementById(
        "productsPageContainer"
      );


    if (dashboardContainer) {

      dashboardContainer.innerHTML =
        errorHTML;
    }


    if (pageContainer) {

      pageContainer.innerHTML =
        errorHTML;
    }


    return;
  }


  products =
    data ||
    [];


  const productCount =
    document.getElementById(
      "productCount"
    );


  if (productCount) {

    productCount.textContent =
      products.length;
  }


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


      const hotHTML =
        product.is_hot
          ? `
            <span class="admin-hot-badge">
              HOT
            </span>
          `
          : "";


      const hotMiniHTML =
        product.is_hot
          ? `
            <span class="hot-mini-badge">
              Hot
            </span>
          `
          : "";


      return `
        <article class="product-card">

          <div class="product-image">

            ${imageHTML}

            ${hotHTML}

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

              ${hotMiniHTML}

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


async function loadCustomers() {

  const container =
    document.getElementById(
      "customersContainer"
    );


  if (!container) {
    return;
  }


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
  } =
    await supabase
      .from("profiles")
      .select(
        "id,role"
      );


  if (error) {

    console.error(error);

    container.innerHTML = `
      <div class="empty-state">

        <h4>
          Unable to load customers
        </h4>

        <p>
          ${escapeHTML(
            error.message
          )}
        </p>

      </div>
    `;

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
  } =
    await supabase
      .from("orders")
      .select(
        "id,user_id,total,status"
      );


  if (ordersError) {

    console.error(
      ordersError
    );
  }


  const orderList =
    orders ||
    [];


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
                status !==
                "completed"
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
                    RM ${totalSpent.toFixed(2)}
                  </strong>

                </div>

              </div>

            </div>

          </article>
        `;

      })
      .join("");
}


function openDeleteChoiceModal(
  productName,
  orderCount
) {

  return new Promise(
    resolve => {

      const oldModal =
        document.getElementById(
          "deleteChoiceModal"
        );


      if (oldModal) {

        oldModal.remove();
      }


      const overlay =
        document.createElement(
          "div"
        );


      overlay.id =
        "deleteChoiceModal";


      overlay.style.cssText = `
        position: fixed;
        inset: 0;
        z-index: 99999;

        display: flex;
        align-items: center;
        justify-content: center;

        padding: 20px;

        background:
          rgba(0, 0, 0, 0.82);

        backdrop-filter:
          blur(14px);
      `;


      const hasOrders =
        orderCount > 0;


      overlay.innerHTML = `
        <div
          style="
            width: min(480px, 100%);

            padding: 28px;

            border:
              1px solid
              rgba(177, 145, 255, 0.3);

            border-radius: 18px;

            background:
              linear-gradient(
                145deg,
                rgba(28, 24, 39, 0.99),
                rgba(8, 8, 12, 0.99)
              );

            box-shadow:
              0 30px 80px
              rgba(0, 0, 0, 0.6),
              0 0 50px
              rgba(139, 92, 246, 0.12);

            color: white;

            font-family:
              Inter,
              system-ui,
              sans-serif;
          "
        >

          <div
            style="
              color: #a98bff;

              font-size: 9px;
              font-weight: 900;

              letter-spacing: 1.5px;
            "
          >
            PRODUCT MANAGEMENT
          </div>


          <h2
            style="
              margin:
                8px
                0
                0;

              font-size: 22px;
            "
          >
            ${escapeHTML(
              productName
            )}
          </h2>


          <p
            style="
              margin-top: 12px;

              color: #aaa3b2;

              font-size: 12px;

              line-height: 1.7;
            "
          >

            ${
              hasOrders
                ? `This listing appears in ${orderCount} existing order${orderCount === 1 ? "" : "s"}.`
                : "This listing has no existing orders."
            }

          </p>


          ${
            hasOrders
              ? `
                <div
                  style="
                    margin-top: 16px;

                    padding: 14px;

                    border:
                      1px solid
                      rgba(255, 96, 82, 0.25);

                    border-radius: 11px;

                    background:
                      rgba(255, 70, 55, 0.07);

                    color: #ffaaa0;

                    font-size: 11px;

                    line-height: 1.6;
                  "
                >
                  Permanent deletion removes the linked order item records too.
                </div>
              `
              : `
                <div
                  style="
                    margin-top: 16px;

                    padding: 14px;

                    border:
                      1px solid
                      rgba(167, 139, 250, 0.2);

                    border-radius: 11px;

                    background:
                      rgba(139, 92, 246, 0.07);

                    color: #cbbef1;

                    font-size: 11px;

                    line-height: 1.6;
                  "
                >
                  Archive keeps the listing in your database and hides it from customers.
                </div>
              `
          }


          <div
            style="
              display: grid;

              gap: 9px;

              margin-top: 22px;
            "
          >

            <button
              id="archiveChoice"
              type="button"
              style="
                height: 46px;

                border:
                  1px solid
                  rgba(167, 139, 250, 0.4);

                border-radius: 10px;

                background:
                  rgba(139, 92, 246, 0.14);

                color: #e5ddff;

                font-weight: 850;

                cursor: pointer;
              "
            >
              Archive Listing
            </button>


            <button
              id="deleteForeverChoice"
              type="button"
              style="
                height: 46px;

                border:
                  1px solid
                  rgba(255, 83, 70, 0.42);

                border-radius: 10px;

                background:
                  rgba(255, 60, 45, 0.11);

                color: #ff9d94;

                font-weight: 850;

                cursor: pointer;
              "
            >
              Delete Permanently
            </button>


            <button
              id="cancelChoice"
              type="button"
              style="
                height: 42px;

                border:
                  1px solid
                  rgba(255, 255, 255, 0.08);

                border-radius: 10px;

                background:
                  rgba(255, 255, 255, 0.025);

                color: #9993a1;

                font-weight: 800;

                cursor: pointer;
              "
            >
              Cancel
            </button>

          </div>

        </div>
      `;


      document.body.appendChild(
        overlay
      );


      const finish =
        choice => {

          overlay.remove();

          resolve(choice);
        };


      overlay
        .querySelector(
          "#archiveChoice"
        )
        .addEventListener(
          "click",
          () =>
            finish(
              "archive"
            )
        );


      overlay
        .querySelector(
          "#deleteForeverChoice"
        )
        .addEventListener(
          "click",
          () =>
            finish(
              "delete"
            )
        );


      overlay
        .querySelector(
          "#cancelChoice"
        )
        .addEventListener(
          "click",
          () =>
            finish(
              "cancel"
            )
        );


      overlay.addEventListener(
        "click",
        event => {

          if (
            event.target ===
            overlay
          ) {

            finish(
              "cancel"
            );
          }

        }
      );

    }
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
      .select(
        "order_id"
      )
      .eq(
        "product_id",
        productId
      );


  if (error) {

    throw error;
  }


  const uniqueOrders =
    new Set(
      (data || [])
        .map(
          item =>
            item.order_id
        )
        .filter(Boolean)
    );


  return uniqueOrders.size;
}


async function archiveProduct(
  productId,
  productName
) {

  const {
    error
  } =
    await supabase
      .from("products")
      .update({
        status: "draft",
        is_hot: false
      })
      .eq(
        "id",
        productId
      );


  if (error) {

    throw error;
  }


  alert(
    `"${productName}" has been archived.`
  );


  await Promise.all([
    loadProducts(),
    loadStats()
  ]);
}


async function permanentDeleteProduct(
  productId,
  productName,
  orderCount
) {

  let warning =
    `PERMANENT DELETE\n\n"${productName}"`;


  if (
    orderCount > 0
  ) {

    warning +=
      `\n\nThis listing appears in ${orderCount} order${orderCount === 1 ? "" : "s"}.`;

    warning +=
      "\n\nLinked order item records will also be deleted.";
  }


  warning +=
    "\n\nThis action cannot be reversed.";


  const confirmed =
    confirm(
      warning
    );


  if (!confirmed) {

    return;
  }


  if (
    orderCount > 0
  ) {

    const {
      error:
        orderItemDeleteError
    } =
      await supabase
        .from("order_items")
        .delete()
        .eq(
          "product_id",
          productId
        );


    if (
      orderItemDeleteError
    ) {

      throw orderItemDeleteError;
    }
  }


  const {
    error:
      productDeleteError
  } =
    await supabase
      .from("products")
      .delete()
      .eq(
        "id",
        productId
      );


  if (
    productDeleteError
  ) {

    throw productDeleteError;
  }


  alert(
    `"${productName}" was permanently deleted.`
  );


  await Promise.all([
    loadProducts(),
    loadStats()
  ]);
}


async function deleteProduct(id) {

  const product =
    products.find(
      item =>
        String(
          item.id
        ) ===
        String(id)
    );


  if (!product) {

    alert(
      "Product not found."
    );

    return;
  }


  const productName =
    product.name ||
    "Unnamed product";


  try {

    const orderCount =
      await getProductOrderCount(
        id
      );


    const choice =
      await openDeleteChoiceModal(
        productName,
        orderCount
      );


    if (
      choice === "cancel"
    ) {

      return;
    }


    if (
      choice === "archive"
    ) {

      await archiveProduct(
        id,
        productName
      );

      return;
    }


    if (
      choice === "delete"
    ) {

      await permanentDeleteProduct(
        id,
        productName,
        orderCount
      );
    }

  } catch (error) {

    console.error(error);


    alert(
      `Unable to manage product:\n${error.message}`
    );
  }

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


  if (productImageFileName) {

    productImageFileName.textContent =
      "Current image";
  }


  if (productImagePreview) {

    productImagePreview.classList.add(
      "hidden"
    );
  }

}


function showImagePreview(
  url,
  fileName = "Current image"
) {

  if (!url) {

    resetImagePreview();

    return;
  }


  if (productImagePreviewImg) {

    productImagePreviewImg.src =
      url;
  }


  if (productImageFileName) {

    productImageFileName.textContent =
      fileName;
  }


  if (productImagePreview) {

    productImagePreview.classList.remove(
      "hidden"
    );
  }

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

  productMessage.style.color =
    "";


  resetImagePreview();


  productModal.classList.remove(
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


  const category =
    String(
      product.category ||
      "toy"
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


  productImageInput.value =
    "";


  if (
    product.thumbnail_url
  ) {

    showImagePreview(
      product.thumbnail_url,
      "Current product image"
    );

  } else {

    productImagePreview
      .classList.add(
        "hidden"
      );
  }


  saveProductButton.textContent =
    "Save Changes";


  productMessage.textContent =
    "";

  productMessage.style.color =
    "";


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
  ).value =
    "";


  saveProductButton.textContent =
    "Create Product";


  productMessage.textContent =
    "";

  productMessage.style.color =
    "";


  resetImagePreview();

}


function getFileExtension(
  file
) {

  const fileName =
    String(
      file.name ||
      ""
    );


  const extension =
    fileName.includes(".")
      ? fileName
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
    ].includes(
      extension
    )
  ) {

    return extension;
  }


  if (
    file.type ===
    "image/png"
  ) {

    return "png";
  }


  if (
    file.type ===
    "image/webp"
  ) {

    return "webp";
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
    getFileExtension(
      file
    );


  const uniqueId =
    typeof crypto.randomUUID ===
    "function"
      ? crypto.randomUUID()
      : String(
          Date.now()
        );


  const filePath =
    `${currentUser.id}/${Date.now()}-${uniqueId}.${extension}`;


  const {
    error: uploadError
  } =
    await supabase.storage
      .from(
        "product-images"
      )
      .upload(
        filePath,
        file,
        {
          cacheControl:
            "3600",

          upsert:
            false,

          contentType:
            file.type
        }
      );


  if (uploadError) {

    throw uploadError;
  }


  const {
    data: publicData
  } =
    supabase.storage
      .from(
        "product-images"
      )
      .getPublicUrl(
        filePath
      );


  const publicUrl =
    publicData?.publicUrl;


  if (!publicUrl) {

    throw new Error(
      "Product image URL was not generated."
    );
  }


  return publicUrl;
}


async function saveProduct(
  event
) {

  event.preventDefault();


  const editingId =
    document.getElementById(
      "editingProductId"
    ).value;


  productMessage.style.color =
    "";


  productMessage.textContent =
    productImageInput
      .files?.[0]
      ? "Uploading image..."
      : editingId
        ? "Saving changes..."
        : "Creating product...";


  saveProductButton.disabled =
    true;


  try {

    let imageUrl =
      thumbnailUrlInput
        .value
        .trim();


    const imageFile =
      productImageInput
        .files?.[0];


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
          .value
          .trim(),

      limited_id:
        document
          .getElementById(
            "limitedId"
          )
          .value
          .trim(),

      description:
        document
          .getElementById(
            "description"
          )
          .value
          .trim(),

      price:
        Number(
          document
            .getElementById(
              "price"
            )
            .value
        ),

      stock:
        Number(
          document
            .getElementById(
              "stock"
            )
            .value
        ),

      category:
        document
          .getElementById(
            "category"
          )
          .value,

      seller_name:
        document
          .getElementById(
            "sellerName"
          )
          .value
          .trim(),

      thumbnail_url:
        imageUrl,

      item_url:
        document
          .getElementById(
            "itemUrl"
          )
          .value
          .trim(),

      status:
        document
          .getElementById(
            "productStatus"
          )
          .value,

      is_hot:
        document
          .getElementById(
            "isHot"
          )
          .checked

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

    console.error(
      error
    );


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


  if (dashboardNav) {

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
  }


  if (productsNav) {

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
  }


  if (customersNav) {

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
  }


  if (settingsNav) {

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

}


function setupImageUpload() {

  if (productImageInput) {

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


          const previewUrl =
            URL.createObjectURL(
              file
            );


          showImagePreview(
            previewUrl,
            file.name
          );

        }
      );
  }


  if (
    removeProductImageButton
  ) {

    removeProductImageButton
      .addEventListener(
        "click",
        () => {

          resetImagePreview();

        }
      );
  }

}


async function start() {

  const user =
    await protectAdminPage();


  if (!user) {

    return;
  }


  setupNavigation();

  setupImageUpload();


  const createProductButton =
    document.getElementById(
      "createProductButton"
    );

  const createProductButtonSecondary =
    document.getElementById(
      "createProductButtonSecondary"
    );

  const productsCreateButton =
    document.getElementById(
      "productsCreateButton"
    );

  const closeModalButton =
    document.getElementById(
      "closeModalButton"
    );

  const cancelProductButton =
    document.getElementById(
      "cancelProductButton"
    );

  const modalOverlay =
    document.getElementById(
      "modalOverlay"
    );

  const logoutButton =
    document.getElementById(
      "logoutButton"
    );


  if (createProductButton) {

    createProductButton
      .addEventListener(
        "click",
        openCreateModal
      );
  }


  if (
    createProductButtonSecondary
  ) {

    createProductButtonSecondary
      .addEventListener(
        "click",
        openCreateModal
      );
  }


  if (productsCreateButton) {

    productsCreateButton
      .addEventListener(
        "click",
        openCreateModal
      );
  }


  if (closeModalButton) {

    closeModalButton
      .addEventListener(
        "click",
        closeModal
      );
  }


  if (cancelProductButton) {

    cancelProductButton
      .addEventListener(
        "click",
        closeModal
      );
  }


  if (modalOverlay) {

    modalOverlay
      .addEventListener(
        "click",
        closeModal
      );
  }


  if (productForm) {

    productForm
      .addEventListener(
        "submit",
        saveProduct
      );
  }


  if (logoutButton) {

    logoutButton
      .addEventListener(
        "click",
        async () => {

          await supabase.auth.signOut();

          window.location.href =
            "./login.html";

        }
      );
  }


  await Promise.all([
    loadProducts(),
    loadStats()
  ]);

}


start();