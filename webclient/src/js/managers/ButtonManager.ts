class ButtonManager {
	private buttonElement: HTMLElement;
	private buttonClickSfxElement: HTMLAudioElement;

	public constructor(private readonly metadataFetcher: MetadataFetcher) {
		this.buttonElement = this.mustGetElementById("button");

		this.buttonClickSfxElement = new Audio("/content/sounds/button-click.wav");
		this.buttonClickSfxElement.load();

		this.updateButtonSizeAndPosition();

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

	private updateButtonSizeAndPosition(): void {
		const buttonDiameter = (window.innerWidth > window.innerHeight ? window.innerHeight : window.innerWidth) * 0.8;

		this.buttonElement.style.top = `${(window.innerHeight - buttonDiameter) / 2}px`;
		this.buttonElement.style.left = `${(window.innerWidth - buttonDiameter) / 2}px`;
		this.buttonElement.style.height = `${buttonDiameter}px`;
		this.buttonElement.style.width = `${buttonDiameter}px`;
	}

	private listenForButtonPresses(): void {
		this.buttonElement.addEventListener("click", () => {
			console.log("button clicked");

			this.buttonClickSfxElement.currentTime = 0;
			this.buttonClickSfxElement.play();

			this.metadataFetcher.getMetadata().then(metadata => sendPost<any>(`${metadata.apiUrlBase}/notifications`, true, undefined, {
				message: "Attention needed!!"
			} as SendNotificationRequest).then(() => console.log("notification sent")));
		});
	}

	private listenForWindowSizeChanges(): void {
		window.addEventListener("resize", () => this.updateButtonSizeAndPosition());
	}
}