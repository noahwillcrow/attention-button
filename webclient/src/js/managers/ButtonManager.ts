class ButtonManager {
	private buttonElement: HTMLElement;
	private buttonClickSfxElement: HTMLAudioElement;
	private messageInputElement: HTMLInputElement;

	public constructor(private readonly metadataFetcher: MetadataFetcher) {
		this.buttonElement = this.mustGetElementById<HTMLDivElement>("button");
		this.messageInputElement = this.mustGetElementById<HTMLInputElement>("button");

		this.buttonClickSfxElement = new Audio("/content/sounds/button-click.wav");
		this.buttonClickSfxElement.load();

		this.updateButtonSizeAndPosition();

		this.listenForButtonPresses();
		this.listenForWindowSizeChanges();
	}

	private mustGetElementById<T extends HTMLElement>(id: string): T {
		const element = document.getElementById(id) as T;
		if (element === null) {
			throw `No element with id "${id}"`
		}

		return element;
	}

	private updateButtonSizeAndPosition(): void {
		const buttonDiameter = ((window.innerWidth > window.innerHeight ? window.innerHeight : window.innerWidth) - 60) * 0.8;

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

			const message = this.messageInputElement.textContent !== null ? this.messageInputElement.textContent : "Attention needed!!";
			this.metadataFetcher.getMetadata().then(metadata => sendPost<any>(`${metadata.apiUrlBase}/notifications`, true, undefined, {
				message: message
			} as SendNotificationRequest).then(() => console.log("notification sent")));
		});
	}

	private listenForWindowSizeChanges(): void {
		window.addEventListener("resize", () => this.updateButtonSizeAndPosition());
	}
}