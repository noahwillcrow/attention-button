class DomLogger {
	public constructor(private readonly logElement: HTMLElement) {
	}

	public logInfo(message: string) {
		this.logMessage(message, "info");
	}

	public logWarning(message: string) {
		this.logMessage(message, "warn");
	}

	public logError(message: string) {
		this.logMessage(message, "error");
	}
	
	private logMessage(message: string, messageType: string) {
		const infoNode = document.createElement("span");
		infoNode.className = `${messageType}-message`;
		infoNode.innerText = message;

		this.logElement.appendChild(infoNode);
	}
}