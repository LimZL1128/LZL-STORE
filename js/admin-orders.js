import { supabase } from "./supabase.js";


const ordersContainer =
  document.getElementById("ordersContainer");

const totalOrders =
  document.getElementById("totalOrders");

const pendingOrders =
  document.getElementById("pendingOrders");

const completedOrders =
  document.getElementById("completedOrders");

const totalRevenue =
  document.getElementById("totalRevenue");

const logoutButton =
  document.getElementById("logoutButton");


function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function formatDate(value) {
  if (!value) {
    return "Not available";
  }

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

  let label =
    value.charAt(0).toUpperCase() +
    value.slice(1);

  if (value === "pending") {
    label = "Pending Verification";
  }

  return `
    <span
      class="admin-order-status status-${escapeHTML(value)}"
    >
      ${escapeHTML(label)}
    </span>
  `;
}


async function checkAdmin() {
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (
    userError ||
    !user
  ) {
    window.location.href =
      "./login.html";

    return false;
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

    window.location.href =
      "./login.html";

    return false;
  }

  return true;
}


async function approvePayment(orderId) {
  const confirmed =
    confirm(
      "Approve this payment?\n\nCheck the exact TNG amount and transaction reference first."
    );

  if (!confirmed) {
    return;
  }

  const {
    error
  } = await supabase.rpc(
    "mark_order_paid",
    {
      p_order_id: orderId
    }
  );

  if (error) {
    console.error(error);

    alert(
      `Unable to approve payment:\n${error.message}`
    );

    return;
  }

  await loadOrders();
}


async function rejectPayment(orderId) {
  const confirmed =
    confirm(
      "Reject this payment?\n\nThe order will become Cancelled."
    );

  if (!confirmed) {
    return;
  }

  const {
    error
  } = await supabase.rpc(
    "reject_order_payment",
    {
      p_order_id: orderId
    }
  );

  if (error) {
    console.error(error);

    alert(
      `Unable to reject payment:\n${error.message}`
    );

    return;
  }

  await loadOrders();
}


async function startProcessing(orderId) {
  const confirmed =
    confirm(
      "Start processing this order?"
    );

  if (!confirmed) {
    return;
  }

  const {
    error
  } = await supabase.rpc(
    "start_processing_order",
    {
      p_order_id: orderId
    }
  );

  if (error) {
    console.error(error);

    alert(
      `Unable to start processing:\n${error.message}`
    );

    return;
  }

  await loadOrders();
}


function getFileExtension(file) {
  const filename =
    String(file.name || "");

  const parts =
    filename.split(".");

  if (parts.length > 1) {
    return parts
      .pop()
      .toLowerCase();
  }

  if (file.type === "image/png") {
    return "png";
  }

  if (file.type === "image/webp") {
    return "webp";
  }

  return "jpg";
}


async function uploadDeliveryProof(
  orderId,
  file,
  button
) {
  if (!file) {
    alert(
      "Choose a delivery screenshot first."
    );

    return;
  }

  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp"
  ];

  if (
    !allowedTypes.includes(file.type)
  ) {
    alert(
      "Use JPG, PNG, or WEBP."
    );

    return;
  }

  if (
    file.size >
    5 * 1024 * 1024
  ) {
    alert(
      "Screenshot must stay below 5 MB."
    );

    return;
  }

  button.disabled = true;
  button.textContent =
    "Uploading Proof...";

  const extension =
    getFileExtension(file);

  const uniqueName =
    typeof crypto.randomUUID ===
    "function"
      ? crypto.randomUUID()
      : String(Date.now());

  const filePath =
    `${orderId}/${Date.now()}-${uniqueName}.${extension}`;

  const {
    error: uploadError
  } = await supabase.storage
    .from("delivery-proofs")
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
    console.error(uploadError);

    alert(
      `Upload failed:\n${uploadError.message}`
    );

    button.disabled = false;
    button.textContent =
      "Upload Proof";

    return;
  }

  const {
    data: publicData
  } = supabase.storage
    .from("delivery-proofs")
    .getPublicUrl(filePath);

  const proofUrl =
    publicData?.publicUrl;

  if (!proofUrl) {
    alert(
      "Unable to generate proof URL."
    );

    button.disabled = false;
    button.textContent =
      "Upload Proof";

    return;
  }

  const {
    error: saveError
  } = await supabase.rpc(
    "save_delivery_proof",
    {
      p_order_id: orderId,
      p_url: proofUrl
    }
  );

  if (saveError) {
    console.error(saveError);

    alert(
      `Unable to save proof:\n${saveError.message}`
    );

    button.disabled = false;
    button.textContent =
      "Upload Proof";

    return;
  }

  await loadOrders();
}


