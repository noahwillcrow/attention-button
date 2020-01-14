class ButtonManager {
    private buttonContainerElement: HTMLElement;
    private buttonElement: HTMLElement;

    public constructor() {
        this.buttonContainerElement = this.mustGetElementById("button-container");
        this.buttonElement = this.mustGetElementById("button");

        this.listenForButtonPresses();
        this.listenForWindowSizeChanges();
    }

    private mustGetElementById(id: string): HTMLElement {
        const element = document.getElementById(id);
        if (element === null) {
            throw `No element with id "${id}"`
        }

        return element;
    }

    private listenForButtonPresses(): void {
        this.buttonElement.addEventListener("click", (ev: MouseEvent) => {
            console.log("button clicked");
        });
    }

    private listenForWindowSizeChanges(): void {
        window.addEventListener("resize", (ev: Event) => {

        });
    }
}