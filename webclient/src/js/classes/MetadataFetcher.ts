class MetadataFetcher {
	private readonly getMetadataPromise: Promise<Metadata>;

	public constructor() {
		this.getMetadataPromise = sendGet<Metadata>("/metadata", false);
	}

	public getMetadata(): Promise<Metadata> {
		return this.getMetadataPromise;
	}
}