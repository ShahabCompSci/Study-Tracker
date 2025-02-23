// DOM Elements
const taskForm = document.getElementById('taskForm');
const taskList = document.getElementById('taskList');
const notesArea = document.getElementById('notes');
const themeToggle = document.getElementById('toggleTheme');
const prioritySelect = document.getElementById('prioritySelect');

// Stored Data
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let taskNotes = JSON.parse(localStorage.getItem('taskNotes')) || {};

// RENDER on load
renderTasks();

// FORM SUBMIT
taskForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const taskInput = document.getElementById('taskInput');
  const taskText = taskInput.value.trim();
  const priority = prioritySelect.value;

  if (taskText !== '') {
    const newTask = {
      id: Date.now(),
      text: taskText,
      completed: false,
      priority: priority
    };
    tasks.push(newTask);
    saveTasks();
    renderTasks();
    taskInput.value = '';
  }
});

// SAVE to localStorage
function saveTasks() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
  localStorage.setItem('taskNotes', JSON.stringify(taskNotes));
}

// RENDER Tasks
function renderTasks() {
  taskList.innerHTML = '';

  tasks.forEach((task, i) => {
    // Wrapper includes numbering + the task box
    const wrapper = document.createElement('div');
    wrapper.classList.add('task-wrapper');

    // Numbering
    const indexSpan = document.createElement('span');
    indexSpan.classList.add('task-index');
    indexSpan.textContent = `${i + 1}.`;

    // Task box
    const taskElement = document.createElement('div');
    taskElement.classList.add('task');
    if (task.completed) taskElement.classList.add('completed');

    // For reorder logic, store original index
    taskElement.setAttribute('data-id', task.id);
    taskElement.setAttribute('data-index', i);

    // Task Content
    const contentDiv = document.createElement('div');
    contentDiv.classList.add('task-content');
    contentDiv.innerHTML = `
      <strong>${task.text}</strong>
      <small>Priority: ${task.priority}</small>
    `;

    // Task Actions
    const actionsDiv = document.createElement('div');
    actionsDiv.classList.add('task-actions');
    actionsDiv.innerHTML = `
      <button class="complete-btn">✔️</button>
      <button class="delete-btn">🗑️</button>
    `;

    // COMPLETE
    actionsDiv.querySelector('.complete-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      task.completed = !task.completed;
      saveTasks();
      renderTasks();
    });

    // DELETE
    actionsDiv.querySelector('.delete-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      tasks = tasks.filter((t) => t.id !== task.id);
      saveTasks();
      renderTasks();
    });

    // Clicking the task (not icons) loads its notes
    taskElement.addEventListener('click', (e) => {
      if (!e.target.classList.contains('complete-btn') &&
          !e.target.classList.contains('delete-btn')) {
        loadNotes(task.id);
      }
    });

    taskElement.appendChild(contentDiv);
    taskElement.appendChild(actionsDiv);

    wrapper.appendChild(indexSpan);
    wrapper.appendChild(taskElement);

    enableDrag(taskElement);
    taskList.appendChild(wrapper);
  });
}

// LOAD notes for selected task
function loadNotes(taskId) {
  notesArea.value = taskNotes[taskId] || '';
  notesArea.oninput = () => {
    taskNotes[taskId] = notesArea.value;
    saveTasks();
  };
}

// THEME SWITCH
themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark-theme');
});

// REORDERS LOGIC VIA DRAG END

// Helper: move array item from oldIndex to newIndex
function arrayMove(arr, fromIndex, toIndex) {
  const item = arr.splice(fromIndex, 1)[0];
  arr.splice(toIndex, 0, item);
}

// Drag-and-drop with Interact.js
function enableDrag(element) {
  let originalIndex = 0; 
  let startY = 0;        

  interact(element).draggable({
    listeners: {
      start(event) {
        element.classList.add('dragging');
        originalIndex = parseInt(element.getAttribute('data-index'), 10);
        startY = event.clientY;
      },
      move(event) {
        const target = event.target;
        const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;
        target.style.transform = `translateY(${y}px)`;
        target.setAttribute('data-y', y);
      },
      end(event) {
        element.classList.remove('dragging');
        element.style.transform = '';
        element.setAttribute('data-y', 0);

        // Determine how far we moved vertically
        const endY = event.clientY;
        const delta = endY - startY;

        // Each task is ~80px + margin => ~90 for each slot
        const slotSize = 90;
        let offsetSlots = Math.round(delta / slotSize);

        // Compute new index
        const newIndex = Math.min(
          Math.max(originalIndex + offsetSlots, 0),
          tasks.length - 1
        );

        if (newIndex !== originalIndex) {
          arrayMove(tasks, originalIndex, newIndex);
          saveTasks();
          renderTasks();
        }
      }
    }
  });
}
