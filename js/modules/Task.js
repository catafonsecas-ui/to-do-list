export class Task {
    constructor(texto, deadline = null, prioridad = 'media', proyecto = null) {
        this.texto = texto;
        this.completada = false;
        this.deadline = deadline;
        this.prioridad = prioridad;
        this.proyecto = proyecto;
        this.subtasks = [];
        this.descripcion = '';
        this.recordatorio = null; // Hora para enviar la notificación
        this.id = Date.now().toString(); // ID único para la tarea
    }

    toggle() {
        this.completada = !this.completada;
        return this.completada;
    }

    updateText(newText) {
        this.texto = newText;
    }

    addSubtask(texto) {
        this.subtasks.push({
            texto,
            completada: false
        });
    }

    toggleSubtask(index) {
        if (this.subtasks[index]) {
            this.subtasks[index].completada = !this.subtasks[index].completada;
            return this.subtasks[index].completada;
        }
        return false;
    }

    updateSubtask(index, texto) {
        if (this.subtasks[index]) {
            this.subtasks[index].texto = texto;
            return true;
        }
        return false;
    }

    removeSubtask(index) {
        if (index >= 0 && index < this.subtasks.length) {
            this.subtasks.splice(index, 1);
            return true;
        }
        return false;
    }
}