async function completeOrder(orderId) {
  const confirmed =
    confirm(
      "Complete this order?\n\nOnly continue after the Roblox Limited delivery is finished."
    );

  if (!confirmed) {
    return;
  }

  const {
    error
  } = await supabase.rpc(
    "complete_order",
    {
      p_order_id: orderId
    }
  );

  if (error) {
    console.error(error);

    alert(
      `Unable to complete order:\n${error.message}`
    );

    return;
  }

  await loadOrders();
}


function buildProcessingControls(order) {
  if (
    order.delivery_proof_url
  ) {
    return `
      <div class="delivery-proof-admin">

        <div class="delivery-proof-success">

          <span>
            ✓
          </span>

          <div>

            <strong>
              Delivery Proof Uploaded
            </strong>

            <small>
              ${escapeHTML(
                formatDate(
                  order.delivery_proof_uploaded_at
                )
              )}
            </small>

          </div>

        </div>

        <a
          href="${escapeHTML(
            order.delivery_proof_url
          )}"
          target="_blank"
          rel="noopener noreferrer"
          class="view-proof-button"
        >
          View Proof
        </a>

        <button
          class="complete-order-button"
          data-order-id="${escapeHTML(
            order.id
          )}"
          type="button"
        >
          Complete Order
        </button>

      </div>
    `;
  }

  return `
    <div
      class="delivery-proof-upload"
      data-order-id="${escapeHTML(
        order.id
      )}"
    >

      <div class="delivery-proof-title">

        <span>
          DELIVERY PROOF
        </span>

        <strong>
          Upload Trade Screenshot
        </strong>

        <p>
          Upload a screenshot showing the Roblox Limited delivery.
        </p>

      </div>

      <input
        id="proof-${escapeHTML(
          order.id
        )}"
        class="delivery-proof-input"
        data-order-id="${escapeHTML(
          order.id
        )}"
        type="file"
        accept="image/jpeg,image/png,image/webp"
      >

      <label
        for="proof-${escapeHTML(
          order.id
        )}"
        class="choose-proof-button"
      >
        Choose Screenshot
      </label>

      <div
        id="preview-${escapeHTML(
          order.id
        )}"
        class="proof-preview hidden"
      >

        <img
          class="proof-preview-image"
          alt="Delivery proof preview"
        >

        <span class="proof-file-name">
        </span>

      </div>

      <button
        class="upload-proof-button"
        data-order-id="${escapeHTML(
          order.id
        )}"
        type="button"
      >
        Upload Proof
      </button>

      <div class="complete-locked">
        Upload proof to unlock Complete Order
      </div>

    </div>
  `;
}


