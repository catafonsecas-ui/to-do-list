export class Task {
    constructor(texto) {
        this.id = Date.now().toString();
        this.texto = texto;
        this.completada = false;
        this.deadline = null;
        this.prioridad = 'media';
        this.proyecto = null;
        this.subtasks = [];
        this.recordatorio = null;
    }

    toggle() {
        this.completada = !this.completada;
    }

    updateText(newText) {
        this.texto = newText;
    }

    addSubtask(texto) {
        this.subtasks.push({ texto, completada: false });
    }

    toggleSubtask(index) {
        if (this.subtasks[index]) {
            this.subtasks[index].completada = !this.subtasks[index].completada;
        }
    }

    updateSubtask(index, texto) {
        if (this.subtasks[index]) {
            this.subtasks[index].texto = texto;
        }
    }

    removeSubtask(index) {
        this.subtasks.splice(index, 1);
    }
}
