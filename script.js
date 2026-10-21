"use strict";

const list = document.querySelector("#comments-list");
const newCommentForm = document.querySelector("#new-comment-form");
const dialog = document.querySelector("#delete-dialog");
const statusMessage = document.querySelector("#app-status");
const STORAGE_KEY = "interactive-comments-v1";
let state;
let pendingDelete = null;
let dialogTrigger = null;
let activeForm = null;
let storageAvailable = true;

// The static HTML also supplies initial content when opened directly via file://.
function readStaticData() {
  let nextId = 0;
  function readComment(article) {
    const paragraph = article.querySelector(".comment__content");
    const mention = paragraph.querySelector(".comment__mention")?.textContent;
    return {
      id: ++nextId,
      content: paragraph.textContent.slice(mention?.length || 0).trim(),
      createdAt: article.querySelector(".comment__date").textContent,
      score: Number(article.querySelector(".comment__score").textContent),
      user: {
        username: article.querySelector(".comment__author").textContent,
        image: { webp: article.querySelector("img").getAttribute("src") },
      },
      ...(mention ? { replyingTo: mention.slice(1) } : {}),
    };
  }
  const comments = [...list.children].map((item) => {
    const article = item.matches("article") ? item : item.querySelector("article");
    const comment = readComment(article);
    comment.replies = [...item.querySelectorAll("li > article")].map(readComment);
    return comment;
  });
  return {
    currentUser: {
      username: "juliusomo",
      image: { webp: "./images/avatars/image-juliusomo.webp" },
    },
    comments,
  };
}

function isValidState(value) {
  const ids = new Set();
  function validUser(user) {
    return user && typeof user.username === "string" &&
      /^\.\/images\/avatars\/image-[a-z0-9-]+\.(webp|png)$/.test(user.image?.webp);
  }
  function validComment(comment, reply = false) {
    if (!comment || !["number", "string"].includes(typeof comment.id) ||
        ids.has(String(comment.id)) || typeof comment.content !== "string" ||
        typeof comment.createdAt !== "string" || !Number.isFinite(comment.score) ||
        !validUser(comment.user) ||
        (comment.vote !== undefined && ![-1, 0, 1].includes(comment.vote)) ||
        (comment.timestamp !== undefined && !Number.isFinite(comment.timestamp)) ||
        (reply && typeof comment.replyingTo !== "string")) return false;
    ids.add(String(comment.id));
    return reply || (Array.isArray(comment.replies) && comment.replies.every((item) => validComment(item, true)));
  }
  return value && validUser(value.currentUser) && Array.isArray(value.comments) &&
    value.comments.every((item) => validComment(item));
}

function announce(message) {
  statusMessage.textContent = message + (storageAvailable ? "" : " Changes cannot be saved in this browser.");
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    storageAvailable = true;
  } catch {
    storageAvailable = false;
  }
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function button(text, className, action, id) {
  const node = element("button", className, text);
  node.type = "button";
  node.dataset.action = action;
  node.dataset.id = id;
  return node;
}

function actionButton(label, action, id) {
  const node = button(label, `comment__${action}`, action, id);
  const icon = element("img");
  icon.src = `./images/icon-${action}.svg`;
  icon.alt = "";
  icon.width = 14;
  icon.height = 14;
  node.prepend(icon);
  return node;
}

function avatar(user, size, className) {
  const image = element("img", className);
  image.src = user.image.webp;
  image.alt = "";
  image.width = size;
  image.height = size;
  return image;
}

function timeLabel(comment) {
  if (!comment.timestamp) return comment.createdAt;
  const seconds = Math.max(0, Math.floor((Date.now() - comment.timestamp) / 1000));
  if (seconds < 60) return "just now";
  for (const [unit, length] of [["year", 31536000], ["month", 2592000], ["week", 604800], ["day", 86400], ["hour", 3600], ["minute", 60]]) {
    if (seconds >= length) {
      const amount = Math.floor(seconds / length);
      return `${amount} ${unit}${amount === 1 ? "" : "s"} ago`;
    }
  }
}

function findComment(id) {
  for (const parent of state.comments) {
    if (String(parent.id) === String(id)) return { comment: parent, parent: null };
    const reply = parent.replies.find((item) => String(item.id) === String(id));
    if (reply) return { comment: reply, parent };
  }
}

