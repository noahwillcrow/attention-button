class MessageController {
	public constructor(private readonly messageElement: HTMLElement) {
	}

	public setMessage(message: string) {
		const messageElement = document.getElementById("message");
		if (messageElement === null) {
			return;
		}

		messageElement.innerText = message;
	}
}