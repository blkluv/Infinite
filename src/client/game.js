class InfinityArcadeGame {
    constructor(ia, game) {
        this.ia = ia;
        this.ui = ia.ui;
        this.game = game;

        this.chat_id = null;
        this.parent_id = null;
        this.streaming = false;

        this.game_ui_loaded = false;
    }

    async streamFinished() {
        this.streaming = false;
        this.ui.showChatInput();

        // TODO: can optionally add in scene images...it's kinda fun but pretty slow/expensive and might be more useful when a better image API is available
        // this.ui.addSceneImage(this.chat_id);
    }

    async handleStream(stream) {
        this.streaming = true;
        for await (const response of stream) {
            await this.handleStreamObject(response);
        }
    }

    async handleStreamObject(obj) {
        if (!this.game_ui_loaded) {
            this.ui.enableGameUI();
            this.game_ui_loaded = true;
        }

        if (this.ui.loading) {
            this.ui.stopLoading();
        }

        if (!obj) return;

        if (obj.type == "content") {
            this.ui.addText(obj.content);
        } else if (obj.type.indexOf("option") == 0) {
            this.ui.addOptionText(obj.type, obj.content);
        } else if (obj.type == "end") {
            this.chat_id = obj.chat_id;
            this.parent_id = obj.parent_id;
            await this.streamFinished();
        } else {
            console.log("UNKNOWN STREAM OBJ", JSON.stringify(obj));
        }
    }


    async start() {
        console.log(`Starting game: ${this.game.title}`);

        this.ui.enableGameUI();
        this.game_ui_loaded = true;
        await this.handleStream(this.ia.api.startGame(this.game, this.ia.session_id));
    }

    async handleOptionClick(event) {
        event.preventDefault();
        const el = event.target;
        if (!el) return;

        if (this.ui.loading || this.streaming) {
            console.log("Already loading");
            return;
        }

        if (!this.chat_id) {
            this.start();
            return;
        }

        await this.chat(el.innerText);
    }


    async handleChatSubmit(event) {
        event.preventDefault();
        await this.chat(this.ui.chat_input.value);
    }

    async chat(input) {
        this.ui.startLoading();
        await this.handleStream(this.ia.api.chat(this.chat_id, input));
    }

    async setup() {
        this.ui.button1.onclick = this.handleOptionClick.bind(this);
        this.ui.button2.onclick = this.handleOptionClick.bind(this);
        this.ui.button3.onclick = this.handleOptionClick.bind(this);
        this.ui.button4.onclick = this.handleOptionClick.bind(this);
        this.ui.chat_form.onsubmit = this.handleChatSubmit.bind(this);

        this.ui.image.onload = (e) => {
            this.ui.hideImageLoader();
        };

        window.onkeydown = (e) => {
            switch (e.key) {
                case "1":
                    e.preventDefault();
                    this.ui.button1.click();
                    break;
                case "2":
                    e.preventDefault();
                    this.ui.button2.click();
                    break;
                case "3":
                    e.preventDefault();
                    this.ui.button3.click();
                    break;
                case "4":
                    e.preventDefault();
                    this.ui.button4.click();
                    break;
            }
        };
    }
}

module.exports = InfinityArcadeGame;