function isOwn(comment) {
  return comment.user.username === state.currentUser.username;
}

function makeArticle(comment) {
  const own = isOwn(comment);
  const article = element("article", `comment${own ? " comment--own" : ""}`);
  article.dataset.id = comment.id;
  article.setAttribute("aria-label", `${comment.replyingTo ? "Reply" : "Comment"} by ${comment.user.username}`);
  const header = element("header", "comment__header");
  header.append(avatar(comment.user, 32, "comment__avatar"), element("span", "comment__author", comment.user.username));
  if (own) header.append(element("span", "comment__badge", "you"));
  const date = element("span", "comment__date", timeLabel(comment));
  if (comment.timestamp) date.title = new Date(comment.timestamp).toLocaleString();
  header.append(date);

  const content = element("p", "comment__content");
  if (comment.replyingTo) {
    content.append(element("span", "comment__mention", `@${comment.replyingTo}`), document.createTextNode(" "));
  }
  // User input is always text, never parsed as HTML.
  content.append(document.createTextNode(comment.content));
  const votes = element("div", "comment__vote");
  votes.setAttribute("role", "group");
  votes.setAttribute("aria-label", "Voting controls");
  const up = button("+", "", "upvote", comment.id);
  const down = button("−", "", "downvote", comment.id);
  for (const [control, value, label] of [[up, 1, "Upvote"], [down, -1, "Downvote"]]) {
    control.setAttribute("aria-label", `${label} comment by ${comment.user.username}`);
    control.setAttribute("aria-pressed", String(comment.vote === value));
  }
  votes.append(up, element("span", "comment__score", String(comment.score)), down);
  article.append(header, content, votes);
  if (own) {
    const actions = element("div", "comment__actions");
    actions.setAttribute("role", "group");
    actions.setAttribute("aria-label", "Manage your comment");
    actions.append(actionButton("Delete", "delete", comment.id), actionButton("Edit", "edit", comment.id));
    article.append(actions);
  } else {
    article.append(actionButton("Reply", "reply", comment.id));
  }
  return article;
}

function render() {
  list.replaceChildren();
  activeForm = null;
  state.comments.sort((a, b) => b.score - a.score);
  for (const comment of state.comments) {
    const thread = element("div", "comment-thread");
    thread.dataset.thread = comment.id;
    thread.append(makeArticle(comment));
    if (comment.replies.length) {
      const replies = element("ol", "comment-thread__replies");
      replies.setAttribute("aria-label", `Replies to ${comment.user.username}'s comment`);
      for (const reply of comment.replies) {
        const item = element("li");
        item.append(makeArticle(reply));
        replies.append(item);
      }
      thread.append(replies);
    }
    list.append(thread);
  }
}

function validateContent(input) {
  input.setCustomValidity(input.value.trim() ? "" : "Please write a comment first.");
  return input.reportValidity();
}

function closeActiveForm() {
  if (!activeForm) return;
  const { form, content, trigger } = activeForm;
  form.remove();
  if (content) content.hidden = false;
  activeForm = null;
  trigger.focus();
}

function openForm(comment, trigger, editing) {
  closeActiveForm();
  const article = trigger.closest("article");
  const form = element("form", editing ? "comment__editor" : "comment-form comment-form--reply");
  const fieldId = `${editing ? "edit" : "reply"}-${comment.id}`;
  const label = element("label", "sr-only", editing ? "Edit your comment" : `Reply to ${comment.user.username}`);
  label.htmlFor = fieldId;
  const input = element("textarea", "comment-form__input");
  input.id = fieldId;
  input.name = "comment";
  input.required = true;
  input.maxLength = 5000;
  input.rows = 3;
  input.placeholder = `Reply to @${comment.user.username}...`;
  if (editing) input.value = comment.content;
  const actions = element("div", "editor-actions");
  const cancel = element("button", "button-cancel", "Cancel");
  cancel.type = "button";
  cancel.addEventListener("click", closeActiveForm);
  const submit = element("button", "button-primary", editing ? "Update" : "Reply");
  submit.type = "submit";
  actions.append(cancel, submit);
  if (!editing) form.append(avatar(state.currentUser, 40, "comment-form__avatar"));
  form.append(label, input, actions);
  const content = editing ? article.querySelector(".comment__content") : null;
  if (editing) {
    content.hidden = true;
    article.append(form);
  } else {
    article.after(form);
  }
  activeForm = { form, content, trigger };
  input.focus();
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!validateContent(input)) return;
    let targetId = comment.id;
    if (editing) {
      if (!isOwn(comment)) return;
      comment.content = input.value.trim();
    } else {
      const found = findComment(comment.id);
      const reply = createComment(input.value.trim());
      reply.replyingTo = comment.user.username;
      (found.parent || found.comment).replies.push(reply);
      targetId = reply.id;
    }
    save();
    render();
    focusArticle(targetId);
    announce(editing ? "Comment updated." : "Reply added.");
  });
}