function buildControls(order) {
  const status =
    String(
      order.status || ""
    ).toLowerCase();

  if (status === "pending") {
    return `
      <div class="payment-review-actions">

        <button
          class="approve-payment-button"
          data-order-id="${escapeHTML(
            order.id
          )}"
          type="button"
        >
          Approve Payment
        </button>

        <button
          class="reject-payment-button"
          data-order-id="${escapeHTML(
            order.id
          )}"
          type="button"
        >
          Reject Payment
        </button>

      </div>
    `;
  }

  if (status === "paid") {
    return `
      <div class="payment-review-actions">

        <button
          class="processing-order-button"
          data-order-id="${escapeHTML(
            order.id
          )}"
          type="button"
        >
          Start Processing
        </button>

      </div>
    `;
  }

  if (status === "processing") {
    return buildProcessingControls(
      order
    );
  }

  if (status === "completed") {
    return `
      <div class="completed-order-actions">

        <div class="locked-order-state completed-state">
          Order completed
        </div>

        ${
          order.delivery_proof_url
            ? `
              <a
                href="${escapeHTML(
                  order.delivery_proof_url
                )}"
                target="_blank"
                rel="noopener noreferrer"
                class="view-proof-button"
              >
                View Delivery Proof
              </a>
            `
            : ""
        }

      </div>
    `;
  }

  if (status === "cancelled") {
    return `
      <div class="locked-order-state cancelled-state">
        Order cancelled
      </div>
    `;
  }

  return "";
}


function bindOrderButtons() {
  document
    .querySelectorAll(
      ".approve-payment-button"
    )
    .forEach(button => {
      button.addEventListener(
        "click",
        async () => {
          button.disabled = true;

          await approvePayment(
            button.dataset.orderId
          );
        }
      );
    });


  document
    .querySelectorAll(
      ".reject-payment-button"
    )
    .forEach(button => {
      button.addEventListener(
        "click",
        async () => {
          button.disabled = true;

          await rejectPayment(
            button.dataset.orderId
          );
        }
      );
    });


  document
    .querySelectorAll(
      ".processing-order-button"
    )
    .forEach(button => {
      button.addEventListener(
        "click",
        async () => {
          button.disabled = true;

          await startProcessing(
            button.dataset.orderId
          );
        }
      );
    });


  document
    .querySelectorAll(
      ".complete-order-button"
    )
    .forEach(button => {
      button.addEventListener(
        "click",
        async () => {
          button.disabled = true;

          await completeOrder(
            button.dataset.orderId
          );
        }
      );
    });


  document
    .querySelectorAll(
      ".delivery-proof-input"
    )
    .forEach(input => {
      input.addEventListener(
        "change",
        () => {
          const file =
            input.files?.[0];

          const orderId =
            input.dataset.orderId;

          const preview =
            document.getElementById(
              `preview-${orderId}`
            );

          if (
            !file ||
            !preview
          ) {
            return;
          }

          const image =
            preview.querySelector(
              ".proof-preview-image"
            );

          const filename =
            preview.querySelector(
              ".proof-file-name"
            );

          if (
            !image ||
            !filename
          ) {
            return;
          }

          image.src =
            URL.createObjectURL(file);

          filename.textContent =
            file.name;

          preview.classList.remove(
            "hidden"
          );
        }
      );
    });


  document
    .querySelectorAll(
      ".upload-proof-button"
    )
    .forEach(button => {
      button.addEventListener(
        "click",
        async () => {
          const orderId =
            button.dataset.orderId;

          const input =
            document.getElementById(
              `proof-${orderId}`
            );

          const file =
            input?.files?.[0];

          await uploadDeliveryProof(
            orderId,
            file,
            button
          );
        }
      );
    });
}


