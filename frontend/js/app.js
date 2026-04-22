import api from "./api.js";
import { REACTIONS } from "./config.js";

const state = {
  auth: api.getStoredAuth(),
  user: api.getStoredAuth()?.user || null,
  albums: [],
  selectedAlbum: null,
  images: [],
  notifications: [],
  communityUsers: [],
  pagination: {
    page: 1,
    hasMore: false
  },
  search: "",
  searchTimer: null,
  isLoadingImages: false,
  activeImageId: null
};

const elements = {
  authView: document.querySelector("#authView"),
  appView: document.querySelector("#appView"),
  alertHost: document.querySelector("#statusHost"),
  authTabs: document.querySelector("#authTabs"),
  heroVisualPanel: document.querySelector(".hero-visual-panel"),
  loginForm: document.querySelector("#loginForm"),
  registerForm: document.querySelector("#registerForm"),
  profileForm: document.querySelector("#profileForm"),
  createAlbumForm: document.querySelector("#createAlbumForm"),
  uploadForm: document.querySelector("#uploadForm"),
  albumList: document.querySelector("#albumList"),
  albumSearch: document.querySelector("#albumSearch"),
  communityList: document.querySelector("#communityList"),
  statsRow: document.querySelector("#statsRow"),
  selectedAlbum: document.querySelector("#selectedAlbum"),
  albumGallery: document.querySelector("#albumGallery"),
  uploadAlbumId: document.querySelector("#uploadAlbumId"),
  imageModal: document.querySelector("#imageModal"),
  imageModalContent: document.querySelector("#imageModalContent"),
  profileSummary: document.querySelector("#profileSummary"),
  notificationList: document.querySelector("#notificationList"),
  notificationButton: document.querySelector("#notificationButton"),
  notificationCount: document.querySelector("#notificationCount"),
  markNotificationsRead: document.querySelector("#markNotificationsRead"),
  logoutButton: document.querySelector("#logoutButton"),
  profileSettingsButton: document.querySelector("#profileSettingsButton"),
  openProfileSettings: document.querySelector("#openProfileSettings"),
  openNotifications: document.querySelector("#openNotifications"),
  profileDrawer: document.querySelector("#profileDrawer"),
  notificationDrawer: document.querySelector("#notificationDrawer"),
  panelBackdrop: document.querySelector("#panelBackdrop"),
  profileUsername: document.querySelector("#profileUsername"),
  profileEmail: document.querySelector("#profileEmail"),
  profileAccessCode: document.querySelector("#profileAccessCode")
};

const motionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        motionObserver.unobserve(entry.target);
      }
    });
  },
  {
    rootMargin: "0px 0px -10% 0px",
    threshold: 0.12
  }
);

const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const getInitials = (value = "PX") =>
  value
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const formatDate = (value) =>
  new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));

const renderAvatar = (user, sizeClass = "avatar", { isActive = user?.isActive === true } = {}) => {
  const activeBadge = isActive ? `<span class="avatar-status-dot" aria-label="Active profile"></span>` : "";

  if (user?.profileImage) {
    return `
      <div class="avatar-shell avatar-shell-${sizeClass} ${isActive ? "is-active" : ""}">
        <div class="${sizeClass}">
          <img src="${escapeHtml(user.profileImage)}" alt="${escapeHtml(user.username || "User")}" />
        </div>
        ${activeBadge}
      </div>
    `;
  }

  return `
    <div class="avatar-shell avatar-shell-${sizeClass} ${isActive ? "is-active" : ""}">
      <div class="${sizeClass}">
        <div class="${sizeClass === "avatar" ? "avatar-fallback" : "comment-avatar-fallback"}">
          ${escapeHtml(getInitials(user?.username || "PX"))}
        </div>
      </div>
      ${activeBadge}
    </div>
  `;
};

const showAlert = (message, type = "success") => {
  elements.alertHost.innerHTML = `
    <div class="alert alert-${type === "success" ? "success" : "danger"} mt-3" role="alert">
      ${escapeHtml(message)}
    </div>
  `;

  window.clearTimeout(showAlert.timer);
  showAlert.timer = window.setTimeout(() => {
    elements.alertHost.innerHTML = "";
  }, 3500);
};