function createComment(content) {
  return {
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    content,
    createdAt: "just now",
    timestamp: Date.now(),
    score: 0,
    vote: 0,
    user: structuredClone(state.currentUser),
    replies: [],
  };
}

function focusArticle(id) {
  const article = [...list.querySelectorAll("article")].find((item) => item.dataset.id === String(id));
  if (article) {
    article.tabIndex = -1;
    article.focus();
  }
}

list.addEventListener("click", (event) => {
  const control = event.target.closest("button[data-action]");
  if (!control) return;
  const found = findComment(control.dataset.id);
  if (!found) return;
  const { comment } = found;
  const action = control.dataset.action;
  if (action === "upvote" || action === "downvote") {
    const desired = action === "upvote" ? 1 : -1;
    const previous = comment.vote || 0;
    comment.vote = previous === desired ? 0 : desired;
    comment.score += comment.vote - previous;
    const article = control.closest("article");
    article.querySelector(".comment__score").textContent = comment.score;
    article.querySelector('[data-action="upvote"]').setAttribute("aria-pressed", String(comment.vote === 1));
    article.querySelector('[data-action="downvote"]').setAttribute("aria-pressed", String(comment.vote === -1));
    state.comments.sort((a, b) => b.score - a.score);
    for (const parent of state.comments) {
      const thread = [...list.children].find((item) => item.dataset.thread === String(parent.id));
      list.append(thread);
    }
    control.focus();
    save();
    announce(`Score: ${comment.score}.`);
  } else if (action === "reply") {
    openForm(comment, control, false);
  } else if (action === "edit" && isOwn(comment)) {
    openForm(comment, control, true);
  } else if (action === "delete" && isOwn(comment)) {
    pendingDelete = comment.id;
    dialogTrigger = control;
    dialog.returnValue = "cancel";
    dialog.showModal();
  }
});

dialog.addEventListener("close", () => {
  if (dialog.returnValue === "confirm" && pendingDelete !== null) {
    const found = findComment(pendingDelete);
    if (found && isOwn(found.comment)) {
      const comments = found.parent ? found.parent.replies : state.comments;
      comments.splice(comments.indexOf(found.comment), 1);
      save();
      render();
      document.querySelector("#new-comment").focus();
      announce("Comment deleted.");
    }
  } else {
    dialogTrigger?.focus();
  }
  pendingDelete = null;
  dialogTrigger = null;
});

document.addEventListener("input", (event) => {
  if (event.target.matches("textarea")) event.target.setCustomValidity("");
});

newCommentForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const input = newCommentForm.elements.comment;
  if (!state || !validateContent(input)) return;
  const comment = createComment(input.value.trim());
  state.comments.push(comment);
  save();
  render();
  newCommentForm.reset();
  focusArticle(comment.id);
  announce("Comment added.");
});

async function initialize() {
  const fallback = readStaticData();
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (isValidState(saved)) state = saved;
  } catch {
    // Invalid or unavailable storage must not prevent the app from loading.
  }
  if (!state) {
    if (location.protocol !== "file:") {
      try {
        const response = await fetch("./data.json");
        if (!response.ok) throw new Error("Unable to load comments");
        const data = await response.json();
        if (!isValidState(data)) throw new Error("Invalid comment data");
        state = data;
      } catch {
        state = fallback;
      }
    } else {
      state = fallback;
    }
  }
  render();
}

initialize();
