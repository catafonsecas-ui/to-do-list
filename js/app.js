import { TaskList } from './modules/TaskList.js';
import { UI } from './modules/UI.js';

// Inicialización de la aplicación
document.addEventListener('DOMContentLoaded', () => {
    const taskList = new TaskList();
    const ui = new UI(taskList);
    ui.render();
});