const setLoadingState = (form, isLoading, label) => {
  const button = form.querySelector('button[type="submit"]');

  if (!button) {
    return;
  }

  if (!button.dataset.defaultLabel) {
    button.dataset.defaultLabel = button.textContent;
  }

  button.disabled = isLoading;
  button.textContent = isLoading ? label : button.dataset.defaultLabel;
};

const applyMotionEnhancements = (root = document) => {
  const selectors = [
    ".panel-card",
    ".stat-card",
    ".album-card",
    ".selected-album-cover",
    ".selected-album-meta",
    ".album-gallery-item",
    ".masonry-item",
    ".notification-card",
    ".empty-state"
  ];

  root.querySelectorAll(selectors.join(", ")).forEach((element, index) => {
    if (!element.dataset.motionReady) {
      element.dataset.motionReady = "true";
      element.classList.add("motion-reveal");
      element.style.transitionDelay = `${Math.min(index * 45, 260)}ms`;
      motionObserver.observe(element);
    }
  });
};

const getImageById = (imageId) => state.images.find((image) => image._id === imageId) || null;

const isAlbumOwner = (album = state.selectedAlbum) =>
  Boolean(album?.creator?._id && state.user?._id && album.creator._id === state.user._id);

const updateStoredSession = (payload) => {
  state.auth = {
    token: payload.token,
    user: payload.user
  };
  state.user = payload.user;
  api.setStoredAuth(state.auth);
};

const closePanels = () => {
  [elements.profileDrawer, elements.notificationDrawer].forEach((panel) => {
    panel?.classList.remove("is-open");
  });
  elements.panelBackdrop?.classList.add("d-none");
  if (elements.imageModal?.classList.contains("d-none")) {
    document.body.classList.remove("panel-open");
  }
};

const openPanel = (panel) => {
  if (!panel) {
    return;
  }

  closePanels();
  panel.classList.add("is-open");
  elements.panelBackdrop?.classList.remove("d-none");
  document.body.classList.add("panel-open");
};

const openImageModal = (imageId) => {
  state.activeImageId = imageId;
  renderImageModal();
  elements.imageModal?.classList.remove("d-none");
  document.body.classList.add("panel-open");
};

const closeImageModal = () => {
  state.activeImageId = null;
  elements.imageModal?.classList.add("d-none");

  if (!elements.profileDrawer?.classList.contains("is-open") && !elements.notificationDrawer?.classList.contains("is-open")) {
    document.body.classList.remove("panel-open");
  }
};

const clearSession = async () => {
  state.auth = null;
  state.user = null;
  state.albums = [];
  state.selectedAlbum = null;
  state.images = [];
  state.notifications = [];
  state.communityUsers = [];
  state.pagination = { page: 1, hasMore: false };
  state.activeImageId = null;
  api.clearStoredAuth();
  closePanels();
  closeImageModal();
  renderShell();
};

const renderReactionButtons = (image) =>
  REACTIONS.map(
    (reaction) => `
      <button
        class="reaction-btn ${reaction.type} ${image.viewerReaction === reaction.type ? "active" : ""}"
        type="button"
        data-action="react"
        data-image-id="${image._id}"
        data-reaction-type="${reaction.type}"
      >
        ${reaction.label} (${image.reactionSummary?.[reaction.type] || 0})
      </button>
    `
  ).join("");

const renderComments = (image) => {
  if (!image.comments?.length) {
    return `<div class="helper-text">No comments yet. Start the conversation.</div>`;
  }

  return image.comments
    .map(
      (comment) => `
        <div class="comment-item">
          ${renderAvatar(comment.user, "comment-avatar")}
          <div class="comment-bubble">
            <strong>${escapeHtml(comment.user.username)}</strong>
            <p class="comment-text">${escapeHtml(comment.text)}</p>
            <span class="helper-text">${escapeHtml(formatDate(comment.createdAt || comment.timestamp))}</span>
          </div>
        </div>
      `
    )
    .join("");
};

