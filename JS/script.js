// Mobile menu toggle
function toggleMobileMenu() {
    const navMenu = document.getElementById('nav-menu');
    navMenu.classList.toggle('active');
}

// Modal functions
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Close modal when clicking outside
window.onclick = function (event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });
}

// Form handlers
function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    // Simulate login process
    alert(`Welcome back! Logging in with email: ${email}`);
    closeModal('loginModal');

    // Here you would typically send the data to your backend
    console.log('Login attempt:', { email, password });
}

function handleRegister(event) {
    event.preventDefault();
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) {
        alert('Passwords do not match!');
        return;
    }

    // Simulate registration process
    alert(`Welcome to TaskFlow, ${name}! Account created successfully.`);
    closeModal('registerModal');

    // Here you would typically send the data to your backend
    console.log('Registration attempt:', { name, email, password });
}

// Task Management Functions
let selectedPriority = 'medium';
let selectedStatus = 'pending';
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

function addNewTask() {
    openModal('addTaskModal');
    // Set default due date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('dueDate').value = tomorrow.toISOString().split('T')[0];
}

function selectPriority(priority) {
    selectedPriority = priority;
    document.querySelectorAll('.priority-option').forEach(option => {
        option.classList.remove('selected');
    });
    document.querySelector(`[data-priority="${priority}"]`).classList.add('selected');
    updatePreview();
}

function selectStatus(status) {
    selectedStatus = status;
    document.querySelectorAll('.status-option').forEach(option => {
        option.classList.remove('selected');
    });
    document.querySelector(`[data-status="${status}"]`).classList.add('selected');
    updatePreview();
}

function updatePreview() {
    const title = document.getElementById('taskTitle').value;
    if (title) {
        previewTask();
    }
}

