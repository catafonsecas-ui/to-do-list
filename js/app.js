import { TaskList } from './modules/TaskList.js';
import { UI } from './modules/UI.js';
import { Notifications } from './modules/Notifications.js';

// Inicialización de la aplicación
document.addEventListener('DOMContentLoaded', () => {
    const notifications = new Notifications();
    const taskList = new TaskList(notifications);
    const ui = new UI(taskList, notifications);
    ui.render();
    notifications.startChecking(taskList);
});