const renderImageModal = () => {
  const image = getImageById(state.activeImageId);

  if (!image) {
    elements.imageModalContent.innerHTML = "";
    return;
  }

  const totalReactions = Object.values(image.reactionSummary || {}).reduce((sum, count) => sum + count, 0);

  elements.imageModalContent.innerHTML = `
    <div class="image-modal-layout">
      <div class="image-modal-media">
        <img src="${escapeHtml(image.url)}" alt="${escapeHtml(image.caption || "Album image")}" />
      </div>
      <div class="image-modal-info">
        <div class="d-flex align-items-center justify-content-between gap-3">
          <div class="d-flex align-items-center gap-2">
            ${renderAvatar(image.uploadedBy, "mini-avatar")}
            <div>
              <strong>${escapeHtml(image.uploadedBy.username)}</strong>
              <p class="helper-text mb-0">${escapeHtml(formatDate(image.createdAt))}</p>
            </div>
          </div>
          <span class="meta-badge">${image.commentsCount} comments</span>
        </div>
        <h3 class="photo-title mt-3">${escapeHtml(image.caption || "Shared Moment")}</h3>
        <p class="image-modal-caption">Open the conversation around this album image, react to it, or leave a comment.</p>
        ${
          isAlbumOwner()
            ? `<button class="btn btn-outline-danger mb-3" type="button" data-delete-image="${image._id}">Delete This Image</button>`
            : ""
        }
        <div class="photo-actions">
          ${renderReactionButtons(image)}
        </div>
        <p class="helper-text mb-3">${totalReactions} total reactions</p>
        <div class="comment-list">${renderComments(image)}</div>
        <form class="comment-form" data-image-id="${image._id}">
          <input class="form-control" name="text" type="text" maxlength="240" placeholder="Add a comment" required />
          <button class="btn btn-outline-gold" type="submit">Post Comment</button>
        </form>
      </div>
    </div>
  `;
};

const renderShell = () => {
  const authenticated = Boolean(state.auth?.token);

  elements.authView.classList.toggle("d-none", authenticated);
  elements.appView.classList.toggle("d-none", !authenticated);
  elements.notificationButton.classList.toggle("d-none", !authenticated);
  elements.profileSettingsButton.classList.toggle("d-none", !authenticated);
  elements.logoutButton.classList.toggle("d-none", !authenticated);

  if (authenticated) {
    renderProfile();
    renderStats();
    renderAlbums();
    renderSelectedAlbum();
    renderAlbumGallery();
    renderNotifications();
    renderImageModal();
    applyMotionEnhancements(elements.appView);
  } else {
    elements.albumList.innerHTML = "";
    elements.selectedAlbum.innerHTML = "";
    elements.albumGallery.innerHTML = "";
    elements.notificationList.innerHTML = "";
    elements.imageModalContent.innerHTML = "";
    applyMotionEnhancements(elements.authView);
  }
};

const renderProfile = () => {
  if (!state.user) {
    return;
  }

  elements.profileSummary.innerHTML = `
    <div class="profile-chip">
      ${renderAvatar(state.user, "avatar", { isActive: true })}
      <div>
        <h3 class="photo-title mb-1">${escapeHtml(state.user.username)}</h3>
        <p class="small-copy mb-1">${escapeHtml(state.user.email)}</p>
        <p class="small-copy mb-1">Access Code: ${escapeHtml(state.user.accessCode || "Not set")}</p>
        <span class="meta-badge">${state.user.unreadNotifications || 0} unread</span>
      </div>
    </div>
  `;

  elements.profileUsername.value = state.user.username || "";
  elements.profileEmail.value = state.user.email || "";
  elements.profileAccessCode.value = state.user.accessCode || "";
  elements.notificationCount.textContent = String(state.user.unreadNotifications || 0);
};