function previewTask() {
    const title = document.getElementById('taskTitle').value;
    const description = document.getElementById('taskDescription').value;
    const assignTo = document.getElementById('assignTo').value;
    const duration = document.getElementById('taskDuration').value;
    const dueDate = document.getElementById('dueDate').value;
    const category = document.getElementById('taskCategory').value;
    const tags = document.getElementById('taskTags').value;

    if (!title) {
        showNotification('Please enter a task title first', 'error');
        return;
    }

    const preview = document.getElementById('taskPreview');
    const previewContent = document.getElementById('previewContent');
    const previewMeta = document.getElementById('previewMeta');

    previewContent.innerHTML = `
                <strong>${title}</strong>
                ${description ? `<p style="margin: 0.5rem 0; opacity: 0.8;">${description}</p>` : ''}
            `;

    const assigneeName = assignTo ? document.querySelector(`option[value="${assignTo}"]`).textContent : 'Unassigned';
    const formattedDate = dueDate ? new Date(dueDate).toLocaleDateString() : 'No due date';

    previewMeta.innerHTML = `
                <span><i class="fas fa-user"></i> ${assigneeName}</span>
                <span><i class="fas fa-calendar"></i> ${formattedDate}</span>
                ${duration ? `<span><i class="fas fa-clock"></i> ${duration}h</span>` : ''}
                ${category ? `<span><i class="fas fa-folder"></i> ${category}</span>` : ''}
                <span class="task-priority priority-${selectedPriority}">${selectedPriority.toUpperCase()}</span>
                <span class="status-badge status-${selectedStatus}">${selectedStatus.toUpperCase()}</span>
            `;

    preview.style.display = 'block';
    preview.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function handleAddTask(event) {
    event.preventDefault();

    const taskData = {
        id: Date.now().toString(),
        title: document.getElementById('taskTitle').value,
        description: document.getElementById('taskDescription').value,
        assignTo: document.getElementById('assignTo').value,
        duration: parseFloat(document.getElementById('taskDuration').value) || 0,
        dueDate: document.getElementById('dueDate').value,
        category: document.getElementById('taskCategory').value,
        priority: selectedPriority,
        status: selectedStatus,
        tags: document.getElementById('taskTags').value.split(',').map(tag => tag.trim()).filter(tag => tag),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    // Validate required fields
    if (!taskData.title) {
        showNotification('Task title is required', 'error');
        return;
    }

    // Add task to storage
    tasks.push(taskData);
    localStorage.setItem('tasks', JSON.stringify(tasks));

    // Update dashboard
    updateTaskStats();
    addTaskToList(taskData);

    // Show success message
    const assigneeName = taskData.assignTo ?
        document.querySelector(`option[value="${taskData.assignTo}"]`).textContent : 'yourself';

    showNotification(
        `Task "${taskData.title}" created and assigned to ${assigneeName}!`,
        'success'
    );

    // Reset form and close modal
    resetTaskForm();
    closeModal('addTaskModal');
}

function resetTaskForm() {
    document.querySelector('.task-form').reset();
    selectedPriority = 'medium';
    selectedStatus = 'pending';

    // Reset priority selection
    document.querySelectorAll('.priority-option').forEach(option => {
        option.classList.remove('selected');
    });
    document.querySelector('[data-priority="medium"]').classList.add('selected');

    // Reset status selection
    document.querySelectorAll('.status-option').forEach(option => {
        option.classList.remove('selected');
    });
    document.querySelector('[data-status="pending"]').classList.add('selected');

    // Hide preview
    document.getElementById('taskPreview').style.display = 'none';
}

function updateTaskStats() {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'completed').length;
    const inProgressTasks = tasks.filter(task => task.status === 'progress').length;
    const overdueTasks = tasks.filter(task => {
        if (!task.dueDate) return false;
        const dueDate = new Date(task.dueDate);
        const today = new Date();
        return dueDate < today && task.status !== 'completed';
    }).length;

    // Update stat cards
    const statCards = document.querySelectorAll('.stat-number');
    if (statCards.length >= 4) {
        statCards[0].textContent = totalTasks;
        statCards[1].textContent = completedTasks;
        statCards[2].textContent = inProgressTasks;
        statCards[3].textContent = overdueTasks;
    }
}

function addTaskToList(task) {
    const taskList = document.querySelector('.task-list');
    const taskItem = document.createElement('div');
    taskItem.className = 'task-item';
    taskItem.setAttribute('data-task-id', task.id);

    const assigneeName = task.assignTo ?
        document.querySelector(`option[value="${task.assignTo}"]`)?.textContent || 'Unknown' :
        'Unassigned';

    const dueDate = task.dueDate ?
        new Date(task.dueDate).toLocaleDateString() :
        'No due date';

    taskItem.innerHTML = `
                <div>
                    <strong>${task.title}</strong>
                    <br>
                    <small>
                        <i class="fas fa-user"></i> ${assigneeName} | 
                        <i class="fas fa-calendar"></i> ${dueDate}
                        ${task.duration ? ` | <i class="fas fa-clock"></i> ${task.duration}h` : ''}
                    </small>
                </div>
                <div style="display: flex; gap: 0.5rem; align-items: center;">
                    <span class="task-priority priority-${task.priority}">${task.priority.toUpperCase()}</span>
                    <button class="btn btn-primary" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;" 
                            onclick="editTask('${task.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
            `;

    // Insert at the beginning of the task list (after the header)
    const firstTask = taskList.querySelector('.task-item');
    if (firstTask) {
        taskList.insertBefore(taskItem, firstTask);
    } else {
        taskList.appendChild(taskItem);
    }
}

function editTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Populate form with task data
    document.getElementById('taskTitle').value = task.title;
    document.getElementById('taskDescription').value = task.description || '';
    document.getElementById('assignTo').value = task.assignTo || '';
    document.getElementById('taskDuration').value = task.duration || '';
    document.getElementById('dueDate').value = task.dueDate || '';
    document.getElementById('taskCategory').value = task.category || '';
    document.getElementById('taskTags').value = task.tags.join(', ');

    selectedPriority = task.priority;
    selectedStatus = task.status;

    // Update UI selections
    selectPriority(task.priority);
    selectStatus(task.status);

    // Change modal title and button
    document.querySelector('#addTaskModal h2').innerHTML =
        '<i class="fas fa-edit"></i> Edit Task';
    document.querySelector('#addTaskModal .form-submit').innerHTML =
        '<i class="fas fa-save"></i> Update Task';

    // Store task ID for update
    document.getElementById('addTaskModal').setAttribute('data-editing-task', taskId);

    openModal('addTaskModal');
}

