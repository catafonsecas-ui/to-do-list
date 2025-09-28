export class Task {
    constructor(text) {
        this.id = Date.now().toString();
        this.text = text;
        this.completed = false;
        this.deadline = null;
        this.priority = 'medium';
        this.project = null;
        this.subtasks = [];
        this.reminder = null;
    }

    toggle() {
        this.completed = !this.completed;
    }

    updateText(newText) {
        this.text = newText;
    }

    addSubtask(text) {
        this.subtasks.push({ text, completed: false });
    }

    toggleSubtask(index) {
        if (this.subtasks[index]) {
            this.subtasks[index].completed = !this.subtasks[index].completed;
        }
    }

    updateSubtask(index, text) {
        if (this.subtasks[index]) {
            this.subtasks[index].text = text;
        }
    }

    removeSubtask(index) {
        this.subtasks.splice(index, 1);
    }
}