const renderStats = () => {
  const totalAlbums = state.albums.length;
  const totalImages = state.albums.reduce((sum, album) => sum + album.imageCount, 0);
  const totalContributors = new Set(
    state.albums.flatMap((album) => album.contributors.map((contributor) => contributor._id))
  ).size;

  elements.statsRow.innerHTML = `
    <div class="stat-card">
      <strong>${totalAlbums}</strong>
      <span>Albums</span>
    </div>
    <div class="stat-card">
      <strong>${totalImages}</strong>
      <span>Images</span>
    </div>
    <div class="stat-card">
      <strong>${totalContributors}</strong>
      <span>Contributors</span>
    </div>
  `;

  applyMotionEnhancements(elements.statsRow);
};

const renderCommunityUsers = () => {
  if (!elements.communityList) {
    return;
  }

  if (!state.communityUsers.length) {
    elements.communityList.innerHTML = `<div class="helper-text">No other profiles are using this access code yet.</div>`;
    return;
  }

  elements.communityList.innerHTML = state.communityUsers
    .map((user) => {
      const safeName = escapeHtml(user.username || "User");

      return `
        <article class="community-member-card" title="${safeName}">
          ${renderAvatar(user, "presence-avatar")}
          <span class="community-member-name">${safeName}</span>
        </article>
      `;
    })
    .join("");

  applyMotionEnhancements(elements.communityList);
};

const renderAlbums = () => {
  if (!state.albums.length) {
    elements.albumList.innerHTML = `
      <div class="empty-state">
        No albums match your search yet. Create one to start the first shared story.
      </div>
    `;
    updateAlbumSelect();
    applyMotionEnhancements(elements.albumList);
    return;
  }

  elements.albumList.innerHTML = state.albums
    .map((album) => {
      const contributorNames = album.contributors
        .slice(0, 2)
        .map((contributor) => escapeHtml(contributor.username))
        .join(", ");

      return `
        <article class="album-card ${state.selectedAlbum?._id === album._id ? "active" : ""}" data-album-id="${album._id}">
          <div class="album-card-cover">
            ${
              album.coverImage
                ? `<img src="${escapeHtml(album.coverImage)}" alt="${escapeHtml(album.title)}" loading="lazy" />`
                : ""
            }
          </div>
          <div class="album-card-body">
            <h3 class="album-card-title">${escapeHtml(album.title)}</h3>
            <p class="small-copy mb-2">${escapeHtml(album.description || "Shared collection ready for new images.")}</p>
            <div class="d-flex flex-wrap gap-2 mb-2">
              <span class="meta-badge">${album.imageCount} images</span>
              <span class="meta-badge">${album.contributorCount} people</span>
            </div>
            <p class="meta-text mb-0">By ${escapeHtml(album.creator.username)}${contributorNames ? ` | With ${contributorNames}` : ""}</p>
          </div>
        </article>
      `;
    })
    .join("");

  updateAlbumSelect();
  applyMotionEnhancements(elements.albumList);
};

const renderSelectedAlbum = () => {
  if (!state.selectedAlbum) {
    elements.selectedAlbum.innerHTML = `
      <div class="empty-state">
        Select an album to explore its feed and open the images inside it.
      </div>
    `;
    applyMotionEnhancements(elements.selectedAlbum);
    return;
  }

  const album = state.selectedAlbum;
  const preview = album.previewImages?.[0]?.url || album.coverImage || "";

  elements.selectedAlbum.innerHTML = `
    <div class="selected-album-shell">
      <div class="selected-album-cover">
        ${preview ? `<img src="${escapeHtml(preview)}" alt="${escapeHtml(album.title)}" loading="lazy" />` : ""}
      </div>
      <div class="selected-album-meta">
        <span class="eyebrow">Active Album</span>
        <h2 class="selected-album-title">${escapeHtml(album.title)}</h2>
        <p class="panel-copy">${escapeHtml(album.description || "This album is open for collaborative image uploads.")}</p>
        ${
          isAlbumOwner(album)
            ? `<button class="btn btn-outline-danger mb-3" type="button" data-delete-album="${album._id}">Delete Album</button>`
            : ""
        }
        <div class="d-flex flex-wrap gap-2 mb-3">
          <span class="meta-badge">${album.imageCount} images</span>
          <span class="meta-badge">${album.contributorCount} contributors</span>
        </div>
        <p class="small-copy mb-1">Created by ${escapeHtml(album.creator.username)}</p>
        <p class="small-copy mb-0">Updated ${escapeHtml(formatDate(album.updatedAt))}</p>
      </div>
    </div>
  `;

  applyMotionEnhancements(elements.selectedAlbum);
};