// Add real-time form validation
document.addEventListener('DOMContentLoaded', function () {
    const taskTitle = document.getElementById('taskTitle');
    if (taskTitle) {
        taskTitle.addEventListener('input', updatePreview);
    }

    // Load existing tasks on page load
    updateTaskStats();
});

// Add keyboard shortcuts for task modal
document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey) {
        if (e.key === 'n') {
            e.preventDefault();
            addNewTask();
        }
    }
});

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Scroll animations
function animateOnScroll() {
    const elements = document.querySelectorAll('.animate-on-scroll');
    elements.forEach(element => {
        const elementTop = element.getBoundingClientRect().top;
        const elementVisible = 150;

        if (elementTop < window.innerHeight - elementVisible) {
            element.classList.add('animated');
        }
    });
}

// Initialize scroll animations
window.addEventListener('scroll', animateOnScroll);
window.addEventListener('load', animateOnScroll);

// Add some interactive features
document.addEventListener('DOMContentLoaded', function () {
    // Animate stats on scroll
    const statNumbers = document.querySelectorAll('.stat-number');

    function animateStats() {
        statNumbers.forEach(stat => {
            const rect = stat.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom > 0) {
                const finalNumber = parseInt(stat.textContent);
                let currentNumber = 0;
                const increment = finalNumber / 50;

                const timer = setInterval(() => {
                    currentNumber += increment;
                    if (currentNumber >= finalNumber) {
                        stat.textContent = finalNumber;
                        clearInterval(timer);
                    } else {
                        stat.textContent = Math.floor(currentNumber);
                    }
                }, 30);
            }
        });
    }

    window.addEventListener('scroll', animateStats);

    // Add hover effects to feature cards
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach(card => {
        card.addEventListener('mouseenter', function () {
            this.style.transform = 'translateY(-10px) scale(1.02)';
        });

        card.addEventListener('mouseleave', function () {
            this.style.transform = 'translateY(-10px) scale(1)';
        });
    });

    // Add typing effect to hero title
    const heroTitle = document.querySelector('.hero h1');
    const originalText = heroTitle.textContent;
    heroTitle.textContent = '';

    let i = 0;
    function typeWriter() {
        if (i < originalText.length) {
            heroTitle.textContent += originalText.charAt(i);
            i++;
            setTimeout(typeWriter, 100);
        }
    }

    setTimeout(typeWriter, 1000);
});

// Add keyboard navigation
document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
        const openModals = document.querySelectorAll('.modal[style*="block"]');
        openModals.forEach(modal => {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        });
    }
});

// Add search functionality (placeholder)
function searchTasks() {
    const searchTerm = prompt('Search tasks:');
    if (searchTerm) {
        alert(`Searching for: "${searchTerm}"`);
        // Here you would implement actual search functionality
    }
}

// Add notification system
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
                position: fixed;
                top: 100px;
                right: 20px;
                background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
                color: white;
                padding: 1rem 2rem;
                border-radius: 5px;
                z-index: 3000;
                animation: slideInRight 0.3s ease;
            `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Add CSS for notification animation
const style = document.createElement('style');
style.textContent = `
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
document.head.appendChild(style);

// Theme Management
let currentTheme = 'default';

