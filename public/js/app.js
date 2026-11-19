"use strict";

const STORAGE_KEYS = {
    theme: "taskflow-theme",
    customAccent: "taskflow-custom-accent",
    reminders: "taskflow-reminders",
    updates: "taskflow-updates",
    notificationsRead: "taskflow-notifications-read"
};
const THEME_NAMES = ["default", "dark", "ocean", "forest", "sunset", "purple"];
let lastFocusedElement = null;

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function element(id) {
    return document.getElementById(id);
}

function loadStoredValue(key, fallback, validate) {
    try {
        const stored = localStorage.getItem(key);
        if (stored === null) return fallback;
        const value = JSON.parse(stored);
        if (validate(value)) return value;
        console.error(`Stored TaskFlow data for "${key}" has an invalid format.`);
    } catch (error) {
        console.error(`Unable to read TaskFlow data for "${key}".`, error);
    }
    return fallback;
}

function saveStoredValue(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        console.error(`Unable to save TaskFlow data for "${key}".`, error);
        showToast("Your browser could not save this change. Check its storage settings.", "error");
        return false;
    }
}

function showToast(message, type = "info") {
    const region = element("toastRegion");
    if (!region) return;
    const toast = document.createElement("div");
    const icon = type === "success" ? "fa-circle-check" : type === "error" ? "fa-circle-exclamation" : "fa-circle-info";
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<i class="fa-solid ${icon}" aria-hidden="true"></i><span>${escapeHtml(message)}</span>`;
    region.appendChild(toast);
    window.setTimeout(() => toast.remove(), 3600);
}

function formatDate(dateString) {
    if (!dateString) return "No due date";
    const date = new Date(`${dateString}T00:00:00`);
    return Number.isNaN(date.getTime())
        ? "Invalid date"
        : new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date);
}

function formatStatus(status) {
    return status === "progress" ? "In progress" : status.charAt(0).toUpperCase() + status.slice(1);
}

function applyNotificationReadState() {
    const read = loadStoredValue(STORAGE_KEYS.notificationsRead, false, value => typeof value === "boolean");
    if (!read) return;
    document.querySelectorAll(".notification-dot").forEach(dot => { dot.hidden = true; });
    document.querySelectorAll(".notification-item.unread").forEach(item => {
        item.classList.remove("unread");
        item.querySelector(".notification-unread")?.remove();
    });
}

function setTheme(theme, shouldSave = true) {
    if (!THEME_NAMES.includes(theme) && theme !== "custom") return false;
    document.documentElement.dataset.theme = theme;
    document.querySelectorAll(".theme-card").forEach(card => {
        const active = card.dataset.themeValue === theme;
        card.classList.toggle("active", active);
        card.setAttribute("aria-pressed", String(active));
    });
    if (element("settingsTheme")) element("settingsTheme").value = THEME_NAMES.includes(theme) ? theme : "default";
    if (element("darkModeToggle")) element("darkModeToggle").checked = theme === "dark";
    if (theme !== "custom") document.documentElement.removeAttribute("style");
    if (shouldSave) return saveStoredValue(STORAGE_KEYS.theme, theme);
    return true;
}

function applySavedTheme() {
    const theme = loadStoredValue(STORAGE_KEYS.theme, "default", value => THEME_NAMES.includes(value) || value === "custom");
    if (theme === "custom") {
        const accent = loadStoredValue(STORAGE_KEYS.customAccent, "", value => typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value));
        if (accent) {
            applyCustomTheme(accent, false);
            if (element("accentColor")) element("accentColor").value = accent;
            return;
        }
    }
    setTheme(theme === "custom" ? "default" : theme, false);
}

function applyCustomTheme(color, shouldSave = true) {
    if (!/^#[0-9a-f]{6}$/i.test(color)) {
        showToast("Choose a valid six-digit hex color.", "error");
        return;
    }
    const root = document.documentElement;
    root.dataset.theme = "custom";
    root.style.setProperty("--primary", color);
    root.style.setProperty("--primary-strong", color);
    root.style.setProperty("--primary-soft", `${color}1a`);
    root.style.setProperty("--accent", color);
    document.querySelectorAll(".theme-card").forEach(card => {
        card.classList.remove("active");
        card.setAttribute("aria-pressed", "false");
    });
    if (element("settingsTheme")) element("settingsTheme").value = "default";
    if (element("darkModeToggle")) element("darkModeToggle").checked = false;
    if (shouldSave) {
        const themeSaved = saveStoredValue(STORAGE_KEYS.theme, "custom");
        const colorSaved = saveStoredValue(STORAGE_KEYS.customAccent, color);
        if (themeSaved && colorSaved) showToast("Your custom accent color is ready.", "success");
    }
}

function openModal(id) {
    const modal = element(id);
    if (!modal) return;
    lastFocusedElement = document.activeElement;
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    modal.querySelector("input, button")?.focus();
}

function closeModal(id) {
    const modal = element(id);
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    if (!document.querySelector(".modal:not([hidden])")) document.body.style.overflow = "";
    lastFocusedElement?.focus?.();
}

function clearTaskForm() {
    const form = element("taskForm");
    if (!form) return;
    form.reset();
    element("taskStatus").value = "pending";
    element("taskPriority").value = "medium";
    form.action = "/tasks";
    element("taskPreview").hidden = true;
    element("taskPreview").innerHTML = "";
    element("taskModalTitle").textContent = "Add a task";
    element("taskSubmitLabel").textContent = "Create task";
}

function clearProjectForm() {
    const form = element("projectForm");
    if (!form) return;
    form.reset();
    form.action = "/projects";
    element("projectStatus").value = "Planning";
    [...element("projectMembers").options].forEach(option => { option.selected = false; });
    element("projectModalTitle").textContent = "Create a project";
    element("projectSubmitLabel").textContent = "Create project";
}

async function openProjectModal(projectId = null) {
    const modal = element("projectModal");
    if (!modal) return;
    clearProjectForm();
    if (projectId) {
        const response = await fetch(`/projects/${encodeURIComponent(projectId)}`, {
            headers: { Accept: "application/json" }
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error?.message || "Unable to load this project.");
        const project = result.project;
        element("projectName").value = project.name;
        element("projectDescription").value = project.description;
        element("projectStatus").value = project.status;
        element("projectStartDate").value = project.startDate;
        element("projectDueDate").value = project.dueDate;
        const memberIds = new Set(project.memberIds);
        [...element("projectMembers").options].forEach(option => {
            option.selected = memberIds.has(option.value);
        });
        element("projectForm").action = `/projects/${encodeURIComponent(projectId)}/update`;
        element("projectModalTitle").textContent = "Edit project";
        element("projectSubmitLabel").textContent = "Save changes";
    }
    openModal("projectModal");
}

async function loadTaskAssignees(projectId, selectedId = "") {
    const select = element("taskAssignee");
    if (!select) return;
    const url = projectId ? `/tasks/assignees?projectId=${encodeURIComponent(projectId)}` : "/tasks/assignees";
    const response = await fetch(url, { headers: { Accept: "application/json" } });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error?.message || "Unable to load project members.");
    select.replaceChildren(new Option("Unassigned", ""));
    result.assignees.forEach(person => select.add(new Option(person.name, person.id)));
    select.value = selectedId;
}

async function openTaskModal(taskId = null) {
    if (!element("taskModal")) return;
    clearTaskForm();
    if (taskId) {
        const response = await fetch(`/tasks/${encodeURIComponent(taskId)}`, {
            headers: { Accept: "application/json" }
        });
        const result = await response.json();
        if (!response.ok) {
            showToast(result.error?.message || "That task could not be found.", "error");
            return;
        }
        const task = result.task;
        for (const [field, value] of Object.entries({
            taskTitle: task.title,
            taskDescription: task.description,
            taskDueDate: task.dueDateInput,
            taskProject: task.projectId,
            taskCategory: task.category,
            taskPriority: task.priority,
            taskStatus: task.status,
            taskTags: task.tags.join(", ")
        })) {
            element(field).value = value || "";
        }
        await loadTaskAssignees(task.projectId, task.assignedToId);
        element("taskForm").action = `/tasks/${encodeURIComponent(taskId)}/update`;
        element("taskModalTitle").textContent = "Edit task";
        element("taskSubmitLabel").textContent = "Save changes";
    } else {
        try {
            await loadTaskAssignees("");
        } catch (error) {
            showToast(error.message, "error");
            return;
        }
    }
    openModal("taskModal");
}

function renderTaskPreview() {
    const title = element("taskTitle").value.trim();
    if (!title) {
        showToast("Add a task title before previewing.", "error");
        element("taskTitle").focus();
        return;
    }
    const projectName = element("taskProject").selectedOptions[0]?.textContent || "";
    const priority = element("taskPriority").value;
    const status = element("taskStatus").value;
    const description = element("taskDescription").value.trim();
    const preview = element("taskPreview");
    preview.innerHTML = `<strong>${escapeHtml(title)}</strong>${description ? `<p>${escapeHtml(description)}</p>` : ""}<div class="task-preview-meta"><span><i class="fa-regular fa-calendar"></i> ${formatDate(element("taskDueDate").value)}</span>${projectName && element("taskProject").value ? `<span><i class="fa-regular fa-folder"></i> ${escapeHtml(projectName)}</span>` : ""}<span class="priority-badge priority-${priority}">${priority} priority</span><span class="status-badge status-${status}">${formatStatus(status)}</span></div>`;
    preview.hidden = false;
}

function updatePreference(key, value) {
    return saveStoredValue(key, value);
}

function handleAction(action, target) {
    switch (action) {
        case "toggle-public-menu": {
            const nav = element("siteNav");
            const open = nav.classList.toggle("is-open");
            target.setAttribute("aria-expanded", String(open));
            break;
        }
        case "toggle-sidebar": {
            const shell = document.querySelector(".app-shell");
            const open = shell.classList.toggle("sidebar-open");
            target.setAttribute("aria-expanded", String(open));
            break;
        }
        case "close-sidebar":
            document.querySelector(".app-shell")?.classList.remove("sidebar-open");
            document.querySelector(".app-menu-toggle")?.setAttribute("aria-expanded", "false");
            break;
        case "add-task":
            openTaskModal().catch(error => showToast(error.message, "error"));
            break;
        case "preview-task": renderTaskPreview(); break;
        case "edit-task":
            openTaskModal(target.dataset.taskId).catch(error => showToast(error.message, "error"));
            break;
        case "add-project":
            openProjectModal().catch(error => showToast(error.message, "error"));
            break;
        case "edit-project":
            openProjectModal(target.dataset.projectId).catch(error => showToast(error.message, "error"));
            break;
        case "set-theme":
            if (setTheme(target.dataset.themeValue)) showToast("Workspace theme updated.", "success");
            break;
        case "save-custom-theme":
            applyCustomTheme(element("accentColor").value);
            break;
        case "mark-notifications-read":
            if (updatePreference(STORAGE_KEYS.notificationsRead, true)) {
                applyNotificationReadState();
                showToast("You're all caught up.", "success");
            }
            break;
        case "show-demo-note":
            showToast("Tasks are stored in your authenticated workspace. Preferences are saved in this browser.");
            break;
        case "toggle-team-form": {
            const panel = document.getElementById("teamFormPanel");
            if (!panel) break;
            panel.classList.toggle("hidden");
            break;
        }
        case "close-modal": closeModal(target.dataset.modal); break;
    }
}

function initialize() {
    applySavedTheme();
    applyNotificationReadState();
    if (element("remindersToggle")) element("remindersToggle").checked = loadStoredValue(STORAGE_KEYS.reminders, true, value => typeof value === "boolean");
    if (element("updatesToggle")) element("updatesToggle").checked = loadStoredValue(STORAGE_KEYS.updates, true, value => typeof value === "boolean");

    document.addEventListener("click", event => {
        const actionTarget = event.target.closest("[data-action]");
        if (actionTarget) handleAction(actionTarget.dataset.action, actionTarget);
        if (event.target.closest(".site-nav a")) {
            element("siteNav")?.classList.remove("is-open");
            document.querySelector(".site-menu-toggle")?.setAttribute("aria-expanded", "false");
        }
    });
    element("taskForm")?.addEventListener("input", () => {
        if (element("taskPreview") && !element("taskPreview").hidden) renderTaskPreview();
    });
    element("taskForm")?.addEventListener("change", () => {
        if (element("taskPreview") && !element("taskPreview").hidden) renderTaskPreview();
    });
    element("contactForm")?.addEventListener("submit", event => {
        event.preventDefault();
        event.currentTarget.reset();
        showToast("Thanks for reaching out. This demo form is not connected to a mail service.");
    });
    element("taskProject")?.addEventListener("change", event => {
        loadTaskAssignees(event.currentTarget.value).catch(error => showToast(error.message, "error"));
    });
    element("projectStartDate")?.addEventListener("change", event => {
        element("projectDueDate").min = event.currentTarget.value;
    });
    element("projectDueDate")?.addEventListener("change", event => {
        element("projectStartDate").max = event.currentTarget.value;
    });
    document.addEventListener("submit", event => {
        const form = event.target.closest("[data-confirm-delete]");
        if (form && !window.confirm(`Delete "${form.dataset.confirmDelete}"? This cannot be undone.`)) {
            event.preventDefault();
        }
    });
    element("settingsTheme")?.addEventListener("change", event => setTheme(event.currentTarget.value));
    element("darkModeToggle")?.addEventListener("change", event => setTheme(event.currentTarget.checked ? "dark" : "default"));
    element("remindersToggle")?.addEventListener("change", event => updatePreference(STORAGE_KEYS.reminders, event.currentTarget.checked));
    element("updatesToggle")?.addEventListener("change", event => updatePreference(STORAGE_KEYS.updates, event.currentTarget.checked));
    document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            document.querySelectorAll(".modal:not([hidden])").forEach(modal => closeModal(modal.id));
            document.querySelector(".app-shell")?.classList.remove("sidebar-open");
            element("siteNav")?.classList.remove("is-open");
            document.querySelector(".site-menu-toggle")?.setAttribute("aria-expanded", "false");
        }
        if (event.key === "Tab") {
            const modal = document.querySelector(".modal:not([hidden])");
            if (modal) {
                const focusable = [...modal.querySelectorAll("button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]")];
                if (event.shiftKey && document.activeElement === focusable[0]) {
                    event.preventDefault();
                    focusable.at(-1)?.focus();
                } else if (!event.shiftKey && document.activeElement === focusable.at(-1)) {
                    event.preventDefault();
                    focusable[0]?.focus();
                }
            }
        }
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "n" && element("taskModal")) {
            event.preventDefault();
            openTaskModal().catch(error => showToast(error.message, "error"));
        }
    });
}

document.addEventListener("DOMContentLoaded", initialize);