const renderAlbumGallery = () => {
  if (!state.selectedAlbum) {
    elements.albumGallery.innerHTML = "";
    return;
  }

  if (!state.images.length) {
    elements.albumGallery.innerHTML = `
      <div class="empty-state">
        This album does not have any uploaded images yet.
      </div>
    `;
    applyMotionEnhancements(elements.albumGallery);
    return;
  }

  elements.albumGallery.innerHTML = state.images
    .map(
      (image) => `
        <article class="album-gallery-item">
          <button class="album-gallery-open" type="button" data-open-image="${image._id}">
            <img src="${escapeHtml(image.url)}" alt="${escapeHtml(image.caption || "Album image")}" loading="lazy" />
            <span class="album-gallery-caption">${escapeHtml(image.caption || image.uploadedBy.username)}</span>
          </button>
          ${
            isAlbumOwner()
              ? `<button class="album-gallery-delete" type="button" data-delete-image="${image._id}">Delete</button>`
              : ""
          }
        </article>
      `
    )
    .join("");

  applyMotionEnhancements(elements.albumGallery);
};

const renderNotifications = () => {
  if (!state.notifications.length) {
    elements.notificationList.innerHTML = `
      <div class="empty-state">
        No notifications yet. New reactions and comments will appear here.
      </div>
    `;
    applyMotionEnhancements(elements.notificationList);
    return;
  }

  elements.notificationList.innerHTML = state.notifications
    .map(
      (notification) => `
        <article class="notification-card ${notification.read ? "" : "unread"}">
          <div class="notification-item-header">
            <div class="notification-meta">
              ${renderAvatar(notification.actor, "mini-avatar")}
              <div>
                <strong>${escapeHtml(notification.actor.username)}</strong>
                <p class="small-copy mb-1">${escapeHtml(notification.message)}</p>
                <span class="helper-text">${escapeHtml(formatDate(notification.createdAt))}</span>
              </div>
            </div>
            <button
              class="delete-notification-btn"
              type="button"
              data-delete-notification="${notification._id}"
            >
              Delete
            </button>
          </div>
        </article>
      `
    )
    .join("");

  applyMotionEnhancements(elements.notificationList);
};

const updateAlbumSelect = () => {
  elements.uploadAlbumId.innerHTML = state.albums.length
    ? state.albums
        .map(
          (album) => `
            <option value="${album._id}" ${state.selectedAlbum?._id === album._id ? "selected" : ""}>
              ${escapeHtml(album.title)}
            </option>
          `
        )
        .join("")
    : `<option value="">Create an album first</option>`;
};

const syncUserFromServer = async () => {
  const { user } = await api.getMe();
  state.user = user;
  api.setStoredAuth({
    token: state.auth.token,
    user
  });
};

const loadNotifications = async () => {
  const { notifications } = await api.getNotifications();
  state.notifications = notifications;
  renderNotifications();
};

const loadAlbums = async ({ preserveSelection = true } = {}) => {
  const { albums } = await api.getAlbums({
    search: state.search,
    page: 1,
    limit: 16
  });
  state.albums = albums;

  if (!albums.length) {
    state.selectedAlbum = null;
  } else if (preserveSelection && state.selectedAlbum) {
    state.selectedAlbum = albums.find((album) => album._id === state.selectedAlbum._id) || albums[0];
  } else {
    state.selectedAlbum = albums[0];
  }

  renderStats();
  renderAlbums();
};