async function loadOrders() {
  ordersContainer.innerHTML = `
    <div class="admin-orders-loading">
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
    .order(
      "created_at",
      {
        ascending: false
      }
    );

  if (error) {
    console.error(error);

    ordersContainer.innerHTML = `
      <div class="admin-orders-error">

        <h3>
          Unable to load orders
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

  const orderList =
    orders || [];

  if (totalOrders) {
    totalOrders.textContent =
      orderList.length;
  }

  if (pendingOrders) {
    pendingOrders.textContent =
      orderList.filter(
        order =>
          String(
            order.status
          ).toLowerCase() ===
          "pending"
      ).length;
  }

  if (completedOrders) {
    completedOrders.textContent =
      orderList.filter(
        order =>
          String(
            order.status
          ).toLowerCase() ===
          "completed"
      ).length;
  }

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

        return total +
          Number(
            order.total || 0
          );
      },
      0
    );

  if (totalRevenue) {
    totalRevenue.textContent =
      `RM ${revenue.toFixed(2)}`;
  }

  if (!orderList.length) {
    ordersContainer.innerHTML = `
      <div class="admin-orders-empty">

        <h3>
          No orders yet
        </h3>

        <p>
          Customer orders will appear here.
        </p>

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
            Number(
              item.price || 0
            ) *
            Number(
              item.quantity || 1
            );

          return `
            <div class="admin-order-product">

              <div class="admin-order-image">
                ${image}
              </div>

              <div class="admin-order-product-info">

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
                    item.quantity || 1
                  )}
                </span>

              </div>

              <strong class="admin-order-price">
                RM ${itemTotal.toFixed(2)}
              </strong>

            </div>
          `;
        })
        .join("");

      const robloxUsername =
        order.roblox_username ||
        "Not provided";

      const paymentReference =
        order.payment_reference ||
        "No reference";

      return `
        <article class="admin-order-card">

          <div class="admin-order-header">

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

            <div class="admin-order-date">
              ${escapeHTML(
                formatDate(
                  order.created_at
                )
              )}
            </div>

          </div>


          <div class="admin-order-meta">

            <div>

              <span>
                ROBLOX USERNAME
              </span>

              <strong>
                ${escapeHTML(
                  robloxUsername
                )}
              </strong>

            </div>

            <div>

              <span>
                ORDER STATUS
              </span>

              ${formatStatus(
                order.status
              )}

            </div>

          </div>


          <div class="admin-order-meta">

            <div>

              <span>
                CUSTOMER ID
              </span>

              <strong>
                ${escapeHTML(
                  order.user_id
                )}
              </strong>

            </div>

            <div>

              <span>
                PAYMENT METHOD
              </span>

              <strong>
                ${escapeHTML(
                  String(
                    order.payment_method ||
                    "tng"
                  ).toUpperCase()
                )}
              </strong>

            </div>

          </div>


          <div class="payment-review-card">

            <div class="payment-review-heading">

              <div>

                <span class="payment-label">
                  TNG PAYMENT
                </span>

                <h4>
                  Payment Verification
                </h4>

              </div>

              <strong class="payment-order-total">
                RM ${Number(
                  order.total || 0
                ).toFixed(2)}
              </strong>

            </div>


            <div class="payment-data-grid">

              <div class="payment-data">

                <span>
                  Transaction Reference
                </span>

                <strong class="payment-reference">
                  ${escapeHTML(
                    paymentReference
                  )}
                </strong>

              </div>

              <div class="payment-data">

                <span>
                  Submitted
                </span>

                <strong>
                  ${escapeHTML(
                    formatDate(
                      order.payment_submitted_at
                    )
                  )}
                </strong>

              </div>

              <div class="payment-data">

                <span>
                  Verified
                </span>

                <strong>
                  ${escapeHTML(
                    order.payment_verified_at
                      ? formatDate(
                          order.payment_verified_at
                        )
                      : "Not verified"
                  )}
                </strong>

              </div>

              <div class="payment-data">

                <span>
                  Roblox Delivery Account
                </span>

                <strong>
                  ${escapeHTML(
                    robloxUsername
                  )}
                </strong>

              </div>

            </div>


            <div class="payment-warning">
              Check the TNG reference and exact amount before approving payment.
            </div>

          </div>


          <div class="admin-order-products">
            ${itemsHTML}
          </div>


          <div class="admin-order-footer">

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

            ${buildControls(
              order
            )}

          </div>

        </article>
      `;
    })
    .join("");

  bindOrderButtons();
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
  const isAdmin =
    await checkAdmin();

  if (!isAdmin) {
    return;
  }

  await loadOrders();
}


start();