function changeTheme(themeName) {
    currentTheme = themeName;
    document.documentElement.setAttribute('data-theme', themeName);

    // Update active theme option
    document.querySelectorAll('.theme-option').forEach(option => {
        option.classList.remove('active');
    });
    document.querySelector(`[data-theme="${themeName}"]`).classList.add('active');

    // Save theme preference
    localStorage.setItem('preferred-theme', themeName);

    // Show notification
    // showNotification(`Theme changed to ${themeName.charAt(0).toUpperCase() + themeName.slice(1)}`, 'success');
}

function updateCustomTheme() {
    const primaryColor = document.getElementById('primaryColor').value;
    const secondaryColor = document.getElementById('secondaryColor').value;
    const accentColor = document.getElementById('accentColor').value;
    const bgColor = document.getElementById('bgColor').value;

    // Apply custom theme
    const root = document.documentElement;
    root.style.setProperty('--primary-color', primaryColor);
    root.style.setProperty('--secondary-color', secondaryColor);
    root.style.setProperty('--accent-color', accentColor);
    root.style.setProperty('--bg-color', bgColor);

    // Determine text color based on background brightness
    const textColor = isLightColor(bgColor) ? '#333333' : '#f9fafb';
    const cardBg = isLightColor(bgColor) ? '#ffffff' : '#374151';
    const sectionBg = isLightColor(bgColor) ? '#f8f9fa' : '#111827';

    root.style.setProperty('--text-color', textColor);
    root.style.setProperty('--card-bg', cardBg);
    root.style.setProperty('--section-bg', sectionBg);

    currentTheme = 'custom';
    document.documentElement.setAttribute('data-theme', 'custom');
}

function isLightColor(color) {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return brightness > 155;
}

function isLightColor(color) {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return brightness > 155;
}

function saveCustomTheme() {
    const customTheme = {
        primary: document.getElementById('primaryColor').value,
        secondary: document.getElementById('secondaryColor').value,
        accent: document.getElementById('accentColor').value,
        background: document.getElementById('bgColor').value
    };

    localStorage.setItem('custom-theme', JSON.stringify(customTheme));
    showNotification('Custom theme saved successfully!', 'success');
}

function resetCustomTheme() {
    document.getElementById('primaryColor').value = '#667eea';
    document.getElementById('secondaryColor').value = '#764ba2';
    document.getElementById('accentColor').value = '#ffd700';
    document.getElementById('bgColor').value = '#ffffff';

    changeTheme('default');
    showNotification('Theme reset to default', 'info');
}

function toggleThemePanel() {
    const themesSection = document.getElementById('themes');
    themesSection.scrollIntoView({ behavior: 'smooth' });
}

// Load saved theme on page load
document.addEventListener('DOMContentLoaded', function () {
    const savedTheme = localStorage.getItem('preferred-theme');
    const savedCustomTheme = localStorage.getItem('custom-theme');

    if (savedCustomTheme && savedTheme === 'custom') {
        const customTheme = JSON.parse(savedCustomTheme);
        document.getElementById('primaryColor').value = customTheme.primary;
        document.getElementById('secondaryColor').value = customTheme.secondary;
        document.getElementById('accentColor').value = customTheme.accent;
        document.getElementById('bgColor').value = customTheme.background;
        updateCustomTheme();
    } else if (savedTheme) {
        changeTheme(savedTheme);
    }

    // Add theme transition class after page load
    setTimeout(() => {
        document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease';
    }, 100);
});

// Add keyboard shortcuts for theme switching
document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
            case '1':
                e.preventDefault();
                changeTheme('default');
                break;
            case '2':
                e.preventDefault();
                changeTheme('dark');
                break;
            case '3':
                e.preventDefault();
                changeTheme('ocean');
                break;
            case '4':
                e.preventDefault();
                changeTheme('forest');
                break;
            case '5':
                e.preventDefault();
                changeTheme('sunset');
                break;
            case '6':
                e.preventDefault();
                changeTheme('purple');
                break;
        }
    }
});