const loadSelectedAlbum = async (albumId) => {
  if (!albumId) {
    state.selectedAlbum = null;
    state.images = [];
    renderSelectedAlbum();
    renderAlbumGallery();
    return;
  }

  const { album } = await api.getAlbum(albumId);
  state.selectedAlbum = album;
  renderAlbums();
  renderSelectedAlbum();
  updateAlbumSelect();
  resetImages();
  await loadMoreImages();
};

const resetImages = () => {
  state.images = [];
  state.pagination = {
    page: 1,
    hasMore: false
  };
  renderAlbumGallery();
};

const loadMoreImages = async () => {
  if (!state.selectedAlbum?._id || state.isLoadingImages) {
    return;
  }

  if (state.pagination.page !== 1 && !state.pagination.hasMore) {
    return;
  }

  state.isLoadingImages = true;

  try {
    const { images, pagination } = await api.getImages({
      albumId: state.selectedAlbum._id,
      page: state.pagination.page,
      limit: 100
    });

    state.images = [...state.images, ...images];
    state.pagination = {
      page: pagination.page + 1,
      hasMore: pagination.hasMore
    };
    renderAlbumGallery();
    renderImageModal();
  } catch (error) {
    showAlert(error.message, "danger");
  } finally {
    state.isLoadingImages = false;
  }
};

const refreshDashboard = async ({ preserveSelection = true } = {}) => {
  await syncUserFromServer();
  renderProfile();
  await Promise.all([loadAlbums({ preserveSelection }), loadNotifications()]);

  if (state.selectedAlbum?._id) {
    await loadSelectedAlbum(state.selectedAlbum._id);
  } else {
    renderSelectedAlbum();
    renderAlbumGallery();
  }

  renderShell();
};

const handleAuthSuccess = async (payload, message) => {
  updateStoredSession(payload);
  showAlert(message, "success");
  renderShell();
  await refreshDashboard({ preserveSelection: false });
};

const switchAuthTab = (tabName) => {
  const isLogin = tabName === "login";
  elements.loginForm.classList.toggle("d-none", !isLogin);
  elements.registerForm.classList.toggle("d-none", isLogin);

  [...elements.authTabs.querySelectorAll("[data-auth-tab]")].forEach((button) => {
    button.classList.toggle("active", button.dataset.authTab === tabName);
  });
};

const handleReaction = async (imageId, type) => {
  const response = await api.toggleReaction({ imageId, type });
  const image = getImageById(imageId);

  if (!image) {
    return;
  }

  image.reactionSummary = response.reactionSummary;
  image.viewerReaction = response.viewerReaction;
  image.likes = response.likes;
  renderAlbumGallery();
  renderImageModal();
  await syncUserFromServer();
  renderProfile();
};

const handleComment = async (imageId, text) => {
  const response = await api.addComment({ imageId, text });
  const image = getImageById(imageId);

  if (!image) {
    return;
  }

  image.comments.push(response.comment);
  image.commentsCount = response.commentsCount;
  renderAlbumGallery();
  renderImageModal();
  await Promise.all([syncUserFromServer(), loadNotifications()]);
  renderProfile();
};

const openNotificationsPanel = async () => {
  openPanel(elements.notificationDrawer);

  if ((state.user?.unreadNotifications || 0) > 0) {
    await api.markNotificationsRead();
    await Promise.all([syncUserFromServer(), loadNotifications()]);
    renderProfile();
  } else {
    renderNotifications();
  }
};

