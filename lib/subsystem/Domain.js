class Domain {
    constructor() {
        //
    }

    execute(command) {
        try {
            command.execute();
        } catch {
            return;
        }
    }
}

module.exports = Domain;