const bindEvents = () => {
  applyMotionEnhancements(document);

  elements.authTabs.addEventListener("click", (event) => {
    const button = event.target.closest("[data-auth-tab]");
    if (button) {
      switchAuthTab(button.dataset.authTab);
    }
  });

  document.addEventListener("click", async (event) => {
    const authTrigger = event.target.closest("[data-auth-tab-target]");
    if (authTrigger) {
      switchAuthTab(authTrigger.dataset.authTabTarget);
      document.querySelector(".auth-card-landing")?.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
      return;
    }

    const closePanelButton = event.target.closest("[data-close-panel]");
    if (closePanelButton) {
      closePanels();
      return;
    }

    const openImageButton = event.target.closest("[data-open-image]");
    if (openImageButton) {
      openImageModal(openImageButton.dataset.openImage);
      return;
    }

    const closeModalButton = event.target.closest("[data-close-modal]");
    if (closeModalButton) {
      closeImageModal();
      return;
    }

    const deleteNotificationButton = event.target.closest("[data-delete-notification]");
    if (deleteNotificationButton) {
      try {
        await api.deleteNotification(deleteNotificationButton.dataset.deleteNotification);
        await Promise.all([syncUserFromServer(), loadNotifications()]);
        renderProfile();
        showAlert("Notification deleted.", "success");
      } catch (error) {
        showAlert(error.message, "danger");
      }
      return;
    }

    const deleteImageButton = event.target.closest("[data-delete-image]");
    if (deleteImageButton) {
      try {
        await api.deleteImage(deleteImageButton.dataset.deleteImage);
        closeImageModal();
        await refreshDashboard();
        showAlert("Image deleted successfully.", "success");
      } catch (error) {
        showAlert(error.message, "danger");
      }
      return;
    }

    const deleteAlbumButton = event.target.closest("[data-delete-album]");
    if (deleteAlbumButton) {
      try {
        await api.deleteAlbum(deleteAlbumButton.dataset.deleteAlbum);
        closeImageModal();
        await refreshDashboard({ preserveSelection: false });
        showAlert("Album deleted successfully.", "success");
      } catch (error) {
        showAlert(error.message, "danger");
      }
      return;
    }

    const reactionButton = event.target.closest('[data-action="react"]');
    if (reactionButton) {
      try {
        await handleReaction(reactionButton.dataset.imageId, reactionButton.dataset.reactionType);
      } catch (error) {
        showAlert(error.message, "danger");
      }
    }
  });

  document.addEventListener("submit", async (event) => {
    const commentForm = event.target.closest(".comment-form");
    if (!commentForm) {
      return;
    }

    event.preventDefault();
    const input = commentForm.querySelector('input[name="text"]');
    const text = input.value.trim();

    if (!text) {
      return;
    }

    try {
      await handleComment(commentForm.dataset.imageId, text);
      input.value = "";
    } catch (error) {
      showAlert(error.message, "danger");
    }
  });

  if (elements.heroVisualPanel) {
    elements.heroVisualPanel.addEventListener("pointermove", (event) => {
      const bounds = elements.heroVisualPanel.getBoundingClientRect();
      const offsetX = (event.clientX - bounds.left) / bounds.width - 0.5;
      const offsetY = (event.clientY - bounds.top) / bounds.height - 0.5;
      elements.heroVisualPanel.style.transform = `perspective(1200px) rotateY(${offsetX * 8}deg) rotateX(${offsetY * -8}deg) translateY(-4px)`;
    });

    elements.heroVisualPanel.addEventListener("pointerleave", () => {
      elements.heroVisualPanel.style.transform = "";
    });
  }

  elements.panelBackdrop.addEventListener("click", () => {
    closePanels();
  });

  elements.profileSettingsButton.addEventListener("click", () => {
    openPanel(elements.profileDrawer);
  });

  elements.openProfileSettings.addEventListener("click", () => {
    openPanel(elements.profileDrawer);
  });

  elements.notificationButton.addEventListener("click", async () => {
    try {
      await openNotificationsPanel();
    } catch (error) {
      showAlert(error.message, "danger");
    }
  });

  elements.openNotifications.addEventListener("click", async () => {
    try {
      await openNotificationsPanel();
    } catch (error) {
      showAlert(error.message, "danger");
    }
  });

  elements.markNotificationsRead.addEventListener("click", async () => {
    try {
      await api.markNotificationsRead();
      await Promise.all([syncUserFromServer(), loadNotifications()]);
      renderProfile();
      showAlert("Notifications marked as read.", "success");
    } catch (error) {
      showAlert(error.message, "danger");
    }
  });

  elements.loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    setLoadingState(elements.loginForm, true, "Logging In...");

    try {
      const payload = await api.login({
        email: elements.loginForm.email.value.trim(),
        password: elements.loginForm.password.value
      });
      await handleAuthSuccess(payload, "Welcome back to pheeX.");
      elements.loginForm.reset();
    } catch (error) {
      showAlert(error.message, "danger");
    } finally {
      setLoadingState(elements.loginForm, false);
    }
  });

  elements.registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    setLoadingState(elements.registerForm, true, "Creating...");

    try {
      const formData = new FormData(elements.registerForm);
      formData.set("accessCode", String(formData.get("accessCode") || "").replace(/\D/g, "").slice(0, 5));
      const payload = await api.register(formData);
      await handleAuthSuccess(payload, "Your account is ready.");
      elements.registerForm.reset();
    } catch (error) {
      showAlert(error.message, "danger");
    } finally {
      setLoadingState(elements.registerForm, false);
    }
  });

  elements.profileForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    setLoadingState(elements.profileForm, true, "Saving...");

    try {
      const formData = new FormData(elements.profileForm);
      if (!formData.get("username")) {
        formData.set("username", state.user.username);
      }
      if (!formData.get("email")) {
        formData.set("email", state.user.email);
      }

      const payload = await api.updateProfile(formData);
      updateStoredSession(payload);
      renderProfile();
      closePanels();
      showAlert("Profile updated successfully.", "success");
      elements.profileForm.reset();
      elements.profileUsername.value = state.user.username || "";
      elements.profileEmail.value = state.user.email || "";
    } catch (error) {
      showAlert(error.message, "danger");
    } finally {
      setLoadingState(elements.profileForm, false);
    }
  });

  elements.createAlbumForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    setLoadingState(elements.createAlbumForm, true, "Creating...");

    try {
      await api.createAlbum({
        title: elements.createAlbumForm.title.value.trim(),
        description: elements.createAlbumForm.description.value.trim()
      });
      showAlert("Album created. You can upload to it right away.", "success");
      elements.createAlbumForm.reset();
      await refreshDashboard({ preserveSelection: false });
    } catch (error) {
      showAlert(error.message, "danger");
    } finally {
      setLoadingState(elements.createAlbumForm, false);
    }
  });

  elements.uploadForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    setLoadingState(elements.uploadForm, true, "Uploading...");

    try {
      const formData = new FormData(elements.uploadForm);
      const { image } = await api.uploadImage(formData);
      showAlert("Image uploaded successfully.", "success");

      if (formData.get("albumId") === state.selectedAlbum?._id) {
        state.images.unshift(image);
        renderSelectedAlbum();
        renderAlbumGallery();
      }

      elements.uploadForm.reset();
      await refreshDashboard();
    } catch (error) {
      showAlert(error.message, "danger");
    } finally {
      setLoadingState(elements.uploadForm, false);
    }
  });

  elements.albumList.addEventListener("click", async (event) => {
    const albumCard = event.target.closest("[data-album-id]");
    if (!albumCard) {
      return;
    }

    await loadSelectedAlbum(albumCard.dataset.albumId);
  });

  elements.albumSearch.addEventListener("input", () => {
    window.clearTimeout(state.searchTimer);
    state.searchTimer = window.setTimeout(async () => {
      state.search = elements.albumSearch.value.trim();
      await refreshDashboard({ preserveSelection: false });
    }, 300);
  });

  elements.logoutButton.addEventListener("click", async () => {
    try {
      await api.logout();
    } catch (error) {
      // Client-side logout still proceeds if the token is expired.
    }

    await clearSession();
    showAlert("You have been logged out.", "success");
  });
};

const bootstrap = async () => {
  bindEvents();
  switchAuthTab("login");
  renderShell();

  if (state.auth?.token) {
    try {
      await refreshDashboard({ preserveSelection: false });
    } catch (error) {
      await clearSession();
      showAlert("Your session expired. Please log in again.", "danger");
    }
  }
};

bootstrap();
